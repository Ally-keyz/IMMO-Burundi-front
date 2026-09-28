const ACCESS_KEY = 'immo_access_token';
const REFRESH_KEY = 'immo_refresh_token';

let inMemoryAccess: string | null = null;

export function getAccessToken(): string | null {
  if (inMemoryAccess) return inMemoryAccess;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  inMemoryAccess = accessToken;
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
  inMemoryAccess = null;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function hasStoredTokens(): boolean {
  return Boolean(getAccessToken() || getRefreshToken());
}