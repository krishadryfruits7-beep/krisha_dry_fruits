import type { Handler } from '@netlify/functions';
import { v2 as cloudinary } from 'cloudinary';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function isAuthorized(event: Parameters<Handler>[0]): boolean {
  const auth = event.headers['authorization'] || event.headers['Authorization'];
  return auth === `Bearer ${process.env.ADMIN_SECRET}`;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (!isAuthorized(event)) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const body = JSON.parse(event.body || '{}');
    const { data, folder = 'krisha_dry_fruits' } = body;

    if (!data) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No image data provided' }) };

    const isBrand = String(folder).toLowerCase().includes('brand') || String(folder).toLowerCase().includes('logo');
    const transformation = isBrand
      ? [{ width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }]
      : [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' }];

    const result = await cloudinary.uploader.upload(data, {
      folder,
      transformation,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: result.secure_url, publicId: result.public_id }),
    };
  } catch (err: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
