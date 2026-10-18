import { Router, Response } from 'express';
import { requireAdmin, AuthenticatedRequest } from '../auth/middleware.js';
import {
  getChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getStreamSources,
  getAdSlots,
  updateAdSlot,
  getAppearanceConfigs,
  updateAppearanceConfigs,
  getSubscribers,
  createSubscriber,
  updateSubscriber,
  getSubscriptionPlans,
  getSubscriptionPlanById,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getPaymentConfigs,
  updatePaymentConfigs,
  getAccessModes,
  updateAccessModes,
  getAuditLogs,
  createAuditLog,
  getPlaybackStatistics,
  terminateSessionByAdmin,
  getManualOrders,
  getManualOrderById,
  approveManualOrder,
  rejectManualOrder,
  getFinancialHistory
} from '../db/repository.js';
import { validateStreamUrl } from '../utils/security.js';
import { isPostgresActive } from '../db/postgres.js';

const router = Router();

// Protect all /api/admin/* routes with requireAdmin middleware
router.use('/admin', requireAdmin);

// ==========================================
// ==========================================
// 1. CHANNELS (CRUD COM VALIDAÇÃO ANTI-SSRF)
// ==========================================
router.get('/admin/channels', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const channels = await getChannels(false);
    res.json(channels);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao listar canais' });
  }
});

router.post('/admin/channels', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      number,
      name,
      category_id,
      logo_url,
      stream_url,
      alternative_streams,
      resolution,
      aspect_ratio,
      current_program,
      current_program_time,
      status,
      access_permission,
      is_locked,
      description
    } = req.body;

    if (!name || !category_id || !stream_url) {
      res.status(400).json({ error: 'Nome, categoria e URL de transmissão são obrigatórios' });
      return;
    }

    // SSRF Security Validation on Primary Stream URL
    const mainUrlCheck = validateStreamUrl(stream_url);
    if (!mainUrlCheck.isValid) {
      res.status(400).json({ error: `URL Principal inválida: ${mainUrlCheck.error}` });
      return;
    }

    // SSRF Security Validation on Alternative Stream URLs
    const validatedAlternativeStreams: any[] = [];
    if (Array.isArray(alternative_streams)) {
      for (let i = 0; i < alternative_streams.length; i++) {
        const item = alternative_streams[i];
        const rawUrl = typeof item === 'string' ? item : item?.url;
        if (!rawUrl) continue;
        const altCheck = validateStreamUrl(rawUrl);
        if (!altCheck.isValid) {
          res.status(400).json({
            error: `URL Reserva #${i + 1} inválida: ${altCheck.error}`
          });
          return;
        }
        validatedAlternativeStreams.push(
          typeof item === 'string'
            ? { url: altCheck.normalizedUrl!, priority: i + 1, label: `Fonte Reserva ${i + 1}` }
            : {
                url: altCheck.normalizedUrl!,
                priority: parseInt(item.priority, 10) || (i + 1),
                label: item.label ? String(item.label).trim() : `Fonte Reserva ${i + 1}`
              }
        );
      }
    }

    const channels = await getChannels(false);
    const channelNumber = number ? parseInt(number, 10) : channels.reduce((max, c) => Math.max(max, c.number), 0) + 1;

    const channelStatus = status || 'active';
    const accessPerm = access_permission || (is_locked ? 'restricted' : 'free');

    const newChan = await createChannel({
      id: `ch_${Date.now()}`,
      number: channelNumber,
      name: name.trim(),
      category_id,
      logo_url: logo_url || 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=160&q=80',
      backup_image_url: '/src/assets/images/gato_net_hero_backdrop_1792172574872.jpg',
      stream_url: mainUrlCheck.normalizedUrl!,
      alternative_streams: validatedAlternativeStreams,
      resolution: resolution || '1080p',
      aspect_ratio: aspect_ratio || '16:9',
      current_program: current_program ? current_program.trim() : 'Transmissão Ao Vivo (Demonstração)',
      current_program_time: current_program_time || '20:00 - 22:00',
      next_program: 'Programação Noturna',
      is_live: channelStatus === 'active',
      is_locked: accessPerm === 'restricted',
      status: channelStatus,
      access_permission: accessPerm,
      is_featured: false,
      is_active: channelStatus !== 'inactive',
      description: description ? description.trim() : 'Canal cadastrado na grade oficial da Gato Net.'
    });

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'CREATE_CHANNEL',
      'channels',
      newChan.id,
      { name: newChan.name, number: newChan.number, status: newChan.status, access_permission: newChan.access_permission },
      req.ip || null
    );

    res.status(201).json(newChan);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao cadastrar canal' });
  }
});

router.put('/admin/channels/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // SSRF Security Validation on Primary Stream URL if updated
    if (updates.stream_url) {
      const mainCheck = validateStreamUrl(updates.stream_url);
      if (!mainCheck.isValid) {
        res.status(400).json({ error: `URL Principal inválida: ${mainCheck.error}` });
        return;
      }
      updates.stream_url = mainCheck.normalizedUrl!;
    }

    // SSRF Security Validation on Alternative Streams if updated
    if (updates.alternative_streams && Array.isArray(updates.alternative_streams)) {
      const validatedAlts: any[] = [];
      for (let i = 0; i < updates.alternative_streams.length; i++) {
        const item = updates.alternative_streams[i];
        const rawUrl = typeof item === 'string' ? item : item?.url;
        if (!rawUrl) continue;
        const altCheck = validateStreamUrl(rawUrl);
        if (!altCheck.isValid) {
          res.status(400).json({
            error: `URL Reserva #${i + 1} inválida: ${altCheck.error}`
          });
          return;
        }
        validatedAlts.push(
          typeof item === 'string'
            ? { url: altCheck.normalizedUrl!, priority: i + 1, label: `Fonte Reserva ${i + 1}` }
            : {
                url: altCheck.normalizedUrl!,
                priority: parseInt(item.priority, 10) || (i + 1),
                label: item.label ? String(item.label).trim() : `Fonte Reserva ${i + 1}`
              }
        );
      }
      updates.alternative_streams = validatedAlts;
    }

    if (updates.status) {
      updates.is_active = updates.status !== 'inactive';
    }
    if (updates.access_permission) {
      updates.is_locked = updates.access_permission === 'restricted';
    }

    const updated = await updateChannel(id, updates);
    if (!updated) {
      res.status(404).json({ error: 'Canal não encontrado' });
      return;
    }

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'UPDATE_CHANNEL',
      'channels',
      id,
      updates,
      req.ip || null
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao atualizar canal' });
  }
});

router.delete('/admin/channels/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = await deleteChannel(id);
    if (!success) {
      res.status(404).json({ error: 'Canal não encontrado' });
      return;
    }

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'DELETE_CHANNEL',
      'channels',
      id,
      null,
      req.ip || null
    );

    res.json({ success: true, message: 'Canal removido com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao remover canal' });
  }
});

// ==========================================
// 2. CATEGORIES (CRUD COMPLETO)
// ==========================================
router.get('/admin/categories', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

router.post('/admin/categories', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, slug, icon_name } = req.body;
    if (!name || !slug) {
      res.status(400).json({ error: 'Nome e slug são obrigatórios' });
      return;
    }

    const categories = await getCategories();
    const newCat = await createCategory({
      id: `cat_${Date.now()}`,
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      display_order: categories.length + 1,
      icon_name: icon_name || 'Layers',
      is_active: true
    });

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'CREATE_CATEGORY',
      'categories',
      newCat.id,
      { name: newCat.name, slug: newCat.slug },
      req.ip || null
    );

    res.status(201).json(newCat);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

router.put('/admin/categories/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, icon_name, display_order, is_active } = req.body;

    const updates: any = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (slug !== undefined) updates.slug = String(slug).trim().toLowerCase();
    if (icon_name !== undefined) updates.icon_name = String(icon_name).trim();
    if (display_order !== undefined) updates.display_order = parseInt(display_order, 10);
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    const updated = await updateCategory(id, updates);
    if (!updated) {
      res.status(404).json({ error: 'Categoria não encontrada' });
      return;
    }

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'UPDATE_CATEGORY',
      'categories',
      id,
      updates,
      req.ip || null
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

router.delete('/admin/categories/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await deleteCategory(id);
    if (!result.success) {
      res.status(400).json({ error: result.message || 'Erro ao excluir categoria' });
      return;
    }

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'DELETE_CATEGORY',
      'categories',
      id,
      null,
      req.ip || null
    );

    res.json({ success: true, message: 'Categoria excluída com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao excluir categoria' });
  }
});

// ==========================================
// 3. STREAM SOURCES
// ==========================================
router.get('/admin/sources', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const sources = await getStreamSources();
    res.json(sources);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao listar fontes' });
  }
});

// ==========================================
// 4. ADVERTISING BANNERS
// ==========================================
router.get('/admin/ads', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const ads = await getAdSlots();
    res.json(ads);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao listar slots publicitários' });
  }
});

router.put('/admin/ads/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await updateAdSlot(id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Slot não encontrado' });
      return;
    }

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'UPDATE_AD_SLOT',
      'ad_slots',
      id,
      { is_enabled: updated.is_enabled, title: updated.title },
      req.ip || null
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao atualizar slot de anúncio' });
  }
});

// ==========================================
// 5. APPEARANCE
// ==========================================
router.get('/admin/appearance', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const appearance = await getAppearanceConfigs();
    res.json(appearance);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar aparência' });
  }
});

router.put('/admin/appearance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await updateAppearanceConfigs(req.body);

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'UPDATE_APPEARANCE',
      'appearance_configs',
      'primary',
      req.body,
      req.ip || null
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao salvar configurações de aparência' });
  }
});

// ==========================================
// 6. SUBSCRIBERS
// ==========================================
router.get('/admin/subscribers', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const subscribers = await getSubscribers();
    res.json(subscribers);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao listar assinantes' });
  }
});

router.post('/admin/subscribers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { full_name, whatsapp, email, plan_id, plan_name, notes } = req.body;
    if (!full_name || !whatsapp || !email) {
      res.status(400).json({ error: 'Nome, WhatsApp e e-mail são obrigatórios' });
      return;
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const newSub = await createSubscriber({
      full_name: full_name.trim(),
      whatsapp: whatsapp.trim(),
      email: email.toLowerCase().trim(),
      status: 'active',
      plan_id: plan_id || 'plan_mensal',
      plan_name: plan_name || 'Plano Mensal Gato Net',
      expires_at: expiresAt.toISOString().slice(0, 10),
      notes: notes || 'Cadastrado manualmente pelo administrador'
    });

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'CREATE_SUBSCRIBER',
      'subscribers',
      newSub.id,
      { email: newSub.email, name: newSub.full_name },
      req.ip || null
    );

    res.status(201).json(newSub);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao cadastrar assinante' });
  }
});

router.put('/admin/subscribers/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const updated = await updateSubscriber(id, {
      status: 'active',
      expires_at: expiresAt.toISOString().slice(0, 10),
      notes: `Aprovado manualmente por ${req.admin!.email} em ${new Date().toLocaleDateString('pt-BR')}`
    });

    if (!updated) {
      res.status(404).json({ error: 'Assinante não encontrado' });
      return;
    }

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'APPROVE_MANUAL_PAYMENT',
      'subscribers',
      id,
      { subscriber_email: updated.email, new_status: 'active' },
      req.ip || null
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao aprovar assinante' });
  }
});

// ==========================================
// 7. PLANS (TOTALMENTE EDITÁVEIS)
// ==========================================
router.get('/admin/plans', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const plans = await getSubscriptionPlans();
    res.json(plans);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao listar planos' });
  }
});

router.post('/admin/plans', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      badge,
      price,
      period_label,
      duration_days,
      description,
      features,
      max_screens,
      allowed_scope,
      allowed_category_ids,
      allowed_channel_ids,
      is_popular,
      is_active,
      display_order
    } = req.body;

    if (!name || price === undefined || price === null) {
      res.status(400).json({ error: 'Nome e preço do plano são obrigatórios' });
      return;
    }

    const numericPrice = parseFloat(price);
    const numericDuration = parseInt(duration_days || 30, 10);
    const numericScreens = parseInt(max_screens || 1, 10);
    const numericOrder = parseInt(display_order || 99, 10);

    const newPlan = await createSubscriptionPlan({
      name: name.trim(),
      badge: badge ? badge.trim() : '',
      price: isNaN(numericPrice) ? 0 : numericPrice,
      period_label: period_label || `por ${numericDuration} dias`,
      duration_days: isNaN(numericDuration) ? 30 : numericDuration,
      duration_months: Math.max(1, Math.round(numericDuration / 30)),
      description: description ? description.trim() : '',
      features: Array.isArray(features) ? features : [],
      max_screens: isNaN(numericScreens) ? 1 : numericScreens,
      allowed_scope: allowed_scope === 'custom' ? 'custom' : 'all',
      allowed_category_ids: Array.isArray(allowed_category_ids) ? allowed_category_ids : [],
      allowed_channel_ids: Array.isArray(allowed_channel_ids) ? allowed_channel_ids : [],
      is_popular: Boolean(is_popular),
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      display_order: isNaN(numericOrder) ? 99 : numericOrder
    });

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'CREATE_SUBSCRIPTION_PLAN',
      'subscription_plans',
      newPlan.id,
      { name: newPlan.name, price: newPlan.price, duration_days: newPlan.duration_days },
      req.ip || null
    );

    res.status(201).json(newPlan);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao criar plano de assinatura' });
  }
});

router.put('/admin/plans/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await getSubscriptionPlanById(id);
    if (!existing) {
      res.status(404).json({ error: 'Plano não encontrado' });
      return;
    }

    const updates: any = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.badge !== undefined) updates.badge = String(req.body.badge).trim();
    if (req.body.price !== undefined) updates.price = parseFloat(req.body.price);
    if (req.body.period_label !== undefined) updates.period_label = String(req.body.period_label).trim();
    if (req.body.duration_days !== undefined) updates.duration_days = parseInt(req.body.duration_days, 10);
    if (req.body.description !== undefined) updates.description = String(req.body.description).trim();
    if (req.body.features !== undefined) updates.features = Array.isArray(req.body.features) ? req.body.features : [];
    if (req.body.max_screens !== undefined) updates.max_screens = parseInt(req.body.max_screens, 10);
    if (req.body.allowed_scope !== undefined) updates.allowed_scope = req.body.allowed_scope === 'custom' ? 'custom' : 'all';
    if (req.body.allowed_category_ids !== undefined) updates.allowed_category_ids = Array.isArray(req.body.allowed_category_ids) ? req.body.allowed_category_ids : [];
    if (req.body.allowed_channel_ids !== undefined) updates.allowed_channel_ids = Array.isArray(req.body.allowed_channel_ids) ? req.body.allowed_channel_ids : [];
    if (req.body.is_popular !== undefined) updates.is_popular = Boolean(req.body.is_popular);
    if (req.body.is_active !== undefined) updates.is_active = Boolean(req.body.is_active);
    if (req.body.display_order !== undefined) updates.display_order = parseInt(req.body.display_order, 10);

    const updated = await updateSubscriptionPlan(id, updates);

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'UPDATE_SUBSCRIPTION_PLAN',
      'subscription_plans',
      id,
      updates,
      req.ip || null
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao atualizar plano de assinatura' });
  }
});

router.patch('/admin/plans/:id/toggle', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const plan = await getSubscriptionPlanById(id);
    if (!plan) {
      res.status(404).json({ error: 'Plano não encontrado' });
      return;
    }

    const updated = await updateSubscriptionPlan(id, { is_active: !plan.is_active });

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'TOGGLE_SUBSCRIPTION_PLAN',
      'subscription_plans',
      id,
      { is_active: updated?.is_active },
      req.ip || null
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao alterar visibilidade do plano' });
  }
});

router.delete('/admin/plans/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await deleteSubscriptionPlan(id);

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      result.archived ? 'ARCHIVE_SUBSCRIPTION_PLAN' : 'DELETE_SUBSCRIPTION_PLAN',
      'subscription_plans',
      id,
      result,
      req.ip || null
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao processar exclusão/arquivamento do plano' });
  }
});

// ==========================================
// 8. PAYMENT CONFIGS (PIX & PAYPAL)
// ==========================================
router.get('/admin/payments', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const payments = await getPaymentConfigs();
    res.json(payments);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar configurações de pagamento' });
  }
});

router.put('/admin/payments', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await updatePaymentConfigs(req.body);

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'UPDATE_PAYMENT_CONFIGS',
      'payment_configs',
      'primary',
      { pix_key: updated.pix_key, paypal_email: updated.paypal_business_email },
      req.ip || null
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao salvar configurações de pagamento' });
  }
});

// ==========================================
// 8.1. MANUAL PAYMENT ORDERS & FINANCIAL AUDIT
// ==========================================
router.get('/admin/orders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, subscriberId } = req.query;
    const filter: { status?: string; subscriberId?: string } = {};
    if (status) filter.status = String(status);
    if (subscriberId) filter.subscriberId = String(subscriberId);

    const orders = await getManualOrders(filter);
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao listar pedidos manuais' });
  }
});

router.get('/admin/financial/history', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const history = await getFinancialHistory();
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar histórico financeiro' });
  }
});

router.post('/admin/orders/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await approveManualOrder(id, req.admin!.id, req.admin!.email);
    if (!result.success) {
      res.status(400).json({ error: result.message || 'Erro ao aprovar pedido' });
      return;
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao processar aprovação do pagamento' });
  }
});

router.post('/admin/orders/:id/reject', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason || !String(reason).trim()) {
      res.status(400).json({ error: 'Motivo da rejeição é obrigatório' });
      return;
    }
    const result = await rejectManualOrder(id, req.admin!.id, req.admin!.email, String(reason).trim());
    if (!result.success) {
      res.status(400).json({ error: result.message || 'Erro ao rejeitar pedido' });
      return;
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao processar rejeição do pagamento' });
  }
});

// ==========================================
// 9. ACCESS MODES (MODO 1, 2, 3)
// ==========================================
router.get('/admin/settings', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await getAccessModes();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar configurações gerais' });
  }
});

router.put('/admin/settings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await updateAccessModes(req.body);

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'UPDATE_ACCESS_MODE',
      'access_modes',
      'primary',
      { current_mode: updated.current_mode },
      req.ip || null
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao salvar configurações gerais' });
  }
});

// ==========================================
// 10. SECURITY & AUDIT TRAIL
// ==========================================
router.get('/admin/audit-logs', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await getAuditLogs(100);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao listar registros de auditoria' });
  }
});

router.get('/admin/security/diagnostics', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const postgresActive = isPostgresActive();
    res.json({
      vps: {
        provider: 'Virtarix VPS Hosting',
        os: 'Ubuntu 24.04 LTS (Noble Numbat)',
        cpu: '3 vCPU AMD EPYC',
        ram: '6 GB DDR4 ECC',
        storage: '50 GB NVMe SSD',
        bandwidth: '200 Mbps Dedicados',
        firewall: 'UFW Active (Ports 80, 443, 22)',
        node_version: process.version
      },
      database: {
        type: postgresActive ? 'PostgreSQL 16 (Conectado via TCP pool)' : 'Armazenamento Server-Side Persistente (Aguardando Deploy na VPS)',
        isPostgresActive: postgresActive
      },
      security: {
        hashAlgorithm: 'Argon2id (RFC 9106, 64MB memory, 3 iterations)',
        sessionStorage: 'HttpOnly Secure SameSite Cookies + Bearer Token Fallback',
        rateLimiting: 'Ativo (Bloqueio após 5 tentativas consecutivas por 15 minutos)',
        auditLogging: 'Ativo (Histórico imutável de operações administrativas)'
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar diagnósticos' });
  }
});

// ==========================================
// 11. ANALYTICS & AUDIENCE (DADOS REAIS)
// ==========================================
router.get('/admin/analytics/stats', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await getPlaybackStatistics();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar estatísticas de audiência' });
  }
});

router.post('/admin/playback/terminate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      res.status(400).json({ error: 'sessionId é obrigatório' });
      return;
    }

    const success = await terminateSessionByAdmin(sessionId, req.admin!.email);

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'TERMINATE_PLAYBACK_SESSION',
      'playback_sessions',
      sessionId,
      { terminated_by: req.admin!.email },
      req.ip || null
    );

    res.json({ success, message: 'Sessão de reprodução encerrada com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao encerrar sessão de reprodução' });
  }
});

export default router;
