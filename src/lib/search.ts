import type { ListingType } from '@immo/shared-types';

const SEARCHED_KEY = 'immo.searched';

/** Map a hero search tab to the listing type query parameter. */
export function listingTypeFromTab(tab: 'BUY' | 'RENT' | 'LAND' | 'COMMERCIAL'): ListingType | '' {
  switch (tab) {
    case 'BUY':
      return 'SALE';
    case 'RENT':
      return 'RENT';
    case 'LAND':
      return 'SALE';
    case 'COMMERCIAL':
      return 'SALE';
  }
}

/** Remember that the user performed at least one search. */
export function markSearchPerformed(): void {
  try {
    localStorage.setItem(SEARCHED_KEY, '1');
  } catch {
    /* storage unavailable — ignore */
  }
}

/** True when the user has performed a search in this browser. */
export function hasSearchedBefore(): boolean {
  try {
    return localStorage.getItem(SEARCHED_KEY) === '1';
  } catch {
    return false;
  }
}