import { useState, useEffect } from 'react';
import { adminApi, api } from './api';

export const DEFAULT_PERMANENT_ADMIN_EMAILS = [
  'sanjayparihar0625@gmail.com',
  'krishadryfruits7@gmail.com',
  ...(import.meta.env.VITE_ADMIN_EMAIL ? [import.meta.env.VITE_ADMIN_EMAIL as string] : []),
];

export const PERMANENT_ADMIN_EMAIL = DEFAULT_PERMANENT_ADMIN_EMAILS[0];

const ADMIN_STORAGE_KEY = 'kdf_admin_whitelist_v2';
const ADMIN_EVENT = 'kdf_admin_whitelist_change';

export function getAdminWhitelist(): string[] {
  const permanent = Array.from(
    new Set(DEFAULT_PERMANENT_ADMIN_EMAILS.map((e) => e.trim().toLowerCase()).filter(Boolean))
  );

  if (typeof window === 'undefined') return permanent;

  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(permanent));
      return permanent;
    }
    const list: string[] = JSON.parse(raw);
    const normalized = list.map((e) => e.trim().toLowerCase()).filter(Boolean);
    
    // Ensure all permanent admin emails are always included
    permanent.forEach((p) => {
      if (!normalized.includes(p)) {
        normalized.unshift(p);
      }
    });

    const unique = Array.from(new Set(normalized));
    return unique;
  } catch {
    return permanent;
  }
}

export function syncAdminWhitelist(serverList?: string[]): string[] {
  const permanent = Array.from(
    new Set(DEFAULT_PERMANENT_ADMIN_EMAILS.map((e) => e.trim().toLowerCase()).filter(Boolean))
  );

  const incoming = Array.isArray(serverList)
    ? serverList.map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];

  const merged = Array.from(new Set([...permanent, ...incoming]));
  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(ADMIN_EVENT, { detail: merged }));
  } catch {}
  return merged;
}

export async function fetchAndSyncAdmins(): Promise<string[]> {
  try {
    const res = await adminApi.content.getAdmins();
    if (res && res.adminEmails) {
      return syncAdminWhitelist(res.adminEmails);
    }
  } catch {
    try {
      const publicContent = await api.content.get();
      if (publicContent && publicContent.adminEmails) {
        return syncAdminWhitelist(publicContent.adminEmails);
      }
    } catch {}
  }
  return getAdminWhitelist();
}

export function isPermanentAdmin(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return DEFAULT_PERMANENT_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(clean);
}

export function isAdminAuthorized(email?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  const list = getAdminWhitelist();
  return list.includes(cleanEmail);
}

export async function addAdminEmail(email: string): Promise<{ success: boolean; message: string }> {
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes('@') || !clean.includes('.')) {
    return { success: false, message: 'Please enter a valid email address.' };
  }
  const current = getAdminWhitelist();
  if (current.includes(clean)) {
    return { success: false, message: 'This email is already an authorized administrator.' };
  }
  const updated = [...current, clean];
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(ADMIN_EVENT, { detail: updated }));

  // Sync to database
  try {
    await adminApi.content.updateAdmins(updated);
  } catch (err) {
    console.warn('Could not sync admin to cloud database immediately:', err);
  }

  return { success: true, message: `Admin privileges granted to ${clean}.` };
}

export async function removeAdminEmail(email: string): Promise<{ success: boolean; message: string }> {
  const clean = email.trim().toLowerCase();
  if (isPermanentAdmin(clean)) {
    return { success: false, message: 'Cannot revoke access for a permanent root administrator.' };
  }
  const current = getAdminWhitelist();
  const updated = current.filter((e) => e !== clean);
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(ADMIN_EVENT, { detail: updated }));

  // Sync to database
  try {
    await adminApi.content.updateAdmins(updated);
  } catch (err) {
    console.warn('Could not sync admin revocation to cloud database immediately:', err);
  }

  return { success: true, message: `Admin privileges revoked for ${clean}.` };
}

export function useAdminWhitelist() {
  const [emails, setEmails] = useState<string[]>(getAdminWhitelist);

  useEffect(() => {
    fetchAndSyncAdmins();

    const handler = (e: Event) => {
      const custom = e as CustomEvent<string[]>;
      if (custom.detail) {
        setEmails(custom.detail);
      } else {
        setEmails(getAdminWhitelist());
      }
    };
    window.addEventListener(ADMIN_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(ADMIN_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return {
    emails,
    addAdmin: addAdminEmail,
    removeAdmin: removeAdminEmail,
    permanentAdmins: DEFAULT_PERMANENT_ADMIN_EMAILS,
  };
}
