import type { Handler } from '@netlify/functions';
import { connectDB } from '../../src/lib/mongodb';
import SiteContent from '../../src/lib/models/SiteContent';
import { DEFAULT_SITE_CONTENT } from '../../src/site-content-defaults';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const action = event.queryStringParameters?.action;
  if (action === 'resolve-location') {
    let bodyData: any = {};
    try {
      bodyData = JSON.parse(event.body || '{}');
    } catch {}
    const input = (bodyData.input || event.queryStringParameters?.input || '').trim();
    if (!input) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Location input required' }) };
    }

    let targetUrl = input;
    const iframeMatch = input.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframeMatch) {
      targetUrl = iframeMatch[1];
    }

    let lat: string | undefined;
    let lng: string | undefined;
    let placeName: string | undefined;
    let resolvedUrl: string = targetUrl;
    let streetAddress: string | undefined;
    let landmark: string | undefined;

    const rawCoordMatch = targetUrl.match(/^(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)$/);
    if (rawCoordMatch) {
      lat = Number(rawCoordMatch[1]).toFixed(6);
      lng = Number(rawCoordMatch[2]).toFixed(6);
    }

    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      try {
        const response = await fetch(targetUrl, {
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
        resolvedUrl = response.url || targetUrl;
        const html = await response.text();

        // Check for Google consent redirect
        if (resolvedUrl.includes('continue=')) {
          const contMatch = resolvedUrl.match(/[?&]continue=([^&]+)/);
          if (contMatch) {
            resolvedUrl = decodeURIComponent(contMatch[1]);
          }
        }

        // 1. Google Maps place pin: !3d<latitude>!4d<longitude>
        const placePinMatch = resolvedUrl.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/);
        if (placePinMatch) {
          lat = Number(placePinMatch[1]).toFixed(6);
          lng = Number(placePinMatch[2]).toFixed(6);
        }

        // 2. Google Maps viewport center: !2d<longitude>!3d<latitude>
        if (!lat) {
          const vpMatch = resolvedUrl.match(/!2d(-?\d{1,3}\.\d+)!3d(-?\d{1,2}\.\d+)/);
          if (vpMatch) {
            lat = Number(vpMatch[2]).toFixed(6);
            lng = Number(vpMatch[1]).toFixed(6);
          }
        }

        // 3. Standard @lat,lng e.g. /@13.020102,77.547321,17z
        if (!lat) {
          const atMatch = resolvedUrl.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
          if (atMatch) {
            lat = Number(atMatch[1]).toFixed(6);
            lng = Number(atMatch[2]).toFixed(6);
          }
        }

        // 4. Query coords ?q=lat,lng or &query=lat,lng or &ll=lat,lng or center=lat,lng
        if (!lat) {
          const qMatch = resolvedUrl.match(/[?&](?:q|query|ll|center)=(-?\d{1,2}\.\d+)(?:,|%2C)(-?\d{1,3}\.\d+)/);
          if (qMatch) {
            lat = Number(qMatch[1]).toFixed(6);
            lng = Number(qMatch[2]).toFixed(6);
          }
        }

        // 5. Check static map / HTML state
        if (!lat && html) {
          const staticMatch = html.match(/center=(-?\d{1,2}\.\d+)(?:%2C|,)(-?\d{1,3}\.\d+)/i) ||
            html.match(/window\.APP_INITIALIZATION_STATE=\[\[\[(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
          if (staticMatch) {
            lat = Number(staticMatch[1]).toFixed(6);
            lng = Number(staticMatch[2]).toFixed(6);
          }
        }

        const placeMatch = resolvedUrl.match(/\/maps\/place\/([^/@?]+)/);
        if (placeMatch) {
          placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
        }

        if (!placeName && html) {
          const ogTitleMatch = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i) ||
            html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:title["']/i);
          if (ogTitleMatch) {
            placeName = ogTitleMatch[1].split(' · ')[0].replace(/ - Google Maps$/, '').trim();
          }
        }
      } catch (fetchErr) {
        console.warn('Could not resolve redirect URL:', fetchErr);
      }
    }

    if (lat && lng) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
          {
            headers: { 'User-Agent': 'KrishaDryFruits/1.0 (care@krishadryfruits.in)' },
          }
        );
        const geoData = await geoRes.json();
        if (geoData && geoData.display_name) {
          streetAddress = geoData.display_name;
          if (geoData.address) {
            landmark = geoData.address.suburb || geoData.address.neighbourhood || geoData.address.road;
            if (!placeName && (geoData.address.amenity || geoData.address.shop || geoData.address.building)) {
              placeName = geoData.address.amenity || geoData.address.shop || geoData.address.building;
            }
          }
        }
      } catch {}
    } else {
      const queryToSearch = placeName || input;
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryToSearch)}&limit=1&addressdetails=1`,
          {
            headers: { 'User-Agent': 'KrishaDryFruits/1.0 (care@krishadryfruits.in)' },
          }
        );
        const geoData = await geoRes.json();
        if (Array.isArray(geoData) && geoData.length > 0) {
          const item = geoData[0];
          lat = Number(item.lat).toFixed(6);
          lng = Number(item.lon).toFixed(6);
          streetAddress = item.display_name;
          landmark = item.display_name.split(',')[0];
        }
      } catch {}
    }

    const finalGoogleMapsUrl = (lat && lng)
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : resolvedUrl.startsWith('http')
        ? resolvedUrl
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(input)}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        latitude: lat || '',
        longitude: lng || '',
        address: streetAddress || '',
        landmark: landmark || placeName || '',
        shopName: placeName || '',
        googleMapsUrl: finalGoogleMapsUrl,
        resolvedUrl,
      }),
    };
  }

  try {
    await connectDB();
    const doc = await SiteContent.findOne({ key: 'current' }).lean();

    if (!doc) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(DEFAULT_SITE_CONTENT),
      };
    }

    // Merge with DEFAULT_SITE_CONTENT to guarantee all fields exist
    const merged = {
      ...DEFAULT_SITE_CONTENT,
      announcement: doc.announcement ?? DEFAULT_SITE_CONTENT.announcement,
      hero: { ...DEFAULT_SITE_CONTENT.hero, ...(doc.hero || {}) },
      heroSlides: Array.isArray(doc.heroSlides) && doc.heroSlides.length > 0 ? doc.heroSlides : DEFAULT_SITE_CONTENT.heroSlides,
      features: Array.isArray(doc.features) && doc.features.length > 0 ? doc.features : DEFAULT_SITE_CONTENT.features,
      locationBanners: Array.isArray(doc.locationBanners) ? doc.locationBanners : [],
      contact: { ...DEFAULT_SITE_CONTENT.contact, ...(doc.contact || {}) },
      social: { ...DEFAULT_SITE_CONTENT.social, ...(doc.social || {}) },
      footerBio: doc.footerBio ?? DEFAULT_SITE_CONTENT.footerBio,
      adminEmails: Array.isArray(doc.adminEmails) ? doc.adminEmails : [],
    };

    return { statusCode: 200, headers, body: JSON.stringify(merged) };
  } catch (err: any) {
    // If DB is unreachable or timing out, gracefully return default content without breaking frontend
    return { statusCode: 200, headers, body: JSON.stringify(DEFAULT_SITE_CONTENT) };
  }
};
