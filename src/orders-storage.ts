import { useState, useEffect } from 'react';
import type { OrderDetails } from './types';
import { api } from './api';

const ORDERS_KEY = 'kdf_customer_orders_v1';
const ORDERS_EVENT = 'kdf_customer_orders_change';

/**
 * Determines whether an order is actively awaiting delivery/fulfillment.
 * Cancelled and delivered orders are inactive and will NOT count towards the top notification badge.
 */
export function isOrderActive(order: any): boolean {
  if (!order) return false;
  const status = String(order.status || 'pending').toLowerCase().trim();

  // Cancelled, delivered, or completed orders are NOT active
  if (
    status === 'cancelled' ||
    status === 'canceled' ||
    status === 'delivered' ||
    status === 'completed' ||
    status === 'failed' ||
    status === 'returned' ||
    status === 'refunded' ||
    status.includes('cancel') ||
    status.includes('deliver')
  ) {
    return false;
  }

  return true;
}

/**
 * Returns count of active (non-cancelled, non-delivered) orders
 */
export function getActiveOrdersCount(orders: OrderDetails[]): number {
  if (!Array.isArray(orders)) return 0;
  return orders.filter(isOrderActive).length;
}

export function getCustomerOrders(): OrderDetails[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveCustomerOrder(order: OrderDetails): void {
  try {
    const existing = getCustomerOrders();
    const enrichedOrder: any = {
      ...order,
      status: (order as any).status || 'pending',
      createdAt: (order as any).createdAt || order.placedAt || new Date().toISOString(),
    };
    // Prepend new order, deduplicate by orderId
    const filtered = existing.filter((o) => o.orderId !== order.orderId);
    const updated = [enrichedOrder, ...filtered];
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(ORDERS_EVENT, { detail: updated }));
  } catch (err) {
    console.error('Failed to save order locally', err);
  }
}

export function updateCustomerOrderStatus(
  orderId: string,
  status: string,
  trackingNumber?: string,
  notes?: string
): void {
  try {
    const existing = getCustomerOrders();
    let hasMatch = false;
    const updated = existing.map((o: any) => {
      if (o.orderId === orderId || o._id === orderId || o.id === orderId) {
        hasMatch = true;
        return {
          ...o,
          status,
          ...(trackingNumber !== undefined ? { trackingNumber } : {}),
          ...(notes !== undefined ? { notes } : {}),
        };
      }
      return o;
    });

    if (hasMatch) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(ORDERS_EVENT, { detail: updated }));
    }
  } catch (err) {
    console.error('Failed to update order status locally', err);
  }
}

export function deleteCustomerOrder(orderId: string): void {
  try {
    const existing = getCustomerOrders();
    const updated = existing.filter((o: any) => o.orderId !== orderId && o._id !== orderId && o.id !== orderId);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(ORDERS_EVENT, { detail: updated }));
  } catch (err) {
    console.error('Failed to delete order locally', err);
  }
}

let isSyncing = false;
/**
 * Pushes any locally stored orders that are missing from MongoDB Atlas so they become visible on all devices.
 */
export async function pushMissingLocalOrdersToServer(serverOrderIds?: Set<string>): Promise<void> {
  if (typeof window === 'undefined') return;
  const local = getCustomerOrders();
  if (local.length === 0) return;

  const existingIds = serverOrderIds || new Set<string>();
  for (const lo of local) {
    const id = lo.orderId || (lo as any)._id;
    if (id && !existingIds.has(id)) {
      try {
        await api.orders.create(lo);
        existingIds.add(id);
      } catch {
        // Will retry on next sync
      }
    }
  }
}

/**
 * Automatically checks MongoDB backend for each local order to sync live updates
 * (such as admin cancellations, courier dispatches, or deliveries), and auto-heals
 * any orders that only exist in local storage by uploading them to MongoDB.
 */
export async function syncOrdersWithServer(): Promise<OrderDetails[]> {
  if (typeof window === 'undefined' || isSyncing) return getCustomerOrders();
  const current = getCustomerOrders();
  if (current.length === 0) return [];

  isSyncing = true;
  try {
    let changed = false;
    const updated = [...current];

    await Promise.all(
      current.map(async (localOrder, index) => {
        const orderId = localOrder.orderId || (localOrder as any)._id;
        if (!orderId) return;

        try {
          let res: any = null;
          try {
            res = await api.orders.get(orderId);
          } catch (fetchErr: any) {
            const isNotFound =
              fetchErr?.message?.includes('Not found') ||
              fetchErr?.message?.includes('404');
            if (isNotFound) {
              try {
                res = await api.orders.create(localOrder);
              } catch {}
            }
          }

          if (res && res.status && res.status !== localOrder.status) {
            updated[index] = {
              ...localOrder,
              ...res,
              status: res.status,
              trackingNumber: res.trackingNumber ?? localOrder.trackingNumber,
              notes: res.notes ?? (localOrder as any).notes,
            };
            changed = true;
          }
        } catch {
          // Ignore offline / network issues
        }
      })
    );

    if (changed) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(ORDERS_EVENT, { detail: updated }));
      return updated;
    }
    return current;
  } finally {
    isSyncing = false;
  }
}

export function useCustomerOrders(): OrderDetails[] {
  const [orders, setOrders] = useState<OrderDetails[]>(getCustomerOrders);

  useEffect(() => {
    // Run background synchronization on mount to capture any server changes (e.g. admin cancellation)
    syncOrdersWithServer().catch(() => {});

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<OrderDetails[]>;
      if (customEvent.detail) {
        setOrders(customEvent.detail);
      } else {
        setOrders(getCustomerOrders());
      }
    };
    window.addEventListener(ORDERS_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(ORDERS_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return orders;
}

export function useActiveOrdersCount(): number {
  const orders = useCustomerOrders();
  return getActiveOrdersCount(orders);
}
