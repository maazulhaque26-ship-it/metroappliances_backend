import { useSelector } from 'react-redux';

const PERMISSIONS = {
  super_admin: {
    dealers: ['read','create','edit','delete','approve','export'],
    agents:  ['read','create','edit','delete','approve','export'],
    leads:   ['read','create','edit','delete','export'],
    orders:  ['read','create','edit','delete','approve','export'],
    products:['read','create','edit','delete','export'],
    users:   ['read','create','edit','delete','export'],
    finance: ['read','create','edit','delete','approve','export'],
    campaigns:['read','create','edit','delete','export'],
    analytics:['read','export'],
    settings: ['read','edit'],
    audit_logs:['read','export'],
    admins:   ['read','create','edit','delete'],
    targets:  ['read','create','edit','delete'],
    territories:['read','create','edit','delete'],
  },
  admin: {
    dealers: ['read','create','edit','approve','export'],
    agents:  ['read','create','edit','export'],
    leads:   ['read','create','edit','export'],
    orders:  ['read','edit','approve','export'],
    products:['read','create','edit','delete','export'],
    users:   ['read','edit','export'],
    finance: ['read','approve','export'],
    campaigns:['read','create','edit','export'],
    analytics:['read','export'],
    settings: ['read','edit'],
    audit_logs:['read'],
    admins:   [],
    targets:  ['read','create','edit'],
    territories:['read','create','edit'],
  },
  moderator: {
    dealers: ['read'],
    agents:  ['read'],
    leads:   ['read'],
    orders:  ['read','edit'],
    products:['read','edit'],
    users:   ['read'],
    finance: ['read'],
    campaigns:['read'],
    analytics:[],
    settings: [],
    audit_logs:[],
    admins:   [],
    targets:  ['read'],
    territories:['read'],
  },
};

export function usePermissions() {
  const user = useSelector(s => s.auth?.userInfo || s.auth?.user);
  const role = user?.role || 'user';
  const rolePerms = PERMISSIONS[role] || {};

  const can = (resource, action) => {
    if (role === 'super_admin') return true;
    return (rolePerms[resource] || []).includes(action);
  };

  const canAny = (resource, actions) => actions.some(a => can(resource, a));

  return { role, can, canAny, isAdmin: role === 'admin' || role === 'super_admin', isSuperAdmin: role === 'super_admin' };
}
