export interface CategoryChoice {
  id: string;
  label: string;
}

export const BASE_CATEGORY_CHOICES: CategoryChoice[] = [
  { id: 'almonds', label: 'Almonds (बादाम)' },
  { id: 'cashews', label: 'Cashews (काजू)' },
  { id: 'walnuts', label: 'Walnuts (अखरोट)' },
  { id: 'pistachios', label: 'Pistachios (पिस्ता)' },
  { id: 'dates', label: 'Dates (खजूर)' },
  { id: 'figs', label: 'Figs / Anjeer (अंजीर)' },
  { id: 'raisins', label: 'Raisins / Kishmish (किशमिश)' },
  { id: 'berries-seeds', label: 'Seeds & Berries (बीज और जामुन)' },
  { id: 'gift-boxes', label: 'Gift Boxes & Hampers (गिफ्ट बॉक्स)' },
];

const CUSTOM_CATEGORIES_KEY = 'kdf_custom_categories_v1';

export function getCustomCategories(): CategoryChoice[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomCategory(newCat: { id: string; label: string }): CategoryChoice[] {
  const current = getCustomCategories();
  const exists = current.some((c) => c.id.toLowerCase() === newCat.id.toLowerCase());
  const updated = exists ? current : [...current, newCat];
  try {
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('kdf_categories_change', { detail: updated }));
  } catch (e) {
    console.error('Failed to save category', e);
  }
  return updated;
}

export function getAllCategories(products?: Array<{ category?: string; categoryLabel?: string }>): CategoryChoice[] {
  const custom = getCustomCategories();
  const map = new Map<string, string>();
  BASE_CATEGORY_CHOICES.forEach((c) => map.set(c.id, c.label));
  custom.forEach((c) => map.set(c.id, c.label));
  if (Array.isArray(products)) {
    products.forEach((p) => {
      if (p.category && !map.has(p.category)) {
        map.set(p.category, p.categoryLabel || p.category.charAt(0).toUpperCase() + p.category.slice(1));
      }
    });
  }
  return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
}

