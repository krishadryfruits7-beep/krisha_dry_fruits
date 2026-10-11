import type { Handler } from '@netlify/functions';
import { connectDB } from '../../src/lib/mongodb';
import Review from '../../src/lib/models/Review';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    await connectDB();

    if (event.httpMethod === 'GET') {
      const reviews = await Review.find({ active: true }).sort({ createdAt: -1 }).lean();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(reviews),
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const name = (body.name || '').trim();
      const text = (body.text || '').trim();
      const rating = Number(body.rating) || 5;

      if (!name || !text) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Name and review text are required.' }),
        };
      }

      const newReview = await Review.create({
        name,
        location: (body.location || 'India').trim(),
        gradeBought: (body.gradeBought || 'W180 Jumbo King').trim(),
        rating: Math.min(5, Math.max(1, rating)),
        text,
        verified: true,
        active: true,
      });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, review: newReview }),
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Server error' }),
    };
  }
};
