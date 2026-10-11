import type { Handler } from '@netlify/functions';
import { connectDB } from '../../src/lib/mongodb';
import Product from '../../src/lib/models/Product';

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    await connectDB();

    const id = event.queryStringParameters?.id;

    if (id) {
      const product = await Product.findById(id).lean();
      if (!product) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
      return { statusCode: 200, headers, body: JSON.stringify(product) };
    }

    const products = await Product.find({ active: true }).sort({ priority: -1, createdAt: -1, _id: -1 }).lean();
    return { statusCode: 200, headers, body: JSON.stringify(products) };
  } catch (err: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
