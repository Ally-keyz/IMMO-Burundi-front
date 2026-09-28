const AGENT_ROLES = new Set(['AGENT', 'FIELD_AGENT']);

export function isAgentRole(role?: string): boolean {
  return Boolean(role && AGENT_ROLES.has(role));
}

export function isMainAdminRole(role?: string): boolean {
  return role === 'MAIN_ADMIN';
}
