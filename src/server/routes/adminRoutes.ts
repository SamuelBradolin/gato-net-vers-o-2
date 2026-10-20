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
  getFinancialHistory,
  getFeaturedHighlights,
  getFeaturedHighlightById,
  createFeaturedHighlight,
  updateFeaturedHighlight,
  deleteFeaturedHighlight,
  reorderFeaturedHighlights,
  getFeaturedSettings,
  updateFeaturedSettings,
  getPrerollCampaigns,
  getPrerollCampaignById,
  createPrerollCampaign,
  updatePrerollCampaign,
  deletePrerollCampaign,
  resetPrerollStats
} from '../db/repository.js';
import { DbAppearanceConfigs, DbAccessModes, DbFeaturedHighlight, DbFeaturedSettings, DbPrerollCampaign } from '../db/schema.js';
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
// 8.2. APPEARANCE CONFIGS & LOGO/FAVICON UPLOAD
// ==========================================
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __routesFilename = fileURLToPath(import.meta.url);
const __routesDir = path.dirname(__routesFilename);
const uploadsDir = path.resolve(__routesDir, '../../../uploads');

if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (err) {
    console.warn('[Admin Routes] uploadsDir check warning:', err);
  }
}

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
  'image/gif': '.gif'
};

function validateImageBuffer(buffer: Buffer, mimeType: string): { valid: boolean; error?: string; extension: string } {
  const ext = ALLOWED_MIME_TYPES[mimeType.toLowerCase()];
  if (!ext) {
    return {
      valid: false,
      error: `Formato de arquivo "${mimeType}" não suportado. Utilize PNG, JPG, WEBP, SVG, ICO ou GIF.`,
      extension: ''
    };
  }

  // Header magic bytes check
  if (mimeType.includes('png')) {
    if (buffer.length < 8 || buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4E || buffer[3] !== 0x47) {
      return { valid: false, error: 'Arquivo PNG corrompido ou assinatura de bytes inválida.', extension: ext };
    }
  } else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    if (buffer.length < 3 || buffer[0] !== 0xFF || buffer[1] !== 0xD8 || buffer[2] !== 0xFF) {
      return { valid: false, error: 'Arquivo JPEG/JPG corrompido ou assinatura de bytes inválida.', extension: ext };
    }
  } else if (mimeType.includes('gif')) {
    if (buffer.length < 4 || buffer.toString('ascii', 0, 4) !== 'GIF8') {
      return { valid: false, error: 'Arquivo GIF inválido.', extension: ext };
    }
  } else if (mimeType.includes('webp')) {
    if (buffer.length < 12 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
      return { valid: false, error: 'Arquivo WEBP inválido.', extension: ext };
    }
  } else if (mimeType.includes('icon') || mimeType.includes('ico')) {
    const isStandardIco = buffer.length >= 4 && buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00;
    const isPngIco = buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    if (!isStandardIco && !isPngIco) {
      return { valid: false, error: 'Arquivo ICO/Favicon inválido.', extension: ext };
    }
  } else if (mimeType.includes('svg')) {
    const text = buffer.toString('utf-8').trim();
    if (!text.includes('<svg') && !text.includes('<?xml')) {
      return { valid: false, error: 'Arquivo SVG inválido ou sem tag <svg>.', extension: ext };
    }
    if (text.toLowerCase().includes('<script') || text.toLowerCase().includes('javascript:') || text.toLowerCase().includes('onload=')) {
      return { valid: false, error: 'O arquivo SVG contém elementos de script não permitidos por motivos de segurança.', extension: ext };
    }
  }

  return { valid: true, extension: ext };
}

router.get('/admin/appearance', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const appearance = await getAppearanceConfigs();
    res.json(appearance);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar configurações de aparência' });
  }
});

router.put('/admin/appearance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      site_name,
      tagline,
      logo_url,
      favicon_url,
      primary_color,
      dark_navy_color,
      electric_blue_color
    } = req.body;

    const updates: Partial<DbAppearanceConfigs> = {};
    if (site_name !== undefined) updates.site_name = String(site_name).trim() || 'Gato Net';
    if (tagline !== undefined) updates.tagline = String(tagline).trim();
    if (logo_url !== undefined) updates.logo_url = logo_url ? String(logo_url).trim() : null;
    if (favicon_url !== undefined) updates.favicon_url = favicon_url ? String(favicon_url).trim() : null;

    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (primary_color && hexRegex.test(primary_color)) updates.primary_color = primary_color;
    if (dark_navy_color && hexRegex.test(dark_navy_color)) updates.dark_navy_color = dark_navy_color;
    if (electric_blue_color && hexRegex.test(electric_blue_color)) updates.electric_blue_color = electric_blue_color;

    const updated = await updateAppearanceConfigs(updates);

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'UPDATE_APPEARANCE_CONFIGS',
      'appearance_configs',
      'primary',
      updates,
      req.ip || null
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao salvar configurações de aparência' });
  }
});

router.post('/admin/upload', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { filename, mimeType, base64Data, target } = req.body;
    if (!base64Data || !mimeType) {
      res.status(400).json({ error: 'Arquivo ou tipo MIME não informado.' });
      return;
    }

    const cleanBase64 = base64Data.replace(/^data:[a-zA-Z0-9\/\+-\.]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const isFavicon = target === 'favicon' || (filename && String(filename).toLowerCase().includes('favicon'));
    const maxSizeBytes = isFavicon ? 1 * 1024 * 1024 : 5 * 1024 * 1024;
    const maxSizeLabel = isFavicon ? '1 MB' : '5 MB';

    if (buffer.length > maxSizeBytes) {
      res.status(400).json({
        error: `O arquivo enviado excede o limite máximo permitido de ${maxSizeLabel} (Tamanho atual: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`
      });
      return;
    }

    if (buffer.length < 10) {
      res.status(400).json({ error: 'Arquivo vazio ou corrompido.' });
      return;
    }

    const validation = validateImageBuffer(buffer, mimeType);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error || 'Arquivo não aceito.' });
      return;
    }

    const safeTargetPrefix = target ? String(target).replace(/[^a-z0-9_-]/gi, '') : 'img';
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    const safeFilename = `${safeTargetPrefix}_${timestamp}_${randomSuffix}${validation.extension}`;
    const filePath = path.join(uploadsDir, safeFilename);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${safeFilename}`;

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'UPLOAD_IMAGE',
      'appearance',
      safeFilename,
      {
        originalName: filename,
        target,
        sizeBytes: buffer.length,
        mimeType,
        url: publicUrl
      },
      req.ip || null
    );

    res.json({
      success: true,
      url: publicUrl,
      filename: safeFilename,
      size: buffer.length,
      mimeType
    });
  } catch (err: any) {
    console.error('[Admin Upload Error]', err);
    res.status(500).json({ error: 'Falha ao processar e salvar o upload da imagem.' });
  }
});

const videoUploadsDir = path.join(uploadsDir, 'videos');
if (!fs.existsSync(videoUploadsDir)) {
  try {
    fs.mkdirSync(videoUploadsDir, { recursive: true });
  } catch (err) {
    console.warn('[Admin Routes] videoUploadsDir check warning:', err);
  }
}

const ALLOWED_VIDEO_MIME_TYPES: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm'
};

function validateVideoBuffer(buffer: Buffer, mimeType: string): { valid: boolean; error?: string; extension: string } {
  const ext = ALLOWED_VIDEO_MIME_TYPES[mimeType.toLowerCase()];
  if (!ext) {
    return {
      valid: false,
      error: `Formato de vídeo "${mimeType}" não suportado. Por favor, envie arquivos em formato MP4 ou WebM.`,
      extension: ''
    };
  }

  // Check container signature
  if (mimeType.includes('mp4')) {
    if (buffer.length < 16) {
      return { valid: false, error: 'Arquivo MP4 muito curto ou corrompido.', extension: ext };
    }
    const headerSlice = buffer.toString('ascii', 0, Math.min(64, buffer.length));
    if (!headerSlice.includes('ftyp') && !headerSlice.includes('moov')) {
      return { valid: false, error: 'Assinatura de contêiner de vídeo MP4 inválida.', extension: ext };
    }
  } else if (mimeType.includes('webm')) {
    if (buffer.length < 4 || buffer[0] !== 0x1A || buffer[1] !== 0x45 || buffer[2] !== 0xDF || buffer[3] !== 0xA3) {
      return { valid: false, error: 'Assinatura de contêiner WebM inválida.', extension: ext };
    }
  }

  return { valid: true, extension: ext };
}

router.post('/admin/upload-video', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { filename, mimeType, base64Data } = req.body;
    if (!base64Data || !mimeType) {
      res.status(400).json({ error: 'Arquivo de vídeo ou tipo MIME não informado.' });
      return;
    }

    const cleanBase64 = base64Data.replace(/^data:[a-zA-Z0-9\/\+-\.]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const maxSizeBytes = 50 * 1024 * 1024; // 50 MB
    if (buffer.length > maxSizeBytes) {
      res.status(400).json({
        error: `O vídeo enviado excede o limite máximo de 50 MB (Tamanho atual: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`
      });
      return;
    }

    if (buffer.length < 100) {
      res.status(400).json({ error: 'Arquivo de vídeo vazio ou inválido.' });
      return;
    }

    const validation = validateVideoBuffer(buffer, mimeType);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error || 'Arquivo de vídeo rejeitado.' });
      return;
    }

    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    const safeFilename = `preroll_${timestamp}_${randomSuffix}${validation.extension}`;
    const filePath = path.join(videoUploadsDir, safeFilename);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/videos/${safeFilename}`;

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'UPLOAD_PREROLL_VIDEO',
      'preroll_campaigns',
      safeFilename,
      {
        originalName: filename,
        sizeBytes: buffer.length,
        mimeType,
        url: publicUrl
      },
      req.ip || null
    );

    res.json({
      success: true,
      url: publicUrl,
      filename: safeFilename,
      size: buffer.length,
      mimeType
    });
  } catch (err: any) {
    console.error('[Admin Upload Video Error]', err);
    res.status(500).json({ error: 'Falha ao processar e salvar o vídeo publicitário.' });
  }
});

// ==========================================
// 9. ACCESS MODES (MODO 1, 2, 3) & CONFIGURAÇÕES GERAIS
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
    const { current_mode, allow_public_browse, max_simultaneous_streams, stream_relay_enabled } = req.body;
    const updates: Partial<DbAccessModes> = {};
    if (current_mode) updates.current_mode = current_mode;
    if (allow_public_browse !== undefined) updates.allow_public_browse = Boolean(allow_public_browse);
    if (max_simultaneous_streams !== undefined) updates.max_simultaneous_streams = parseInt(max_simultaneous_streams, 10) || 2;
    if (stream_relay_enabled !== undefined) updates.stream_relay_enabled = Boolean(stream_relay_enabled);

    const updated = await updateAccessModes(updates);

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'UPDATE_ACCESS_MODE',
      'access_modes',
      'primary',
      updates,
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

// ==========================================
// 13. DESTAQUES DA PROGRAMAÇÃO (FEATURED HIGHLIGHTS)
// ==========================================
router.get('/admin/featured', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const [highlights, settings] = await Promise.all([
      getFeaturedHighlights(true),
      getFeaturedSettings()
    ]);
    res.json({ highlights, settings });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao listar destaques da programação' });
  }
});

router.post('/admin/featured', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      image_url,
      target_channel_id,
      button_text,
      time_label,
      start_date,
      end_date,
      placement,
      display_order,
      is_active,
      is_demo
    } = req.body;

    if (!title || !image_url || !target_channel_id) {
      res.status(400).json({
        error: 'Campos obrigatórios',
        message: 'Título da atração, imagem e canal de destino vinculado são obrigatórios.'
      });
      return;
    }

    const newId = `feat_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const highlight = await createFeaturedHighlight({
      id: newId,
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      image_url: String(image_url).trim(),
      target_channel_id: String(target_channel_id).trim(),
      button_text: button_text ? String(button_text).trim() : 'Assistir agora',
      time_label: time_label ? String(time_label).trim() : null,
      start_date: start_date || null,
      end_date: end_date || null,
      placement: ['empty_player', 'player_banner', 'both'].includes(placement) ? placement : 'both',
      display_order: Number(display_order) || 1,
      is_active: is_active !== false,
      is_demo: is_demo !== undefined ? Boolean(is_demo) : false
    });

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'CREATE_FEATURED_HIGHLIGHT',
      'featured_highlights',
      highlight.id,
      { title: highlight.title, target_channel_id: highlight.target_channel_id },
      req.ip || null
    );

    res.status(201).json(highlight);
  } catch (err: any) {
    console.error('[Create Featured Error]', err);
    res.status(500).json({ error: 'Erro ao criar destaque da programação' });
  }
});

router.put('/admin/featured/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await getFeaturedHighlightById(id);
    if (!existing) {
      res.status(404).json({ error: 'Destaque não encontrado' });
      return;
    }

    const updates: Partial<DbFeaturedHighlight> = {};
    if (req.body.title !== undefined) updates.title = String(req.body.title).trim();
    if (req.body.description !== undefined) updates.description = req.body.description ? String(req.body.description).trim() : null;
    if (req.body.image_url !== undefined) updates.image_url = String(req.body.image_url).trim();
    if (req.body.target_channel_id !== undefined) updates.target_channel_id = String(req.body.target_channel_id).trim();
    if (req.body.button_text !== undefined) updates.button_text = String(req.body.button_text).trim();
    if (req.body.time_label !== undefined) updates.time_label = req.body.time_label ? String(req.body.time_label).trim() : null;
    if (req.body.start_date !== undefined) updates.start_date = req.body.start_date || null;
    if (req.body.end_date !== undefined) updates.end_date = req.body.end_date || null;
    if (req.body.placement !== undefined && ['empty_player', 'player_banner', 'both'].includes(req.body.placement)) {
      updates.placement = req.body.placement;
    }
    if (req.body.display_order !== undefined) updates.display_order = Number(req.body.display_order) || 1;
    if (req.body.is_active !== undefined) updates.is_active = Boolean(req.body.is_active);
    if (req.body.is_demo !== undefined) updates.is_demo = Boolean(req.body.is_demo);

    const updated = await updateFeaturedHighlight(id, updates);

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'UPDATE_FEATURED_HIGHLIGHT',
      'featured_highlights',
      id,
      updates,
      req.ip || null
    );

    res.json(updated);
  } catch (err: any) {
    console.error('[Update Featured Error]', err);
    res.status(500).json({ error: 'Erro ao atualizar destaque da programação' });
  }
});

router.delete('/admin/featured/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await getFeaturedHighlightById(id);
    if (!existing) {
      res.status(404).json({ error: 'Destaque não encontrado' });
      return;
    }

    const success = await deleteFeaturedHighlight(id);

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'DELETE_FEATURED_HIGHLIGHT',
      'featured_highlights',
      id,
      { title: existing.title },
      req.ip || null
    );

    res.json({ success, message: 'Destaque removido com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao excluir destaque da programação' });
  }
});

router.post('/admin/featured/reorder', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      res.status(400).json({ error: 'ids deve ser um array de strings' });
      return;
    }

    await reorderFeaturedHighlights(ids);

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'REORDER_FEATURED_HIGHLIGHTS',
      'featured_highlights',
      null,
      { orderedIds: ids },
      req.ip || null
    );

    res.json({ success: true, message: 'Destaques reordenados com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao reordenar destaques' });
  }
});

router.put('/admin/featured-settings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updates: Partial<DbFeaturedSettings> = {};
    if (req.body.autoplay_interval_seconds !== undefined) {
      const val = parseInt(req.body.autoplay_interval_seconds, 10);
      updates.autoplay_interval_seconds = Math.max(2, Math.min(60, val || 6));
    }
    if (req.body.max_active_highlights !== undefined) {
      const val = parseInt(req.body.max_active_highlights, 10);
      updates.max_active_highlights = Math.max(1, Math.min(20, val || 6));
    }
    if (req.body.playback_banner_enabled !== undefined) {
      updates.playback_banner_enabled = Boolean(req.body.playback_banner_enabled);
    }

    const updated = await updateFeaturedSettings(updates);

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'UPDATE_FEATURED_SETTINGS',
      'featured_settings',
      'primary',
      updates,
      req.ip || null
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao salvar configurações de destaques' });
  }
});

// ==========================================
// 14. PRE-ROLL VIDEO ADVERTISING MANAGEMENT
// ==========================================

router.get('/admin/preroll', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const [campaigns, channels, categories, plans] = await Promise.all([
      getPrerollCampaigns(false),
      getChannels(false),
      getCategories(),
      getSubscriptionPlans(false)
    ]);

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.is_active).length;
    const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions_count || 0), 0);
    const totalCompletions = campaigns.reduce((acc, c) => acc + (c.completions_count || 0), 0);
    const totalSkips = campaigns.reduce((acc, c) => acc + (c.skips_count || 0), 0);
    const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks_count || 0), 0);
    const completionRate = totalImpressions > 0 ? ((totalCompletions / totalImpressions) * 100).toFixed(1) : '0.0';
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

    res.json({
      campaigns,
      channels: channels.map(c => ({ id: c.id, name: c.name, number: c.number, categoryId: c.category_id, categoryName: c.category_name })),
      categories: categories.map(c => ({ id: c.id, name: c.name })),
      plans: plans.map(p => ({ id: p.id, name: p.name, price: p.price })),
      summary: {
        totalCampaigns,
        activeCampaigns,
        totalImpressions,
        totalCompletions,
        totalSkips,
        totalClicks,
        completionRate,
        ctr
      }
    });
  } catch (err: any) {
    console.error('[Admin Preroll GET Error]', err);
    res.status(500).json({ error: 'Erro ao carregar campanhas de pré-roll' });
  }
});

router.post('/admin/preroll', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      sponsor_name,
      title,
      video_url,
      target_url,
      target_type,
      target_channel_ids,
      target_category_ids,
      start_date,
      end_date,
      is_continuous,
      priority,
      frequency_cap_minutes,
      skip_enabled,
      skip_offset_seconds,
      exempt_plan_ids,
      is_active
    } = req.body;

    if (!sponsor_name || !title || !video_url) {
      res.status(400).json({ error: 'Patrocinador, título e URL do vídeo são obrigatórios.' });
      return;
    }

    const campaign = await createPrerollCampaign({
      sponsor_name: String(sponsor_name).trim(),
      title: String(title).trim(),
      video_url: String(video_url).trim(),
      target_url: target_url ? String(target_url).trim() : null,
      target_type: ['all', 'channels', 'categories'].includes(target_type) ? target_type : 'all',
      target_channel_ids: Array.isArray(target_channel_ids) ? target_channel_ids : [],
      target_category_ids: Array.isArray(target_category_ids) ? target_category_ids : [],
      start_date: start_date ? new Date(start_date).toISOString() : null,
      end_date: end_date ? new Date(end_date).toISOString() : null,
      is_continuous: Boolean(is_continuous),
      priority: Math.max(1, Math.min(10, parseInt(priority, 10) || 5)),
      frequency_cap_minutes: Math.max(0, parseInt(frequency_cap_minutes, 10) || 0),
      skip_enabled: skip_enabled !== undefined ? Boolean(skip_enabled) : true,
      skip_offset_seconds: Math.max(0, parseInt(skip_offset_seconds, 10) || 5),
      exempt_plan_ids: Array.isArray(exempt_plan_ids) ? exempt_plan_ids : [],
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      is_demo: false
    });

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'CREATE_PREROLL_CAMPAIGN',
      'preroll_campaigns',
      campaign.id,
      { title: campaign.title, sponsor: campaign.sponsor_name },
      req.ip || null
    );

    res.status(201).json(campaign);
  } catch (err: any) {
    console.error('[Admin Preroll Create Error]', err);
    res.status(500).json({ error: 'Erro ao criar campanha de pré-roll' });
  }
});

router.put('/admin/preroll/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await getPrerollCampaignById(id);
    if (!existing) {
      res.status(404).json({ error: 'Campanha não encontrada.' });
      return;
    }

    const updates: Partial<DbPrerollCampaign> = {};
    if (req.body.sponsor_name !== undefined) updates.sponsor_name = String(req.body.sponsor_name).trim();
    if (req.body.title !== undefined) updates.title = String(req.body.title).trim();
    if (req.body.video_url !== undefined) updates.video_url = String(req.body.video_url).trim();
    if (req.body.target_url !== undefined) updates.target_url = req.body.target_url ? String(req.body.target_url).trim() : null;
    if (req.body.target_type !== undefined && ['all', 'channels', 'categories'].includes(req.body.target_type)) {
      updates.target_type = req.body.target_type;
    }
    if (req.body.target_channel_ids !== undefined && Array.isArray(req.body.target_channel_ids)) {
      updates.target_channel_ids = req.body.target_channel_ids;
    }
    if (req.body.target_category_ids !== undefined && Array.isArray(req.body.target_category_ids)) {
      updates.target_category_ids = req.body.target_category_ids;
    }
    if (req.body.start_date !== undefined) {
      updates.start_date = req.body.start_date ? new Date(req.body.start_date).toISOString() : null;
    }
    if (req.body.end_date !== undefined) {
      updates.end_date = req.body.end_date ? new Date(req.body.end_date).toISOString() : null;
    }
    if (req.body.is_continuous !== undefined) updates.is_continuous = Boolean(req.body.is_continuous);
    if (req.body.priority !== undefined) updates.priority = Math.max(1, Math.min(10, parseInt(req.body.priority, 10) || 5));
    if (req.body.frequency_cap_minutes !== undefined) updates.frequency_cap_minutes = Math.max(0, parseInt(req.body.frequency_cap_minutes, 10) || 0);
    if (req.body.skip_enabled !== undefined) updates.skip_enabled = Boolean(req.body.skip_enabled);
    if (req.body.skip_offset_seconds !== undefined) updates.skip_offset_seconds = Math.max(0, parseInt(req.body.skip_offset_seconds, 10) || 5);
    if (req.body.exempt_plan_ids !== undefined && Array.isArray(req.body.exempt_plan_ids)) {
      updates.exempt_plan_ids = req.body.exempt_plan_ids;
    }
    if (req.body.is_active !== undefined) updates.is_active = Boolean(req.body.is_active);

    const updated = await updatePrerollCampaign(id, updates);

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'UPDATE_PREROLL_CAMPAIGN',
      'preroll_campaigns',
      id,
      updates,
      req.ip || null
    );

    res.json(updated);
  } catch (err: any) {
    console.error('[Admin Preroll Update Error]', err);
    res.status(500).json({ error: 'Erro ao atualizar campanha de pré-roll' });
  }
});

router.patch('/admin/preroll/:id/toggle', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await getPrerollCampaignById(id);
    if (!existing) {
      res.status(404).json({ error: 'Campanha não encontrada.' });
      return;
    }

    const updated = await updatePrerollCampaign(id, { is_active: !existing.is_active });

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'TOGGLE_PREROLL_CAMPAIGN',
      'preroll_campaigns',
      id,
      { is_active: updated?.is_active },
      req.ip || null
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao alternar status da campanha' });
  }
});

router.post('/admin/preroll/:id/reset-stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = await resetPrerollStats(id);
    if (!success) {
      res.status(404).json({ error: 'Campanha não encontrada.' });
      return;
    }

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'RESET_PREROLL_STATS',
      'preroll_campaigns',
      id,
      {},
      req.ip || null
    );

    res.json({ success: true, message: 'Estatísticas da campanha zeradas com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao zerar estatísticas da campanha' });
  }
});

router.delete('/admin/preroll/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await getPrerollCampaignById(id);
    if (!existing) {
      res.status(404).json({ error: 'Campanha não encontrada.' });
      return;
    }

    const success = await deletePrerollCampaign(id);

    await createAuditLog(
      req.admin!.id,
      req.admin!.email,
      'DELETE_PREROLL_CAMPAIGN',
      'preroll_campaigns',
      id,
      { title: existing.title, sponsor: existing.sponsor_name },
      req.ip || null
    );

    res.json({ success, message: 'Campanha excluída com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao excluir campanha de pré-roll' });
  }
});

export default router;

