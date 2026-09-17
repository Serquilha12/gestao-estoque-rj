import { supabaseAdmin } from './admin';

export const PRODUCT_STORAGE_BUCKET = 'produtos';

/**
 * Faz upload de imagem de produto para o bucket do Supabase Storage
 * e retorna a URL pública gerada.
 */
export async function uploadProductImage(
  fileBuffer: Buffer | ArrayBuffer | Uint8Array,
  filename: string,
  contentType: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const fileExt = filename.split('.').pop() || 'jpg';
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `itens/${cleanFileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(PRODUCT_STORAGE_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(PRODUCT_STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrlData.publicUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Erro inesperado ao enviar imagem para o Supabase Storage.',
    };
  }
}

/**
 * Remove uma imagem do Supabase Storage dada a sua URL pública ou caminho
 */
export async function deleteProductImage(pathOrUrl: string): Promise<boolean> {
  try {
    const urlParts = pathOrUrl.split(`${PRODUCT_STORAGE_BUCKET}/`);
    const path = urlParts.length > 1 ? urlParts[1] : pathOrUrl;

    const { error } = await supabaseAdmin.storage
      .from(PRODUCT_STORAGE_BUCKET)
      .remove([path]);

    return !error;
  } catch {
    return false;
  }
}
