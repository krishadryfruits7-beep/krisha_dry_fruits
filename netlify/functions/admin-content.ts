import type { Handler } from '@netlify/functions';
import { connectDB } from '../../src/lib/mongodb';
import SiteContent from '../../src/lib/models/SiteContent';
import { DEFAULT_SITE_CONTENT } from '../../src/site-content-defaults';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

function isAuthorized(event: Parameters<Handler>[0]): boolean {
  const auth = event.headers['authorization'] || event.headers['Authorization'];
  return auth === `Bearer ${process.env.ADMIN_SECRET}`;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (!isAuthorized(event)) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };

  try {
    await connectDB();
    const method = event.httpMethod;
    const action = event.queryStringParameters?.action;

    if (action === 'reset') {
      await SiteContent.deleteOne({ key: 'current' });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Reset to defaults', content: DEFAULT_SITE_CONTENT }),
      };
    }

    if (action === 'resolve-location') {
      let bodyData: any = {};
      try {
        bodyData = JSON.parse(event.body || '{}');
      } catch {}
      const input = (bodyData.input || event.queryStringParameters?.input || '').trim();
      if (!input) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Location input required' }) };
      }

      // Check if input contains an iframe
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

      // 1. Check for raw coordinates: e.g. "15.2736, 73.9582" or "15.2736 73.9582"
      const rawCoordMatch = targetUrl.match(/^(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)$/);
      if (rawCoordMatch) {
        lat = Number(rawCoordMatch[1]).toFixed(6);
        lng = Number(rawCoordMatch[2]).toFixed(6);
      }

      // 2. If it's a URL, follow redirects and parse coordinates / metadata
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

      // 3. Reverse-geocode if coordinates were found to get formatted address & landmark
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
        // 4. Forward-geocode search query/place name
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

    if (action === 'get-admins') {
      const doc = await SiteContent.findOne({ key: 'current' }).lean();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, adminEmails: doc?.adminEmails || [] }),
      };
    }

    if (action === 'update-admins') {
      const body = JSON.parse(event.body || '{}');
      const adminEmails = Array.isArray(body.adminEmails) ? body.adminEmails : [];
      const updated = await SiteContent.findOneAndUpdate(
        { key: 'current' },
        { $set: { adminEmails } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, adminEmails: updated?.adminEmails || [] }),
      };
    }

    if (method === 'GET') {
      const doc = await SiteContent.findOne({ key: 'current' }).lean();
      return { statusCode: 200, headers, body: JSON.stringify(doc || DEFAULT_SITE_CONTENT) };
    }

    if (method === 'PUT' || method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const updatePayload: Record<string, any> = {
        key: 'current',
        announcement: body.announcement,
        hero: body.hero,
        heroSlides: body.heroSlides,
        features: body.features,
        locationBanners: body.locationBanners,
        contact: body.contact,
        social: body.social,
        footerBio: body.footerBio,
      };
      if (Array.isArray(body.adminEmails)) {
        updatePayload.adminEmails = body.adminEmails;
      }

      const updated = await SiteContent.findOneAndUpdate(
        { key: 'current' },
        updatePayload,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, content: updated }),
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
