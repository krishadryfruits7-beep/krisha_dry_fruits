import { adminApi } from '@/api';

export async function uploadToCloudinary(file: File, folder?: string): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const res = await adminApi.upload(dataUrl, folder);
        if (res && res.url) {
          resolve(res.url);
          return;
        }
      } catch (err) {
        console.warn('Backend Cloudinary upload failed, falling back to local data URL:', err);
      }
      // Resilient fallback: returns base64 data URL so the uploaded image immediately renders
      resolve(dataUrl);
    };
    reader.onerror = () => {
      console.error('Failed to read image file');
      resolve('');
    };
    reader.readAsDataURL(file);
  });
}
