import { useState, useEffect } from 'react';
export * from './site-content-defaults';
import {
  DEFAULT_SITE_CONTENT,
  type SiteContent,
  type ContactInfo,
} from './site-content-defaults';

const STORAGE_KEY = 'kdf_site_content_v2';
const EVENT_NAME = 'kdf_site_content_change';

export function getStoreGoogleMapsUrl(contact?: Partial<ContactInfo> | null): string {
  // 1. Direct explicit Google Maps URL takes top priority
  const url = contact?.googleMapsUrl?.trim();
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    // If it's an embed URL, convert to clean web search URL for navigation
    if (url.includes('/maps/embed')) {
      const pbMatch = url.match(/!2d(-?\d{1,3}\.\d+)!3d(-?\d{1,2}\.\d+)/);
      if (pbMatch) {
        return `https://www.google.com/maps?q=${pbMatch[2]},${pbMatch[1]}`;
      }
      const qMatch = url.match(/[?&]q=([^&]+)/);
      if (qMatch) {
        return `https://www.google.com/maps?q=${qMatch[1]}`;
      }
    }
    return url;
  }
  // 2. Numerical coordinates fallback
  if (contact?.latitude && contact?.longitude && !isNaN(Number(contact.latitude)) && !isNaN(Number(contact.longitude))) {
    return `https://www.google.com/maps?q=${contact.latitude.trim()},${contact.longitude.trim()}`;
  }
  // 3. Fallback to physical store address query
  const query = [contact?.shopName || 'Krisha Dry Fruits', contact?.address || 'Margao, Goa', contact?.landmark]
    .filter(Boolean)
    .join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function getStoreEmbedMapUrl(contact?: Partial<ContactInfo> | null): string {
  const url = contact?.googleMapsUrl?.trim() || '';

  // 1. If it's an iframe embed URL (e.g. from Google Maps embed iframe src)
  if (url.includes('/maps/embed') || (url.includes('google.com/maps') && url.includes('output=embed'))) {
    return url;
  }

  // 2. If googleMapsUrl contains @lat,lng e.g. /@19.076090,72.877426,17z
  const atMatch = url.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
  if (atMatch) {
    return `https://maps.google.com/maps?q=${atMatch[1]},${atMatch[2]}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  }

  // 3. If googleMapsUrl contains ?q=lat,lng or &query=lat,lng or &ll=lat,lng
  const qCoordMatch = url.match(/[?&](?:q|query|ll)=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
  if (qCoordMatch) {
    return `https://maps.google.com/maps?q=${qCoordMatch[1]},${qCoordMatch[2]}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  }

  // 4. If googleMapsUrl contains !3dlat!4dlng (Google place URLs)
  const pbMatch = url.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/) ||
    url.match(/!2d(-?\d{1,3}\.\d+)!3d(-?\d{1,2}\.\d+)/);
  if (pbMatch) {
    if (url.includes('!2d') && url.indexOf('!2d') < url.indexOf('!3d')) {
      return `https://maps.google.com/maps?q=${pbMatch[2]},${pbMatch[1]}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
    }
    return `https://maps.google.com/maps?q=${pbMatch[1]},${pbMatch[2]}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  }

  // 5. If googleMapsUrl contains a place name / search query /place/Name
  const placeMatch = url.match(/\/maps\/place\/([^/@?]+)/);
  if (placeMatch) {
    const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    return `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  }

  // 6. If googleMapsUrl contains ?q=SearchQuery
  const qTextMatch = url.match(/[?&](?:q|query)=([^&]+)/);
  if (qTextMatch) {
    const query = decodeURIComponent(qTextMatch[1].replace(/\+/g, ' '));
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  }

  // 7. If explicit numerical coordinates are provided in contact
  const lat = contact?.latitude?.trim();
  const lng = contact?.longitude?.trim();
  const isDefaultGoaCoords = (lat === '15.2736' || lat === '15.273612') && (lng === '73.9582' || lng === '73.958215');
  const hasCustomNonGoaAddress = contact?.address && !contact.address.toLowerCase().includes('goa') && !contact.address.toLowerCase().includes('margao');

  if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng)) && !(isDefaultGoaCoords && hasCustomNonGoaAddress)) {
    return `https://maps.google.com/maps?q=${lat},${lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  }

  // 8. Fallback: Search centered on store name & address
  const addressQuery = [contact?.shopName, contact?.address, contact?.landmark]
    .filter(Boolean)
    .join(', ');

  return `https://maps.google.com/maps?q=${encodeURIComponent(addressQuery || 'Krisha Dry Fruits')}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

export function getSiteContent(): SiteContent {
  if (typeof window === 'undefined') return DEFAULT_SITE_CONTENT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_CONTENT;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SITE_CONTENT,
      ...parsed,
      hero: { ...DEFAULT_SITE_CONTENT.hero, ...(parsed.hero || {}) },
      contact: { ...DEFAULT_SITE_CONTENT.contact, ...(parsed.contact || {}) },
      social: { ...DEFAULT_SITE_CONTENT.social, ...(parsed.social || {}) },
      features: Array.isArray(parsed.features) && parsed.features.length > 0 ? parsed.features : DEFAULT_SITE_CONTENT.features,
      locationBanners: Array.isArray(parsed.locationBanners) && parsed.locationBanners.length > 0 ? parsed.locationBanners : DEFAULT_SITE_CONTENT.locationBanners,
    };
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}

export function saveSiteContent(content: SiteContent): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: content }));
  } catch (err) {
    console.error('Failed to save site content to localStorage', err);
  }
}

export function syncWithServerContent(serverData: Partial<SiteContent> | null | undefined): SiteContent {
  if (!serverData) return getSiteContent();
  const merged: SiteContent = {
    ...DEFAULT_SITE_CONTENT,
    ...serverData,
    hero: { ...DEFAULT_SITE_CONTENT.hero, ...(serverData.hero || {}) },
    contact: { ...DEFAULT_SITE_CONTENT.contact, ...(serverData.contact || {}) },
    social: { ...DEFAULT_SITE_CONTENT.social, ...(serverData.social || {}) },
    features: Array.isArray(serverData.features) && serverData.features.length > 0 ? serverData.features : DEFAULT_SITE_CONTENT.features,
    locationBanners: Array.isArray(serverData.locationBanners) && serverData.locationBanners.length > 0 ? serverData.locationBanners : DEFAULT_SITE_CONTENT.locationBanners,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: merged }));
  } catch (err) {
    console.error('Failed to sync site content to localStorage', err);
  }
  return merged;
}

export function resetSiteContent(): SiteContent {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: DEFAULT_SITE_CONTENT }));
  } catch (err) {
    console.error('Failed to reset site content', err);
  }
  return DEFAULT_SITE_CONTENT;
}

export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(getSiteContent);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<SiteContent>;
      if (customEvent.detail) {
        setContent(customEvent.detail);
      } else {
        setContent(getSiteContent());
      }
    };
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return content;
}