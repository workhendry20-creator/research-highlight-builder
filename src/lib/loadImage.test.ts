import { describe, expect, it } from 'vitest';
import { loadImage, ImageLoadError, MAX_IMAGE_BYTES } from './loadImage';

// The decode paths (FileReader/Image onload) need a real browser; jsdom can't
// decode. But the guards that matter for storage safety — wrong type, too big —
// reject synchronously before any read, so they're testable here.

function fileOfSize(bytes: number, type: string): File {
  const f = new File(['x'], 'pic', { type });
  Object.defineProperty(f, 'size', { value: bytes });
  return f;
}

describe('loadImage', () => {
  it('rejects a non-image file', async () => {
    const pdf = fileOfSize(1000, 'application/pdf');
    await expect(loadImage(pdf)).rejects.toBeInstanceOf(ImageLoadError);
  });

  it('rejects a file larger than the cap', async () => {
    const huge = fileOfSize(MAX_IMAGE_BYTES + 1, 'image/png');
    await expect(loadImage(huge)).rejects.toBeInstanceOf(ImageLoadError);
  });

  it('allows an image right at the cap past the size guard', async () => {
    // At exactly the cap the size check passes; we only assert it does NOT
    // reject with a size/type error (decode won't complete under jsdom, so we
    // race it against a tick and require no synchronous rejection).
    const atCap = fileOfSize(MAX_IMAGE_BYTES, 'image/png');
    const settled = await Promise.race([
      loadImage(atCap).then(
        () => 'resolved',
        (e) => (e instanceof ImageLoadError && /besar|bukan gambar/i.test(e.message) ? 'guard-rejected' : 'decoding'),
      ),
      new Promise((r) => setTimeout(() => r('pending'), 10)),
    ]);
    expect(settled).not.toBe('guard-rejected');
  });
});
