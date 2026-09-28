/**
 * Role → default permission matrix — User Roles Spec §36.
 * These are seeded into `role_permissions`; the DB is the runtime source.
 */
import { PermissionScope, UserRole } from './enums.js';
import { PermissionCode } from './permissions.js';

export interface RolePermissionGrant {
  permission: PermissionCode;
  scope: PermissionScope;
}

type P = PermissionCode;
const G: PermissionScope = 'GLOBAL';
const O: PermissionScope = 'OWN';
const D: PermissionScope = 'DEPARTMENT';
const P_: PermissionScope = 'PROVINCE';
const C: PermissionScope = 'COMMUNE';
const A: PermissionScope = 'ASSIGNED';
const PB: PermissionScope = 'PUBLIC';

export const ROLE_DEFAULT_MATRIX: Record<UserRole, RolePermissionGrant[]> = {
  MAIN_ADMIN: [
    'users.view', 'users.create', 'users.update', 'users.suspend', 'users.delete', 'users.change_role',
    'properties.view', 'properties.create', 'properties.update', 'properties.submit', 'properties.review',
    'properties.approve', 'properties.reject', 'properties.publish', 'properties.unpublish', 'properties.archive',
    'properties.delete', 'properties.view_sensitive',
    'verification.view', 'verification.create', 'verification.assign', 'verification.review',
    'verification.update', 'verification.approve', 'verification.reject', 'verification.generate_code', 'verification.view_history',
    'accounting.view', 'accounting.create', 'accounting.update', 'accounting.reconcile', 'accounting.refund', 'accounting.export',
    'promotion.view', 'promotion.create', 'promotion.update', 'promotion.approve', 'promotion.activate', 'promotion.cancel',
    'reports.view', 'reports.create', 'reports.export', 'reports.financial', 'reports.global',
    'analytics.view', 'analytics.property', 'analytics.agent', 'analytics.global',
    'staff.view', 'staff.view_sensitive', 'staff.create', 'staff.update', 'staff.suspend', 'staff.permissions',
    'audit.view', 'audit.export',
    'system.settings', 'system.integrations', 'system.security', 'system.roles', 'system.permissions',
    'favorites.view', 'favorites.manage', 'enquiries.create', 'enquiries.view', 'enquiries.respond',
    'visits.view', 'visits.create', 'visits.update',
    'rentalApplications.create', 'rentalApplications.view', 'rentalApplications.review',
    'messages.view', 'messages.send', 'notifications.view', 'geo.view', 'files.view',
  ].map((permission) => ({ permission, scope: G } as RolePermissionGrant)),

  CHIEF: [
    ['properties.view', A], ['properties.review', A], ['verification.view', A], ['verification.review', A],
    ['accounting.view', A], ['reports.view', A], ['reports.financial', A], ['reports.global', A],
    ['analytics.view', A], ['analytics.global', A], ['users.view', D],
  ].map(([p, s]) => ({ permission: p as P, scope: s as PermissionScope })),

  DEPARTMENT_HEAD: [
    ['properties.view', D], ['properties.review', D], ['verification.view', D], ['verification.review', D],
    ['accounting.view', D], ['reports.view', D], ['analytics.view', D], ['users.view', D], ['staff.view', D],
  ].map(([p, s]) => ({ permission: p as P, scope: s as PermissionScope })),

  PROVINCIAL_ADMIN: [
    ['properties.view', P_], ['properties.review', P_], ['properties.approve', P_], ['properties.reject', P_],
    ['verification.view', P_], ['verification.review', P_], ['users.view', P_],
    ['reports.view', P_], ['analytics.view', P_], ['staff.view', P_],
  ].map(([p, s]) => ({ permission: p as P, scope: s as PermissionScope })),

  COMMUNE_ADMIN: [
    ['properties.view', C], ['properties.review', C], ['verification.view', C],
    ['users.view', C], ['reports.view', C], ['analytics.view', C], ['staff.view', C],
  ].map(([p, s]) => ({ permission: p as P, scope: s as PermissionScope })),

  REGIONAL_SUPERVISOR: [
    ['properties.view', A], ['properties.review', A], ['properties.submit', A],
    ['verification.view', A], ['verification.review', A],
    ['analytics.view', A], ['analytics.agent', A], ['staff.view', A], ['reports.view', A],
  ].map(([p, s]) => ({ permission: p as P, scope: s as PermissionScope })),

  VERIFICATION_OFFICER: [
    ['properties.view', A], ['properties.review', A], ['verification.view', A], ['verification.create', A],
    ['verification.assign', A], ['verification.review', A], ['verification.update', A],
    ['verification.approve', A], ['verification.reject', A], ['verification.generate_code', A],
    ['verification.view_history', A], ['files.view', A],
  ].map(([p, s]) => ({ permission: p as P, scope: s as PermissionScope })),

  ACCOUNTANT: [
    ['accounting.view', A], ['accounting.create', A], ['accounting.update', A], ['accounting.reconcile', A],
    ['accounting.refund', A], ['accounting.export', A], ['reports.view', A], ['reports.financial', A],
    ['reports.export', A], ['properties.view', A],
  ].map(([p, s]) => ({ permission: p as P, scope: s as PermissionScope })),

  MODERATOR: [
    ['properties.view', A], ['properties.review', A], ['properties.update', A],
    ['reports.view', A], ['users.view', A],
  ].map(([p, s]) => ({ permission: p as P, scope: s as PermissionScope })),

  SUPPORT_OFFICER: [
    ['properties.view', A], ['enquiries.view', A], ['enquiries.respond', A],
    ['messages.view', A], ['messages.send', A], ['visits.view', A], ['visits.update', A], ['users.view', A],
  ].map(([p, s]) => ({ permission: p as P, scope: s as PermissionScope })),

  MARKETING_OFFICER: [
    ['promotion.view', A], ['promotion.create', A], ['promotion.update', A], ['promotion.approve', A],
    ['promotion.activate', A], ['promotion.cancel', A], ['properties.view', A],
    ['analytics.view', A], ['reports.view', A],
  ].map(([p, s]) => ({ permission: p as P, scope: s as PermissionScope })),

  FIELD_AGENT: [
    ['properties.create', O], ['properties.view', O], ['properties.update', O], ['properties.delete', O], ['properties.submit', O],
    ['verification.create', O], ['accounting.view', O], ['analytics.property', O],
    ['enquiries.view', O], ['enquiries.respond', O], ['messages.view', O], ['messages.send', O],
    ['visits.view', O], ['visits.create', O], ['files.view', O],
  ].map(([p, s]) => ({ permission: p as P, scope: s as PermissionScope })),

  PROPERTY_OWNER: [
    ['properties.create', O], ['properties.view', O], ['properties.update', O], ['properties.submit', O],
    ['verification.create', O], ['accounting.view', O], ['analytics.property', O],
    ['enquiries.view', O], ['messages.view', O], ['messages.send', O],
  ].map(([p, s]) => ({ permission: p as P, scope: s as PermissionScope })),

  LANDLORD: [
    ['properties.create', O], ['properties.view', O], ['properties.update', O], ['properties.submit', O],
    ['verification.create', O], ['accounting.view', O], ['analytics.property', O],
    ['enquiries.view', O], ['rentalApplications.view', O], ['rentalApplications.review', O],
    ['visits.view', O], ['messages.view', O], ['messages.send', O],
  ].map(([p, s]) => ({ permission: p as P, scope: s as PermissionScope })),

  BUYER: [
    ['properties.view', PB], ['favorites.view', O], ['favorites.manage', O],
    ['enquiries.create', O], ['visits.create', O], ['visits.view', O],
    ['rentalApplications.create', O], ['rentalApplications.view', O],
    ['messages.view', O], ['messages.send', O], ['accounting.view', O],
  ].map(([p, s]) => ({ permission: p as P, scope: s as PermissionScope })),

  TENANT: [
    ['properties.view', PB], ['favorites.view', O], ['favorites.manage', O],
    ['enquiries.create', O], ['visits.create', O], ['visits.view', O],
    ['rentalApplications.create', O], ['rentalApplications.view', O],
    ['messages.view', O], ['messages.send', O], ['accounting.view', O],
  ].map(([p, s]) => ({ permission: p as P, scope: s as PermissionScope })),

  INVESTOR: [
    ['properties.view', PB], ['favorites.view', O], ['favorites.manage', O],
    ['enquiries.create', O], ['visits.create', O],
    ['rentalApplications.create', O], ['messages.view', O], ['messages.send', O],
    ['analytics.view', PB],
  ].map(([p, s]) => ({ permission: p as P, scope: s as PermissionScope })),

  CLIENT: [
    ['properties.view', PB], ['favorites.view', O], ['favorites.manage', O],
    ['enquiries.create', O], ['visits.create', O], ['visits.view', O],
    ['rentalApplications.create', O], ['rentalApplications.view', O],
    ['messages.view', O], ['messages.send', O], ['notifications.view', O],
  ].map(([p, s]) => ({ permission: p as P, scope: s as PermissionScope })),

  CUSTOMER: [
    ['properties.view', PB], ['favorites.view', O], ['favorites.manage', O],
    ['enquiries.create', O], ['visits.create', O], ['visits.view', O],
    ['rentalApplications.create', O], ['rentalApplications.view', O],
    ['messages.view', O], ['messages.send', O], ['notifications.view', O],
  ].map(([p, s]) => ({ permission: p as P, scope: s as PermissionScope })),

  AGENT: [
    ['properties.create', O], ['properties.view', O], ['properties.update', O], ['properties.delete', O], ['properties.submit', O],
    ['verification.create', O], ['accounting.view', O], ['analytics.property', O],
    ['enquiries.view', O], ['enquiries.respond', O], ['messages.view', O], ['messages.send', O],
    ['visits.view', O], ['visits.create', O], ['files.view', O],
  ].map(([p, s]) => ({ permission: p as P, scope: s as PermissionScope })),

  GUEST: [
    ['properties.view', PB], ['geo.view', PB], ['files.view', PB],
  ].map(([p, s]) => ({ permission: p as P, scope: s as PermissionScope })),
};