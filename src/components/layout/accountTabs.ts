export const CUSTOMER_TAB_IDS = ['favorites', 'recentViews', 'visits', 'applications'] as const;

export const AGENT_TAB_IDS = ['home', 'myProperties', 'verification', 'analytics', 'bookings'] as const;

export const ADMIN_TAB_IDS = ['overview', 'agents', 'properties', 'bookings', 'requests', 'verification'] as const;

export const NOTIFICATION_TAB_ID = 'notifications';

export type CustomerTabId = (typeof CUSTOMER_TAB_IDS)[number];
export type AgentTabId = (typeof AGENT_TAB_IDS)[number];
export type AdminTabId = (typeof ADMIN_TAB_IDS)[number];

export type TabId = CustomerTabId | AgentTabId | AdminTabId | typeof NOTIFICATION_TAB_ID;

export function tabIdsForRole(isAgent: boolean, isMainAdmin = false): readonly string[] {
  if (isMainAdmin) return ADMIN_TAB_IDS;
  return isAgent ? AGENT_TAB_IDS : CUSTOMER_TAB_IDS;
}

export function defaultTabForRole(isAgent: boolean, isMainAdmin = false): string {
  return tabIdsForRole(isAgent, isMainAdmin)[0];
}
