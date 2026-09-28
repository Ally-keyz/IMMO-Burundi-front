/**
 * Central permission catalog — User Roles/Permissions Spec §22.
 * Granular `resource.action` format; enforced server-side, never by UI hiding.
 */
export const RESOURCES = [
  'users', 'properties', 'verification', 'accounting', 'promotion',
  'reports', 'analytics', 'staff', 'audit', 'system',
  'favorites', 'enquiries', 'visits', 'rentalApplications',
  'messages', 'notifications', 'geo', 'files',
] as const;
export type Resource = (typeof RESOURCES)[number];

export const PERMISSIONS = [
  // users
  'users.view', 'users.create', 'users.update', 'users.suspend', 'users.delete', 'users.change_role',
  // properties
  'properties.view', 'properties.create', 'properties.update', 'properties.submit',
  'properties.review', 'properties.approve', 'properties.reject', 'properties.publish',
  'properties.unpublish', 'properties.archive', 'properties.delete', 'properties.view_sensitive',
  // verification
  'verification.view', 'verification.create', 'verification.assign', 'verification.review',
  'verification.update', 'verification.approve', 'verification.reject',
  'verification.generate_code', 'verification.view_history',
  // accounting
  'accounting.view', 'accounting.create', 'accounting.update', 'accounting.reconcile',
  'accounting.refund', 'accounting.export',
  // promotion
  'promotion.view', 'promotion.create', 'promotion.update', 'promotion.approve',
  'promotion.activate', 'promotion.cancel',
  // reports
  'reports.view', 'reports.create', 'reports.export', 'reports.financial', 'reports.global',
  // analytics
  'analytics.view', 'analytics.property', 'analytics.agent', 'analytics.global',
  // staff
  'staff.view', 'staff.view_sensitive', 'staff.create', 'staff.update', 'staff.suspend', 'staff.permissions',
  // audit
  'audit.view', 'audit.export',
  // system
  'system.settings', 'system.integrations', 'system.security', 'system.roles', 'system.permissions',
  // client-facing
  'favorites.view', 'favorites.manage',
  'enquiries.create', 'enquiries.view', 'enquiries.respond',
  'visits.view', 'visits.create', 'visits.update',
  'rentalApplications.create', 'rentalApplications.view', 'rentalApplications.review',
  'messages.view', 'messages.send',
  'notifications.view',
  'geo.view',
  'files.view',
] as const;

export type PermissionCode = (typeof PERMISSIONS)[number];