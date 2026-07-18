/**
 * Read an image File into an embedded data URL plus its natural size, with the
 * validation the two upload sites (HeroSection, BodySection) used to each skip.
 *
 * Assets live inside the Doc as data URLs and get written to IndexedDB on every
 * autosave, so an oversized or undecodable file isn't cosmetic — it bloats
 * storage toward the quota or silently does nothing. Rejects (never resolves
 * half-formed) so callers can surface the reason.
 *
 * Lives in lib/ so panel/ may import it; lib/ still imports nothing from panel/.
 */

export interface LoadedImage {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
}

/** Reject anything larger than this — data URLs this big choke IndexedDB. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export class ImageLoadError extends Error {}

export function loadImage(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new ImageLoadError('Berkas itu bukan gambar.'));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      const mb = Math.round(MAX_IMAGE_BYTES / (1024 * 1024));
      reject(new ImageLoadError(`Gambar terlalu besar (maks ${mb} MB).`));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new ImageLoadError('Gagal membaca berkas.'));
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new ImageLoadError('Gambar rusak atau tidak dapat dibaca.'));
      img.onload = () =>
        resolve({ src, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
