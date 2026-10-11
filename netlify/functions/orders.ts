import type { Handler } from '@netlify/functions';
import mongoose from 'mongoose';
import { connectDB } from '../../src/lib/mongodb';
import Order from '../../src/lib/models/Order';

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    await connectDB();

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const order = await Order.create(body);
      return { statusCode: 201, headers, body: JSON.stringify(order) };
    }

    if (event.httpMethod === 'GET') {
      const email = event.queryStringParameters?.email || event.queryStringParameters?.search;
      if (email && email.trim()) {
        const cleanEmail = email.trim();
        const orders = await Order.find({
          $or: [
            { 'customer.email': { $regex: cleanEmail, $options: 'i' } },
            { orderId: { $regex: cleanEmail, $options: 'i' } },
          ],
        })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        return { statusCode: 200, headers, body: JSON.stringify({ orders }) };
      }

      const orderId = event.queryStringParameters?.orderId || event.queryStringParameters?.id;
      if (!orderId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'orderId or email required' }) };
      let order = await Order.findOne({ orderId }).lean();
      if (!order && mongoose.Types.ObjectId.isValid(orderId)) {
        order = await Order.findById(orderId).lean();
      }
      if (!order) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
      return { statusCode: 200, headers, body: JSON.stringify(order) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
