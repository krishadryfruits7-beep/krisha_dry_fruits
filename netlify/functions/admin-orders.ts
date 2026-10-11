import type { Handler } from '@netlify/functions';
import mongoose from 'mongoose';
import { connectDB } from '../../src/lib/mongodb';
import Order from '../../src/lib/models/Order';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
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
    const id = event.queryStringParameters?.id;
    const action = event.queryStringParameters?.action;

    // Dashboard stats
    if (method === 'GET' && action === 'stats') {
      const [total, pending, shipped, delivered, revenue] = await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: 'pending' }),
        Order.countDocuments({ status: 'shipped' }),
        Order.countDocuments({ status: 'delivered' }),
        Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
      ]);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          totalOrders: total,
          pendingOrders: pending,
          shippedOrders: shipped,
          deliveredOrders: delivered,
          totalRevenue: revenue[0]?.total || 0,
        }),
      };
    }

    const getOrderQuery = (targetId: string) => {
      if (mongoose.Types.ObjectId.isValid(targetId)) {
        return { $or: [{ _id: targetId }, { orderId: targetId }] };
      }
      return { orderId: targetId };
    };

    if (method === 'GET' && id) {
      const order = await Order.findOne(getOrderQuery(id)).lean();
      if (!order) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
      return { statusCode: 200, headers, body: JSON.stringify(order) };
    }

    if (method === 'GET') {
      const status = event.queryStringParameters?.status;
      const search = event.queryStringParameters?.search;
      const page = parseInt(event.queryStringParameters?.page || '1');
      const limit = parseInt(event.queryStringParameters?.limit || '20');

      const query: Record<string, any> = {};
      if (status && status !== 'all') query.status = status;
      if (search) {
        query.$or = [
          { orderId: { $regex: search, $options: 'i' } },
          { 'customer.fullName': { $regex: search, $options: 'i' } },
          { 'customer.email': { $regex: search, $options: 'i' } },
          { 'customer.phone': { $regex: search, $options: 'i' } },
        ];
      }

      const [orders, totalCount] = await Promise.all([
        Order.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Order.countDocuments(query),
      ]);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ orders, totalCount, page, totalPages: Math.ceil(totalCount / limit) }),
      };
    }

    if (method === 'PUT' && id) {
      const body = JSON.parse(event.body || '{}');
      const order = await Order.findOneAndUpdate(getOrderQuery(id), body, { new: true });
      if (!order) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
      return { statusCode: 200, headers, body: JSON.stringify(order) };
    }

    if (method === 'DELETE' && id) {
      await Order.findOneAndDelete(getOrderQuery(id));
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
