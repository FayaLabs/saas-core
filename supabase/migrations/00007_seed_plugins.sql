-- ============================================================
-- Migration 00007: Seed Plugin Registry
-- Registers all plugins and their dependencies in the
-- plugins and plugin_dependencies tables.
-- ============================================================

-- -----------------------------------------------------------
-- 1. Update niche default_plugins
-- -----------------------------------------------------------
update public.niches set default_plugins = '{clients,staff,services,scheduling,financial,analytics,global-search,beauty-journey}'
  where id = 'beauty';

update public.niches set default_plugins = '{clients,staff,services,inventory,financial,analytics,global-search,orders,digital-menu}'
  where id = 'food';

update public.niches set default_plugins = '{clients,staff,services,scheduling,financial,analytics,global-search}'
  where id = 'health';

update public.niches set default_plugins = '{clients,staff,services,scheduling,financial,analytics,global-search}'
  where id = 'services';

-- -----------------------------------------------------------
-- 2. Cross-Niche Plugins
-- -----------------------------------------------------------
insert into public.plugins (id, name, description, icon, version, scope, niche_id, min_plan, is_default, manifest) values
  ('clients',       'Clients & Contacts',           'Unified customer, supplier, and partner management with detail page tab injection',                    'Users',           '1.0.0', 'cross-niche', null, 'free',    true,  '{}'),
  ('staff',         'Staff & Professionals',        'Team member management with work schedules, professions, and permission rules',                        'UserCog',         '1.0.0', 'cross-niche', null, 'free',    true,  '{}'),
  ('services',      'Services Catalog',             'Service and product catalog with categories, packages, and cross-plugin detail tabs',                  'Briefcase',       '1.0.0', 'cross-niche', null, 'free',    true,  '{}'),
  ('scheduling',    'Scheduling & Agenda',          'Calendar-based appointment scheduling with drag-and-drop, waiting list, and service execution',        'Calendar',        '1.0.0', 'cross-niche', null, 'free',    true,  '{}'),
  ('financial',     'Financial Management',         'Invoicing, cash register, bank accounts, credit cards, chart of accounts, and payment tracking',       'DollarSign',      '1.0.0', 'cross-niche', null, 'free',    true,  '{}'),
  ('inventory',     'Inventory & Stock',            'Product catalog, stock movements, locations, DANFE import, recipes, and barcode management',           'Package',         '1.0.0', 'cross-niche', null, 'starter', false, '{}'),
  ('analytics',     'Analytics & Reports',          'Multi-dimensional reporting engine with charts, period filtering, and export',                         'BarChart3',       '1.0.0', 'cross-niche', null, 'free',    true,  '{}'),
  ('marketing',     'Marketing & Communications',   'Message templates, automated event triggers, and multi-channel dispatch',                              'Megaphone',       '1.0.0', 'cross-niche', null, 'starter', false, '{}'),
  ('contracts',     'Contracts & Documents',        'Contract template management, service-linked generation, and digital signatures',                      'FileText',        '1.0.0', 'cross-niche', null, 'starter', false, '{}'),
  ('custom-forms',  'Custom Forms',                 'Drag-and-drop form builder, client-facing form filler, and response tracking',                         'ClipboardList',   '1.0.0', 'cross-niche', null, 'starter', false, '{}'),
  ('pricing',       'Pricing & Price Tables',       'Multiple price tables, price variations, and payment method fee configuration',                        'Tag',             '1.0.0', 'cross-niche', null, 'starter', false, '{}'),
  ('commissions',   'Commissions',                  'Rule-based commission calculation for staff based on services rendered and revenue',                    'Percent',         '1.0.0', 'cross-niche', null, 'pro',     false, '{}'),
  ('crm',           'CRM & Sales Pipeline',         'Quotes, sales journey tracking, pipeline visualization, and lead management',                          'Target',          '1.0.0', 'cross-niche', null, 'starter', false, '{}'),
  ('global-search', 'Global Search',                'Cross-entity search with text normalization and plugin-aware result discovery',                         'Search',          '1.0.0', 'cross-niche', null, 'free',    true,  '{}'),
  ('equipment',     'Equipment & Assets',           'Equipment catalog, asset tracking, and maintenance scheduling',                                        'Wrench',          '1.0.0', 'cross-niche', null, 'starter', false, '{}'),
  ('field-config',  'Field Configuration',          'Per-role field visibility and required field rules across all entity forms',                            'SlidersHorizontal','1.0.0','cross-niche', null, 'starter', false, '{}'),
  ('ecommerce',     'E-Commerce',                   'Online product catalog, shopping cart, and checkout flow',                                             'ShoppingCart',    '1.0.0', 'cross-niche', null, 'pro',     false, '{}');

-- -----------------------------------------------------------
-- 3. Addon Plugins
-- -----------------------------------------------------------
insert into public.plugins (id, name, description, icon, version, scope, niche_id, min_plan, is_default, manifest) values
  ('whatsapp',       'WhatsApp Integration',  'Twilio-powered WhatsApp messaging, bot, templates, and two-way conversations',             'MessageCircle', '1.0.0', 'addon', null, 'starter', false, '{}'),
  ('pix-payments',   'PIX Payments',          'Brazilian instant payment system (PIX) integration for receiving payments',                 'QrCode',        '1.0.0', 'addon', null, 'starter', false, '{}'),
  ('public-booking', 'Online Booking',        'Public booking wizard, client self-service portal, and availability management',            'Globe',         '1.0.0', 'addon', null, 'starter', false, '{}');

-- -----------------------------------------------------------
-- 4. Niche Plugins (beauty)
-- -----------------------------------------------------------
insert into public.plugins (id, name, description, icon, version, scope, niche_id, min_plan, is_default, manifest) values
  ('beauty-journey', 'Beauty Journey', 'Client service journey with before/after photos, revisions, and professional notes', 'Camera', '1.0.0', 'niche', 'beauty', 'free', true, '{}');

-- -----------------------------------------------------------
-- 5. Niche Plugins (food)
-- -----------------------------------------------------------
insert into public.plugins (id, name, description, icon, version, scope, niche_id, min_plan, is_default, manifest) values
  ('orders',       'Orders & Delivery', 'Table-based ordering, kitchen queue/KDS, table management, and delivery tracking',       'UtensilsCrossed', '1.0.0', 'niche', 'food', 'free', true, '{}'),
  ('digital-menu', 'Digital Menu',      'Menu management, public digital menu, QR code access, and AI-powered menu import',       'BookOpen',        '1.0.0', 'niche', 'food', 'free', true, '{}');

-- -----------------------------------------------------------
-- 6. Plugin Dependencies
-- -----------------------------------------------------------
insert into public.plugin_dependencies (plugin_id, depends_on, is_optional) values
  -- scheduling depends on clients, staff, services
  ('scheduling',    'clients',    false),
  ('scheduling',    'staff',      false),
  ('scheduling',    'services',   false),

  -- financial depends on clients
  ('financial',     'clients',    false),

  -- marketing depends on clients
  ('marketing',     'clients',    false),

  -- contracts depends on clients, services
  ('contracts',     'clients',    false),
  ('contracts',     'services',   false),

  -- pricing depends on services
  ('pricing',       'services',   false),

  -- commissions depends on staff, services, financial
  ('commissions',   'staff',      false),
  ('commissions',   'services',   false),
  ('commissions',   'financial',  false),

  -- crm depends on clients
  ('crm',           'clients',    false),

  -- ecommerce depends on inventory, clients
  ('ecommerce',     'inventory',  false),
  ('ecommerce',     'clients',    false),

  -- whatsapp depends on clients
  ('whatsapp',      'clients',    false),

  -- pix-payments depends on financial
  ('pix-payments',  'financial',  false),

  -- public-booking depends on scheduling, services, staff
  ('public-booking','scheduling', false),
  ('public-booking','services',   false),
  ('public-booking','staff',      false),

  -- beauty-journey depends on clients, services, scheduling
  ('beauty-journey','clients',    false),
  ('beauty-journey','services',   false),
  ('beauty-journey','scheduling', false),

  -- orders depends on services, inventory
  ('orders',        'services',   false),
  ('orders',        'inventory',  false),

  -- digital-menu depends on services, inventory
  ('digital-menu',  'services',   false),
  ('digital-menu',  'inventory',  false),

  -- optional dependencies
  ('marketing',     'whatsapp',   true),   -- marketing can use whatsapp as channel
  ('scheduling',    'whatsapp',   true),   -- scheduling can send confirmations via whatsapp
  ('financial',     'pix-payments', true);  -- financial can use PIX for payments
