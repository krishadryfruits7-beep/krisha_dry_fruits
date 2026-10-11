import { useState, useEffect } from 'react';

export interface CustomerReview {
  id?: string;
  _id?: string;
  name: string;
  location: string;
  gradeBought: string;
  rating: number;
  text: string;
  avatar?: string;
  verified?: boolean;
  createdAt?: string;
}

export const INITIAL_SEED_REVIEWS: CustomerReview[] = [
  {
    id: 'rev-1',
    name: 'Ananya Sharma',
    location: 'Mumbai, Maharashtra',
    gradeBought: 'W180 Jumbo King',
    rating: 5,
    text: 'The W180 grade is simply the finest cashew I have ever tasted. Plump, naturally sweet, and exceptionally fresh. Krisha has become my default brand for festival gifting and family snacks.',
    avatar: 'A',
    verified: true,
    createdAt: '2026-09-15T10:00:00.000Z',
  },
  {
    id: 'rev-2',
    name: 'Rajesh Iyer',
    location: 'Bengaluru, Karnataka',
    gradeBought: 'W240 Roasted & Salted',
    rating: 5,
    text: 'I ordered the roasted & salted W240 for my parents — they were amazed by the uniform crunch and clean flavor. The eco packaging is top-tier and delivery reached within 3 days.',
    avatar: 'R',
    verified: true,
    createdAt: '2026-09-20T14:30:00.000Z',
  },
  {
    id: 'rev-3',
    name: 'Priya Nair',
    location: 'Kochi, Kerala',
    gradeBought: 'W210 Honey Glazed',
    rating: 5,
    text: 'The honey glazed cashews are an exquisite indulgence. Delicate sweetness without being syrupy, retaining the deep cashew crunch. An absolute masterpiece with evening coffee.',
    avatar: 'P',
    verified: true,
    createdAt: '2026-09-28T09:15:00.000Z',
  },
];

const REVIEWS_STORAGE_KEY = 'kdf_customer_reviews_v1';
const REVIEWS_EVENT = 'kdf_customer_reviews_change';

export function getStoredReviews(): CustomerReview[] {
  if (typeof window === 'undefined') return INITIAL_SEED_REVIEWS;
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(INITIAL_SEED_REVIEWS));
      return INITIAL_SEED_REVIEWS;
    }
    const list: CustomerReview[] = JSON.parse(raw);
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
    return INITIAL_SEED_REVIEWS;
  } catch {
    return INITIAL_SEED_REVIEWS;
  }
}

export function saveStoredReviews(list: CustomerReview[]): void {
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(REVIEWS_EVENT, { detail: list }));
  } catch (err) {
    console.error('Failed to save reviews to localStorage', err);
  }
}

export function addStoredReview(review: Omit<CustomerReview, 'id'> & { id?: string }): CustomerReview {
  const current = getStoredReviews();
  const id = review.id || review._id || `rev-${Date.now()}`;
  const avatar = review.name ? review.name.trim().charAt(0).toUpperCase() : 'C';

  const newReview: CustomerReview = {
    ...review,
    id,
    avatar,
    verified: true,
    createdAt: review.createdAt || new Date().toISOString(),
  };

  // Newly written reviews appear immediately at the top
  const updated = [newReview, ...current.filter((r) => r.id !== id && r._id !== newReview._id)];
  saveStoredReviews(updated);
  return newReview;
}

export function syncWithServerReviews(serverList: CustomerReview[]): CustomerReview[] {
  if (!Array.isArray(serverList) || serverList.length === 0) return getStoredReviews();
  const local = getStoredReviews();
  const map = new Map<string, CustomerReview>();

  // 1. Put server reviews
  serverList.forEach((r) => {
    const key = (r._id || r.id || `${r.name}-${r.text}`).toLowerCase();
    map.set(key, {
      ...r,
      avatar: r.name ? r.name.trim().charAt(0).toUpperCase() : 'C',
    });
  });

  // 2. Overlay locally submitted reviews
  local.forEach((r) => {
    const key = (r._id || r.id || `${r.name}-${r.text}`).toLowerCase();
    map.set(key, {
      ...r,
      avatar: r.name ? r.name.trim().charAt(0).toUpperCase() : 'C',
    });
  });

  const merged = Array.from(map.values());
  merged.sort((a, b) => {
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  });

  saveStoredReviews(merged);
  return merged;
}

export function useStoredReviews(): CustomerReview[] {
  const [reviews, setReviews] = useState<CustomerReview[]>(getStoredReviews);

  useEffect(() => {
    const handleUpdate = () => {
      setReviews(getStoredReviews());
    };

    window.addEventListener(REVIEWS_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(REVIEWS_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return reviews;
}
