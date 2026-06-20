/**
 * Enterprise RBAC Permissions Matrix — Sprint 9F
 *
 * Roles:     super_admin | admin | sales_manager | finance_manager |
 *            marketing_manager | dealer_manager | support_manager | moderator
 * Resources: dealers | agents | leads | orders | products | users | finance |
 *            campaigns | analytics | settings | audit_logs | admins | targets | territories
 * Actions:   read | create | edit | delete | approve | export
 */

const PERMISSIONS = {
  super_admin: {
    dealers:     ['read','create','edit','delete','approve','export'],
    agents:      ['read','create','edit','delete','approve','export'],
    leads:       ['read','create','edit','delete','export'],
    orders:      ['read','create','edit','delete','approve','export'],
    products:    ['read','create','edit','delete','export'],
    users:       ['read','create','edit','delete','export'],
    finance:     ['read','create','edit','delete','approve','export'],
    campaigns:   ['read','create','edit','delete','export'],
    analytics:   ['read','export'],
    settings:    ['read','edit'],
    audit_logs:  ['read','export'],
    admins:      ['read','create','edit','delete'],
    targets:     ['read','create','edit','delete'],
    territories: ['read','create','edit','delete'],
    warehouse:   ['read','create','edit','delete','approve','export'],
  },
  admin: {
    dealers:     ['read','create','edit','approve','export'],
    agents:      ['read','create','edit','export'],
    leads:       ['read','create','edit','export'],
    orders:      ['read','edit','approve','export'],
    products:    ['read','create','edit','delete','export'],
    users:       ['read','edit','export'],
    finance:     ['read','approve','export'],
    campaigns:   ['read','create','edit','export'],
    analytics:   ['read','export'],
    settings:    ['read','edit'],
    audit_logs:  ['read'],
    admins:      [],
    targets:     ['read','create','edit'],
    territories: ['read','create','edit'],
    warehouse:   ['read','create','edit','delete','export'],
  },
  sales_manager: {
    dealers:     ['read','export'],
    agents:      ['read','create','edit','export'],
    leads:       ['read','create','edit','delete','export'],
    orders:      ['read','export'],
    products:    ['read'],
    users:       ['read'],
    finance:     ['read'],
    campaigns:   ['read'],
    analytics:   ['read','export'],
    settings:    [],
    audit_logs:  [],
    admins:      [],
    targets:     ['read','create','edit','delete'],
    territories: ['read','create','edit'],
    warehouse:   [],
  },
  finance_manager: {
    dealers:     ['read','export'],
    agents:      ['read'],
    leads:       ['read'],
    orders:      ['read','edit','approve','export'],
    products:    ['read'],
    users:       ['read'],
    finance:     ['read','create','edit','approve','export'],
    campaigns:   ['read'],
    analytics:   ['read','export'],
    settings:    [],
    audit_logs:  [],
    admins:      [],
    targets:     ['read'],
    territories: [],
    warehouse:   ['read'],
  },
  marketing_manager: {
    dealers:     ['read'],
    agents:      ['read'],
    leads:       ['read','export'],
    orders:      ['read'],
    products:    ['read','edit'],
    users:       ['read'],
    finance:     [],
    campaigns:   ['read','create','edit','delete','export'],
    analytics:   ['read','export'],
    settings:    [],
    audit_logs:  [],
    admins:      [],
    targets:     ['read'],
    territories: [],
    warehouse:   [],
  },
  dealer_manager: {
    dealers:     ['read','edit','approve','export'],
    agents:      ['read'],
    leads:       ['read'],
    orders:      ['read','approve','export'],
    products:    ['read','edit'],
    users:       ['read'],
    finance:     ['read','approve','export'],
    campaigns:   ['read'],
    analytics:   ['read'],
    settings:    [],
    audit_logs:  [],
    admins:      [],
    targets:     ['read'],
    territories: [],
    warehouse:   [],
  },
  support_manager: {
    dealers:     ['read'],
    agents:      ['read'],
    leads:       ['read'],
    orders:      ['read','edit'],
    products:    ['read'],
    users:       ['read','edit'],
    finance:     ['read'],
    campaigns:   ['read'],
    analytics:   [],
    settings:    [],
    audit_logs:  [],
    admins:      [],
    targets:     [],
    territories: [],
    warehouse:   [],
  },
  moderator: {
    dealers:     ['read'],
    agents:      ['read'],
    leads:       ['read'],
    orders:      ['read','edit'],
    products:    ['read','edit'],
    users:       ['read'],
    finance:     ['read'],
    campaigns:   ['read'],
    analytics:   [],
    settings:    [],
    audit_logs:  [],
    admins:      [],
    targets:     ['read'],
    territories: ['read'],
    warehouse:   [],
  },
};

function can(role, resource, action) {
  if (role === 'super_admin') return true;
  const rolePerms     = PERMISSIONS[role];
  if (!rolePerms)     return false;
  const resourcePerms = rolePerms[resource];
  if (!resourcePerms) return false;
  return resourcePerms.includes(action);
}

function canAny(role, resource, actions) {
  return actions.some(a => can(role, resource, a));
}

function getPermissions(role) {
  return PERMISSIONS[role] || {};
}

module.exports = { PERMISSIONS, can, canAny, getPermissions };
