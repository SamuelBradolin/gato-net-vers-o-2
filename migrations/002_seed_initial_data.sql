-- ====================================================================
-- GATO NET - MIGRATION 002: INITIAL SEED DATA
-- VPS Virtarix - Ubuntu 24.04 LTS
-- ====================================================================

-- 1. Insert Initial Categories
INSERT INTO categories (id, name, slug, display_order, icon_name, is_active)
VALUES
    ('cat_aberta', 'TV Aberta', 'tv-aberta', 1, 'Tv', true),
    ('cat_esportes', 'Esportes', 'esportes', 2, 'Trophy', true),
    ('cat_filmes', 'Filmes e Séries', 'filmes-series', 3, 'Film', true),
    ('cat_noticias', 'Notícias', 'noticias', 4, 'Newspaper', true),
    ('cat_infantil', 'Infantil', 'infantil', 5, 'Smile', true),
    ('cat_documentarios', 'Documentários', 'documentarios', 6, 'Compass', true),
    ('cat_variedades', 'Variedades', 'variedades', 7, 'Sparkles', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Default Appearance Config
INSERT INTO appearance_configs (id, site_name, tagline, primary_color, dark_navy_color, electric_blue_color)
VALUES ('primary', 'Gato Net', 'Plataforma Profissional de Televisão Ao Vivo', '#060911', '#0b1329', '#2563eb')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Default Payment Config
INSERT INTO payment_configs (id, pix_key, pix_key_type, pix_recipient_name, pix_city, pix_enabled, paypal_payment_link, paypal_business_email, paypal_enabled)
VALUES ('primary', 'financeiro@gatonet.tv.br', 'Email', 'Gato Net Streaming e Mídia Ltda', 'São Paulo', false, 'https://paypal.me/gatonettv', 'payments@gatonet.tv', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Default Access Mode (Modo 1 - Gratuito sem cadastro)
INSERT INTO access_modes (id, current_mode, allow_public_browse, max_simultaneous_streams, stream_relay_enabled)
VALUES ('primary', 'free', true, 2, false)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Default Ad Slots (Neutral placeholders)
INSERT INTO ad_slots (id, slot_type, title, subtitle, target_url, dimensions, is_enabled)
VALUES
    ('ad_header', 'header', 'Espaço Publicitário Reservado', 'Área reservada para veiculação de parceiros institucionais (728x90)', '#', '728x90 px (Leaderboard)', false),
    ('ad_player_side', 'player_side', 'Espaço Publicitário Reservado', 'Área reservada para parceiros e anunciantes da Gato Net.', '#', '300x250 px (Medium Rectangle)', true),
    ('ad_player_bottom', 'player_bottom', 'Espaço Publicitário Reservado', 'Área reservada para comunicação institucional e anunciantes parceiros.', '#', '970x90 px / 728x90 px', true),
    ('ad_inter_categories', 'inter_categories', 'Espaço Publicitário Reservado', 'Área reservada entre seções de categorias', '#', '100% largura x 120 px', false),
    ('ad_footer', 'footer', 'Espaço Publicitário Reservado', 'Área reservada no rodapé da plataforma', '#', '728x90 px ou Responsivo', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Default Subscription Plans (ready for future paid mode activation)
INSERT INTO subscription_plans (id, name, badge, price, period_label, duration_months, features, is_popular, is_active, display_order)
VALUES
    ('plan_mensal', 'Plano Mensal Gato Net', 'Mais Flexível', 24.90, 'por mês', 1, '["Acesso total aos canais da plataforma", "Transmissão Full HD", "Compatível com Smart TV, PC e Smartphone"]'::jsonb, false, true, 1),
    ('plan_trimestral', 'Plano Trimestral VIP', 'Mais Popular', 59.90, 'por 3 meses', 3, '["Acesso completo a todas as categorias", "Transmissão Full HD", "Até 3 telas simultâneas", "Suporte prioritário"]'::jsonb, true, true, 2),
    ('plan_anual', 'Plano Anual Premium', 'Maior Economia', 199.90, 'por ano', 12, '["Acesso irrestrito ao catálogo", "Economia superior a 35%", "Até 4 telas simultâneas"]'::jsonb, false, true, 3)
ON CONFLICT (id) DO NOTHING;
