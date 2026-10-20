import { Router, Request, Response } from 'express';
import {
  getChannels,
  getCategories,
  getAppearanceConfigs,
  getAccessModes,
  getAdSlots,
  createSubscriber,
  getSubscribers,
  getSubscriptionPlans,
  verifyPlaybackAccess,
  startPlaybackSession,
  heartbeatPlaybackSession,
  endPlaybackSession,
  getSubscriberSessions,
  createManualOrder,
  getManualOrderById,
  submitOrderReceipt,
  getPaymentConfigs,
  getFeaturedHighlights,
  getFeaturedSettings,
  getEligiblePrerollCampaign,
  recordPrerollEvent
} from '../db/repository.js';
import { hashPassword, verifyPassword } from '../auth/argon2.js';

const router = Router();

// 1. Public channels list
router.get('/public/channels', async (_req: Request, res: Response) => {
  try {
    const channels = await getChannels(true);
    res.json(channels);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar canais públicos' });
  }
});

// 2. Public categories list
router.get('/public/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await getCategories();
    res.json(categories.filter(c => c.is_active));
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar categorias públicas' });
  }
});

// 3. Public site settings & ad slots
router.get('/public/settings', async (_req: Request, res: Response) => {
  try {
    const appearance = await getAppearanceConfigs();
    const accessModes = await getAccessModes();
    const adSlots = await getAdSlots();
    const featuredSettings = await getFeaturedSettings();

    res.json({
      appearance,
      accessMode: accessModes.current_mode,
      allowPublicBrowse: accessModes.allow_public_browse,
      maxSimultaneousStreams: accessModes.max_simultaneous_streams,
      streamRelayEnabled: accessModes.stream_relay_enabled,
      adSlots: adSlots.filter(a => a.is_enabled),
      featuredSettings
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar configurações públicas' });
  }
});

// 3.1. Public featured programming highlights
router.get('/public/featured', async (_req: Request, res: Response) => {
  try {
    const [allHighlights, settings, channels] = await Promise.all([
      getFeaturedHighlights(false),
      getFeaturedSettings(),
      getChannels(true)
    ]);

    const now = new Date().getTime();
    const channelsMap = new Map(channels.map(c => [c.id, c]));

    // Filter by dates if present and active
    const activeHighlights = allHighlights
      .filter(item => {
        if (!item.is_active) return false;
        if (item.start_date && new Date(item.start_date).getTime() > now) return false;
        if (item.end_date && new Date(item.end_date).getTime() < now) return false;
        return true;
      })
      .slice(0, settings.max_active_highlights || 6)
      .map(item => {
        const channel = channelsMap.get(item.target_channel_id);
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          imageUrl: item.image_url,
          targetChannelId: item.target_channel_id,
          targetChannelName: channel?.name || 'Canal Gato Net',
          targetChannelNumber: channel?.number || 1,
          buttonText: item.button_text || 'Assistir agora',
          timeLabel: item.time_label,
          startDate: item.start_date,
          endDate: item.end_date,
          placement: item.placement || 'both',
          displayOrder: item.display_order,
          isActive: item.is_active,
          isDemo: item.is_demo
        };
      });

    res.json({
      highlights: activeHighlights,
      settings: {
        autoplayIntervalSeconds: settings.autoplay_interval_seconds || 6,
        maxActiveHighlights: settings.max_active_highlights || 6,
        playbackBannerEnabled: settings.playback_banner_enabled !== false
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar destaques da programação' });
  }
});

// 4. Public subscriber registration (Without CPF: Nome, WhatsApp, E-mail, Senha)
router.post('/public/subscribers/register', async (req: Request, res: Response) => {
  try {
    const { full_name, whatsapp, email, password } = req.body;

    if (!full_name || !whatsapp || !email || !password) {
      res.status(400).json({
        error: 'Dados incompletos',
        message: 'Nome completo, WhatsApp, e-mail e senha são obrigatórios.'
      });
      return;
    }

    const subscribers = await getSubscribers();
    const existing = subscribers.find(s => s.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      res.status(409).json({
        error: 'E-mail já cadastrado',
        message: 'Já existe uma conta associada a este endereço de e-mail.'
      });
      return;
    }

    const password_hash = await hashPassword(password);
    const newSub = await createSubscriber({
      full_name: full_name.trim(),
      whatsapp: whatsapp.trim(),
      email: email.toLowerCase().trim(),
      password_hash,
      status: 'active',
      notes: 'Cadastro via formulário público (sem exigência de CPF)'
    });

    res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso!',
      user: {
        id: newSub.id,
        full_name: newSub.full_name,
        email: newSub.email,
        whatsapp: newSub.whatsapp
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao realizar cadastro de assinante' });
  }
});

// 5. Public subscriber login
router.post('/public/subscribers/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      return;
    }

    const subscribers = await getSubscribers();
    const sub = subscribers.find(s => s.email.toLowerCase() === email.toLowerCase().trim());

    if (!sub || !sub.password_hash) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const isValid = await verifyPassword(password, sub.password_hash);
    if (!isValid) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    res.json({
      success: true,
      message: 'Login efetuado com sucesso',
      user: {
        id: sub.id,
        full_name: sub.full_name,
        email: sub.email,
        status: sub.status,
        plan_name: sub.plan_name
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao autenticar usuário' });
  }
});

// 6. Public active subscription plans
router.get('/public/plans', async (_req: Request, res: Response) => {
  try {
    const plans = await getSubscriptionPlans(true);
    res.json(plans);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar planos de assinatura' });
  }
});

// 7. Backend playback access authorization check
router.post('/public/playback/authorize', async (req: Request, res: Response) => {
  try {
    const { channelId, userEmail } = req.body;
    if (!channelId) {
      res.status(400).json({ error: 'channelId é obrigatório' });
      return;
    }

    const result = await verifyPlaybackAccess(channelId, userEmail);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao validar autorização de reprodução' });
  }
});

// 8. Start playback session with simultaneous screens concurrency check
router.post('/public/playback/start-session', async (req: Request, res: Response) => {
  try {
    const { channelId, userEmail, deviceInfo } = req.body;
    if (!channelId) {
      res.status(400).json({ error: 'channelId é obrigatório' });
      return;
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || null;
    const userAgent = req.headers['user-agent'] || null;

    const result = await startPlaybackSession({
      channelId,
      userEmail,
      deviceInfo,
      ipAddress,
      userAgent
    });

    if (!result.authorized) {
      res.status(result.limitReached ? 429 : 403).json(result);
      return;
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao iniciar sessão de reprodução' });
  }
});

// 9. Playback session heartbeat
router.post('/public/playback/heartbeat', async (req: Request, res: Response) => {
  try {
    const { sessionId, playbackToken } = req.body;
    if (!sessionId) {
      res.status(400).json({ error: 'sessionId é obrigatório' });
      return;
    }

    const result = await heartbeatPlaybackSession(sessionId, playbackToken);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao registrar heartbeat da sessão' });
  }
});

// 10. End playback session (by subscriber or window close)
router.post('/public/playback/end-session', async (req: Request, res: Response) => {
  try {
    const { sessionId, userEmail, reason } = req.body;
    if (!sessionId) {
      res.status(400).json({ error: 'sessionId é obrigatório' });
      return;
    }

    let subId: string | undefined;
    if (userEmail) {
      const subscribers = await getSubscribers();
      const sub = subscribers.find(s => s.email.toLowerCase() === userEmail.toLowerCase().trim());
      if (sub) subId = sub.id;
    }

    const success = await endPlaybackSession(sessionId, reason || 'user_closed', subId);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao encerrar sessão de reprodução' });
  }
});

// 11. View active and recent sessions for a subscriber (self-management)
router.get('/public/subscriber/sessions', async (req: Request, res: Response) => {
  try {
    const email = req.query.email?.toString();
    if (!email) {
      res.status(400).json({ error: 'email é obrigatório' });
      return;
    }

    const data = await getSubscriberSessions(email);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao buscar sessões do assinante' });
  }
});

// 12. Create manual payment order (Pix or PayPal)
router.post('/public/orders', async (req: Request, res: Response) => {
  try {
    const { subscriberName, subscriberEmail, subscriberWhatsapp, planId, paymentMethod, notes } = req.body;

    if (!subscriberEmail || !planId || !paymentMethod) {
      res.status(400).json({ error: 'E-mail, plano e forma de pagamento são obrigatórios' });
      return;
    }

    if (paymentMethod !== 'pix' && paymentMethod !== 'paypal') {
      res.status(400).json({ error: 'Forma de pagamento inválida. Utilize "pix" ou "paypal"' });
      return;
    }

    const order = await createManualOrder({
      subscriberName: subscriberName ? String(subscriberName).trim() : undefined,
      subscriberEmail: String(subscriberEmail).trim(),
      subscriberWhatsapp: subscriberWhatsapp ? String(subscriberWhatsapp).trim() : undefined,
      planId: String(planId),
      paymentMethod,
      notes: notes ? String(notes).trim() : undefined
    });

    const paymentConfigs = await getPaymentConfigs();

    res.status(201).json({
      success: true,
      order,
      pixCopyPaste: order.pix_copy_paste,
      paymentConfigs: {
        pixKey: paymentConfigs.pix_key,
        pixRecipient: paymentConfigs.pix_recipient_name,
        pixCity: paymentConfigs.pix_city,
        paypalLink: paymentConfigs.paypal_payment_link
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao gerar pedido de pagamento' });
  }
});

// 13. Submit payment receipt / transaction reference for an order
router.post('/public/orders/:id/receipt', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { receiptUrl, receiptCode, notes } = req.body;

    if (!receiptUrl && !receiptCode && !notes) {
      res.status(400).json({ error: 'Informe ao menos o comprovante, código da transação ou observações' });
      return;
    }

    const updated = await submitOrderReceipt(id, {
      receipt_url: receiptUrl ? String(receiptUrl).trim() : undefined,
      receipt_code: receiptCode ? String(receiptCode).trim() : undefined,
      notes: notes ? String(notes).trim() : undefined
    });

    if (!updated) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    res.json({
      success: true,
      message: 'Comprovante registrado com sucesso! O administrador foi notificado para conferência.',
      order: updated
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao registrar comprovante de pagamento' });
  }
});

// 14. Query order status
router.get('/public/orders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await getManualOrderById(id);
    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }
    res.json({ success: true, order });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao consultar status do pedido' });
  }
});

// 15. Check eligible pre-roll ad with strict playback access verification
router.post('/public/preroll/eligible', async (req: Request, res: Response) => {
  try {
    const { channelId, userEmail, visitorId } = req.body;
    if (!channelId) {
      res.status(400).json({ error: 'channelId é obrigatório' });
      return;
    }

    // A. Verify access authorization first (reusing existing auth/modes)
    const accessCheck = await verifyPlaybackAccess(channelId, userEmail);
    if (!accessCheck.authorized) {
      res.json({
        authorized: false,
        mode: accessCheck.mode,
        reason: accessCheck.reason,
        eligible: false,
        ad: null
      });
      return;
    }

    // B. Check if there is an active eligible pre-roll ad for this channel and visitor/user
    const ad = await getEligiblePrerollCampaign({
      channelId,
      userEmail,
      visitorId
    });

    if (!ad) {
      res.json({
        authorized: true,
        eligible: false,
        ad: null
      });
      return;
    }

    res.json({
      authorized: true,
      eligible: true,
      ad: {
        id: ad.id,
        sponsorName: ad.sponsor_name,
        title: ad.title,
        videoUrl: ad.video_url,
        targetUrl: ad.target_url,
        skipEnabled: ad.skip_enabled,
        skipOffsetSeconds: ad.skip_offset_seconds,
        isDemo: ad.is_demo
      }
    });
  } catch (err: any) {
    console.error('[Preroll Eligible Error]', err);
    res.status(500).json({ error: 'Erro ao verificar publicidade pré-roll' });
  }
});

// 16. Record real pre-roll ad events (impression, completion, skip, click)
router.post('/public/preroll/event', async (req: Request, res: Response) => {
  try {
    const { campaignId, eventType, channelId, userEmail, visitorId } = req.body;
    if (!campaignId || !eventType) {
      res.status(400).json({ error: 'campaignId e eventType são obrigatórios' });
      return;
    }

    const validEvents = ['impression', 'completion', 'skip', 'click'];
    if (!validEvents.includes(eventType)) {
      res.status(400).json({ error: 'Tipo de evento inválido' });
      return;
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || null;
    const userAgent = req.headers['user-agent'] || null;

    let subscriberId: string | null = null;
    if (userEmail) {
      const subs = await getSubscribers();
      const sub = subs.find(s => s.email.toLowerCase() === String(userEmail).toLowerCase().trim());
      if (sub) subscriberId = sub.id;
    }

    await recordPrerollEvent({
      campaign_id: campaignId,
      event_type: eventType,
      channel_id: channelId || null,
      subscriber_id: subscriberId,
      visitor_id: visitorId || null,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('[Preroll Event Error]', err);
    res.status(500).json({ error: 'Erro ao registrar evento de publicidade' });
  }
});

export default router;

