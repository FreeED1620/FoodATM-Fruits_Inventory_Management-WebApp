import { isSupabaseConfigured, supabase } from './supabaseClient';

const BUCKET = 'fruit-images';

export interface FruitImageRecord {
  id: string;
  fruitName: string;
  imageUrl: string;
  createdAt: string;
}

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }
  return supabase;
}

function normalizeFruitName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-');
}

function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : 'png';
}

export class FruitImageService {
  static async getAll(): Promise<FruitImageRecord[]> {
    const client = requireSupabase();

    const { data, error } = await client
      .from('fruit_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch fruit images: ${error.message}`);

    return (data || []).map(row => ({
      id: row.id,
      fruitName: row.fruit_name,
      imageUrl: row.image_url,
      createdAt: row.created_at,
    }));
  }

  static async getUrlByName(fruitName: string): Promise<string | null> {
    const client = requireSupabase();
    const normalized = normalizeFruitName(fruitName);

    const { data, error } = await client
      .from('fruit_images')
      .select('image_url')
      .eq('fruit_name', normalized)
      .maybeSingle();

    if (error) {
      console.warn(`[FruitImageService] Failed to query fruit_name "${normalized}":`, error.message);
      return null;
    }

    return data?.image_url || null;
  }

  static async upload(fruitName: string, file: File): Promise<FruitImageRecord> {
    const client = requireSupabase();
    const normalized = normalizeFruitName(fruitName);
    const ext = getFileExtension(file.name);
    const storagePath = `${normalized}.${ext}`;

    // Delete existing file for this fruit if any
    await client.storage.from(BUCKET).remove([storagePath]).catch(() => {});

    // Upload new file
    const { error: uploadError } = await client.storage
      .from(BUCKET)
      .upload(storagePath, file, { upsert: true, contentType: file.type });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    // Get public URL
    const { data: urlData } = client.storage.from(BUCKET).getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    // Upsert the mapping record
    const { error: dbError } = await client
      .from('fruit_images')
      .upsert(
        { fruit_name: normalized, image_url: publicUrl },
        { onConflict: 'fruit_name' }
      );

    if (dbError) throw new Error(`Failed to save image record: ${dbError.message}`);

    return {
      id: '',
      fruitName: normalized,
      imageUrl: publicUrl,
      createdAt: new Date().toISOString(),
    };
  }

  static async remove(fruitName: string): Promise<void> {
    const client = requireSupabase();
    const normalized = normalizeFruitName(fruitName);

    // Delete from storage
    const exts = ['png', 'jpg', 'jpeg', 'webp'];
    for (const ext of exts) {
      await client.storage.from(BUCKET).remove([`${normalized}.${ext}`]).catch(() => {});
    }

    // Delete from table
    const { error } = await client
      .from('fruit_images')
      .delete()
      .eq('fruit_name', normalized);

    if (error) throw new Error(`Failed to delete image: ${error.message}`);
  }
}
