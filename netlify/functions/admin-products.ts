import type { Handler } from '@netlify/functions';
import { connectDB } from '../../src/lib/mongodb';
import Product from '../../src/lib/models/Product';
import { PRODUCTS } from '../../src/data';

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

  const action = event.queryStringParameters?.action;
  if (action === 'verify') {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, authorized: true }) };
  }

  try {
    await connectDB();
    const method = event.httpMethod;
    const id = event.queryStringParameters?.id;

    // Seed products from static data
    if (method === 'POST' && action === 'seed') {
      const count = await Product.countDocuments();
      if (count > 0) return { statusCode: 200, headers, body: JSON.stringify({ message: 'Already seeded', count }) };
      const docs = PRODUCTS.map((p) => ({
        grade: p.grade,
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        longDescription: p.longDescription,
        origin: p.origin,
        gradeDescription: p.gradeDescription,
        image: p.image,
        gallery: p.gallery,
        rating: p.rating,
        reviewCount: p.reviewCount,
        badge: p.badge,
        types: p.types,
        active: true,
      }));
      await Product.insertMany(docs);
      return { statusCode: 201, headers, body: JSON.stringify({ message: 'Seeded', count: docs.length }) };
    }

    if (method === 'GET') {
      const products = await Product.find().sort({ priority: -1, createdAt: -1, _id: -1 }).lean();
      return { statusCode: 200, headers, body: JSON.stringify(products) };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      if (Array.isArray(body.types)) {
        body.types = body.types.map((t: any) => ({
          ...t,
          description: t.description || `Fresh premium ${t.type || 'cashew'} kernels`,
          image: t.image || body.image || '/cashew_single_nut.jpg',
        }));
      }
      const product = await Product.create(body);
      return { statusCode: 201, headers, body: JSON.stringify(product) };
    }

    if (method === 'PUT' && id) {
      const body = JSON.parse(event.body || '{}');
      if (Array.isArray(body.types)) {
        body.types = body.types.map((t: any) => ({
          ...t,
          description: t.description || `Fresh premium ${t.type || 'cashew'} kernels`,
          image: t.image || body.image || '/cashew_single_nut.jpg',
        }));
      }
      const product = await Product.findByIdAndUpdate(id, body, { new: true });
      return { statusCode: 200, headers, body: JSON.stringify(product) };
    }

    if (method === 'DELETE' && id) {
      await Product.findByIdAndDelete(id);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};