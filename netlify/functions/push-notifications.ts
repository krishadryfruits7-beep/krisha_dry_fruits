import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

let cachedServiceAccount: any = null;

function getServiceAccount(): any {
  if (cachedServiceAccount) return cachedServiceAccount;

  // 1. Try reading from environment variable (FIREBASE_SERVICE_ACCOUNT in Netlify)
  const envVal = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (envVal) {
    try {
      cachedServiceAccount = JSON.parse(envVal);
      return cachedServiceAccount;
    } catch (e) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT env:', e);
    }
  }

  // 2. Try reading local credentials file if present
  try {
    const cwd = process.cwd();
    const files = fs.readdirSync(cwd);
    const saFile = files.find((f) => f.includes('firebase-adminsdk') && f.endsWith('.json')) || 'serviceAccountKey.json';
    const saPath = path.resolve(cwd, saFile);
    if (fs.existsSync(saPath)) {
      cachedServiceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
      return cachedServiceAccount;
    }
  } catch {}

  return null;
}

function base64Url(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getAccessToken(sa: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const tokenPayload = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(tokenPayload);
  const signature = signer
    .sign(sa.private_key, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${tokenPayload}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${encodeURIComponent(jwt)}`,
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Failed to get Google OAuth2 token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

export async function sendNewOrderPushNotification(order: {
  orderId?: string;
  _id?: any;
  total?: number;
  customer?: { fullName?: string; phone?: string; city?: string };
  paymentMethod?: string;
}) {
  const sa = getServiceAccount();
  if (!sa || !sa.project_id || !sa.private_key) {
    console.warn('Firebase Service Account not configured, skipping real-time push.');
    return { skipped: true, reason: 'No service account key' };
  }

  try {
    const accessToken = await getAccessToken(sa);
    const orderId = String(order.orderId || order._id || 'NEW');
    const customerName = order.customer?.fullName?.trim() || 'A Customer';
    const amount = order.total ? `₹${Math.round(order.total)}` : '';
    const payment = order.paymentMethod ? `(${order.paymentMethod.toUpperCase()})` : '';

    const title = `🚨 New Order: #${orderId}`;
    const body = `${customerName} ordered ${amount} ${payment}. Tap to review and fulfill.`.trim();
    const targetUrl = `https://krishadryfruits.in/admin?tab=orders&orderId=${orderId}`;

    const payload = {
      message: {
        topic: 'admin_orders',
        notification: {
          title,
          body,
        },
        data: {
          orderId,
          targetUrl,
          total: String(order.total || 0),
          customerName,
        },
        android: {
          priority: 'HIGH',
          notification: {
            sound: 'default',
            channel_id: 'krisha_orders_channel',
            notification_priority: 'PRIORITY_MAX',
            default_vibrate_timings: true,
            default_light_settings: true,
          },
        },
      },
    };

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    console.log('Firebase Push Notification sent successfully:', result);
    return { success: true, result };
  } catch (err: any) {
    console.error('Error sending push notification:', err.message);
    return { success: false, error: err.message };
  }
}
