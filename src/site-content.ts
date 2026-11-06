import { useState, useEffect } from 'react';
export * from './site-content-defaults';
import {
  DEFAULT_SITE_CONTENT,
  DEFAULT_DELIVERY_SETTINGS,
  type SiteContent,
  type ContactInfo,
  type DeliverySettings,
} from './site-content-defaults';

const STORAGE_KEY = 'kdf_site_content_v4';
const EVENT_NAME = 'kdf_site_content_change';

export function extractCoordinatesFromMapsUrl(rawUrl?: string | null): { lat: string; lng: string } | null {
  if (!rawUrl) return null;
  let url = rawUrl.trim();

  // Strip iframe if wrapped
  const iframeMatch = url.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch) {
    url = iframeMatch[1];
  }

  // 1. Raw coordinates "13.020102, 77.547321" or "13.020102 77.547321"
  const rawCoord = url.match(/^(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)$/);
  if (rawCoord) {
    return { lat: rawCoord[1], lng: rawCoord[2] };
  }

  // 2. Google Maps place pin: !3d<latitude>!4d<longitude>
  const placePinMatch = url.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/);
  if (placePinMatch) {
    return { lat: placePinMatch[1], lng: placePinMatch[2] };
  }

  // 3. Google Maps viewport center: !2d<longitude>!3d<latitude>
  const viewportMatch = url.match(/!2d(-?\d{1,3}\.\d+)!3d(-?\d{1,2}\.\d+)/);
  if (viewportMatch) {
    return { lat: viewportMatch[2], lng: viewportMatch[1] };
  }

  // 4. Standard @lat,lng e.g. /@13.020102,77.547321,17z
  const atMatch = url.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
  if (atMatch) {
    return { lat: atMatch[1], lng: atMatch[2] };
  }

  // 5. Query coords ?q=lat,lng or &query=lat,lng or &ll=lat,lng or center=lat,lng
  const qCoordMatch = url.match(/[?&](?:q|query|ll|center)=(-?\d{1,2}\.\d+)(?:,|%2C)(-?\d{1,3}\.\d+)/);
  if (qCoordMatch) {
    return { lat: qCoordMatch[1], lng: qCoordMatch[2] };
  }

  return null;
}

/**
 * Calculates straight-line distance in kilometers between two GPS coordinates using the Haversine formula.
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return 0;
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place (e.g. 7.5 km)
}

export interface DeliveryCalculationResult {
  fee: number;
  distanceKm: number | null;
  isFree: boolean;
  explanation: string;
}

/**
 * Calculates delivery fee based on customer distance from shop or flat rate settings.
 */
export function calculateDeliveryFee({
  subtotal,
  customerLat,
  customerLng,
  shopLat,
  shopLng,
  settings,
}: {
  subtotal: number;
  customerLat?: number;
  customerLng?: number;
  shopLat?: number | string;
  shopLng?: number | string;
  settings?: Partial<DeliverySettings>;
}): DeliveryCalculationResult {
  const cfg: DeliverySettings = { ...DEFAULT_DELIVERY_SETTINGS, ...(settings || {}) };

  const sLat = typeof shopLat === 'string' ? parseFloat(shopLat) : shopLat;
  const sLng = typeof shopLng === 'string' ? parseFloat(shopLng) : shopLng;
  const hasCoords =
    typeof customerLat === 'number' &&
    typeof customerLng === 'number' &&
    typeof sLat === 'number' &&
    typeof sLng === 'number' &&
    !isNaN(customerLat) &&
    !isNaN(customerLng) &&
    !isNaN(sLat) &&
    !isNaN(sLng);

  const distance = hasCoords ? calculateDistanceKm(sLat!, sLng!, customerLat!, customerLng!) : null;

  // 1. Free delivery threshold check
  if (cfg.freeDeliveryThreshold > 0 && subtotal >= cfg.freeDeliveryThreshold) {
    return {
      fee: 0,
      distanceKm: distance,
      isFree: true,
      explanation: distance !== null
        ? `Free Delivery unlocked (${distance} km from store • Order over ₹${cfg.freeDeliveryThreshold.toLocaleString('en-IN')})`
        : `Free Delivery unlocked on orders over ₹${cfg.freeDeliveryThreshold.toLocaleString('en-IN')}`,
    };
  }

  // 2. Flat rate model OR missing GPS coordinates fallback
  if (cfg.pricingModel === 'flat' || !hasCoords || distance === null) {
    return {
      fee: cfg.flatRate,
      distanceKm: distance,
      isFree: false,
      explanation: `Standard Delivery Fee: ₹${cfg.flatRate}`,
    };
  }

  // 3. Exceeds maximum local delivery radius -> fallback to flatOutsideRate (national courier)
  if (cfg.maxKm && distance > cfg.maxKm) {
    return {
      fee: cfg.flatOutsideRate,
      distanceKm: distance,
      isFree: false,
      explanation: `${distance} km (Beyond ${cfg.maxKm} km store radius • Flat Courier Rate: ₹${cfg.flatOutsideRate})`,
    };
  }

  // 4. Within base distance
  if (distance <= cfg.baseKm) {
    return {
      fee: cfg.basePrice,
      distanceKm: distance,
      isFree: false,
      explanation: `${distance} km (Within ${cfg.baseKm} km base zone • Delivery: ₹${cfg.basePrice})`,
    };
  }

  // 5. Base distance + extra KM surcharge
  const extraKm = Math.ceil(distance - cfg.baseKm);
  const extraCharge = extraKm * cfg.pricePerKm;
  const totalFee = cfg.basePrice + extraCharge;

  return {
    fee: totalFee,
    distanceKm: distance,
    isFree: false,
    explanation: `${distance} km (Base ₹${cfg.basePrice} for ${cfg.baseKm} km + ₹${cfg.pricePerKm}/km for extra ${extraKm} km = ₹${totalFee})`,
  };
}

export function getStoreGoogleMapsUrl(contact?: Partial<ContactInfo> | null): string {
  // 1. Accurate numerical coordinates are the highest reliability navigation target
  const lat = contact?.latitude?.trim() || DEFAULT_SITE_CONTENT.contact.latitude;
  const lng = contact?.longitude?.trim() || DEFAULT_SITE_CONTENT.contact.longitude;
  if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  // 2. If googleMapsUrl is provided, check if coordinates can be extracted
  let url = contact?.googleMapsUrl?.trim();
  if (url) {
    const coords = extractCoordinatesFromMapsUrl(url);
    if (coords) {
      return `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
    }

    const iframeMatch = url.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframeMatch) {
      url = iframeMatch[1];
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (url.includes('/maps/embed')) {
        const qMatch = url.match(/[?&]q=([^&]+)/);
        if (qMatch) {
          return `https://www.google.com/maps?q=${qMatch[1]}`;
        }
      }
      return url;
    }
  }

  // 3. Fallback to physical store address query
  if (contact?.address) {
    const query = [contact?.shopName || 'Krisha Dry Fruits', contact?.address, contact?.landmark]
      .filter(Boolean)
      .join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  return 'https://www.google.com/maps';
}

export function getStoreEmbedMapUrl(contact?: Partial<ContactInfo> | null): string {
  // 1. Accurate numerical coordinates pin directly on Google Maps Embed
  const lat = contact?.latitude?.trim() || DEFAULT_SITE_CONTENT.contact.latitude;
  const lng = contact?.longitude?.trim() || DEFAULT_SITE_CONTENT.contact.longitude;
  if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
    return `https://maps.google.com/maps?q=${lat},${lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  }

  let url = contact?.googleMapsUrl?.trim() || '';

  // Extract from <iframe> if pasted
  const iframeMatch = url.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch) {
    url = iframeMatch[1];
  }

  // 2. Direct iframe embed URL
  if (url.includes('/maps/embed') || (url.includes('google.com/maps') && url.includes('output=embed'))) {
    return url;
  }

  // 3. Extract coordinates from URL if present
  const coords = extractCoordinatesFromMapsUrl(url);
  if (coords) {
    return `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  }

  // 4. Place name in URL: /maps/place/PlaceName
  const placeMatch = url.match(/\/maps\/place\/([^/@?]+)/);
  if (placeMatch) {
    const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    return `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  }

  // 5. Query string in URL: ?q=PlaceName
  const qTextMatch = url.match(/[?&](?:q|query)=([^&]+)/);
  if (qTextMatch) {
    const query = decodeURIComponent(qTextMatch[1].replace(/\+/g, ' '));
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  }

  // 6. Fallback to physical store address
  if (contact?.address) {
    const addressQuery = [contact?.shopName || 'Krisha Dry Fruits', contact?.address, contact?.landmark]
      .filter(Boolean)
      .join(', ');
    return `https://maps.google.com/maps?q=${encodeURIComponent(addressQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }

  return 'https://maps.google.com/maps?q=Krisha+Dry+Fruits&t=&z=15&ie=UTF8&iwloc=&output=embed';
}

export function getSiteContent(): SiteContent {
  if (typeof window === 'undefined') return DEFAULT_SITE_CONTENT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_CONTENT;
    const parsed = JSON.parse(raw);
    const contact = { ...DEFAULT_SITE_CONTENT.contact, ...(parsed.contact || {}) };

    // Normalize coordinates if missing but URL exists
    if ((!contact.latitude || !contact.longitude) && contact.googleMapsUrl) {
      const coords = extractCoordinatesFromMapsUrl(contact.googleMapsUrl);
      if (coords) {
        contact.latitude = coords.lat;
        contact.longitude = coords.lng;
      }
    }

    return {
      ...DEFAULT_SITE_CONTENT,
      ...parsed,
      logo: parsed.logo || DEFAULT_SITE_CONTENT.logo,
      hero: { ...DEFAULT_SITE_CONTENT.hero, ...(parsed.hero || {}) },
      heroSlides: Array.isArray(parsed.heroSlides) && parsed.heroSlides.length > 0 ? parsed.heroSlides : DEFAULT_SITE_CONTENT.heroSlides,
      contact,
      delivery: { ...DEFAULT_DELIVERY_SETTINGS, ...(parsed.delivery || {}) },
      social: { ...DEFAULT_SITE_CONTENT.social, ...(parsed.social || {}) },
      categoryBanners: Array.isArray(parsed.categoryBanners) && parsed.categoryBanners.length > 0 ? parsed.categoryBanners : DEFAULT_SITE_CONTENT.categoryBanners,
      features: Array.isArray(parsed.features) ? parsed.features : DEFAULT_SITE_CONTENT.features,
      locationBanners: Array.isArray(parsed.locationBanners) ? parsed.locationBanners : [],
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

  const contact = { ...DEFAULT_SITE_CONTENT.contact, ...(serverData.contact || {}) };
  // If server contact has googleMapsUrl but missing numerical coords, normalize
  if ((!contact.latitude || !contact.longitude) && contact.googleMapsUrl) {
    const coords = extractCoordinatesFromMapsUrl(contact.googleMapsUrl);
    if (coords) {
      contact.latitude = coords.lat;
      contact.longitude = coords.lng;
    }
  }

  const merged: SiteContent = {
    ...DEFAULT_SITE_CONTENT,
    ...serverData,
    logo: serverData.logo || DEFAULT_SITE_CONTENT.logo,
    hero: { ...DEFAULT_SITE_CONTENT.hero, ...(serverData.hero || {}) },
    heroSlides: Array.isArray(serverData.heroSlides) && serverData.heroSlides.length > 0 ? serverData.heroSlides : DEFAULT_SITE_CONTENT.heroSlides,
    categoryBanners: Array.isArray(serverData.categoryBanners) && serverData.categoryBanners.length > 0 ? serverData.categoryBanners : DEFAULT_SITE_CONTENT.categoryBanners,
    contact,
    delivery: { ...DEFAULT_DELIVERY_SETTINGS, ...(serverData.delivery || {}) },
    social: { ...DEFAULT_SITE_CONTENT.social, ...(serverData.social || {}) },
    features: Array.isArray(serverData.features) ? serverData.features : DEFAULT_SITE_CONTENT.features,
    locationBanners: Array.isArray(serverData.locationBanners) ? serverData.locationBanners : [],
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