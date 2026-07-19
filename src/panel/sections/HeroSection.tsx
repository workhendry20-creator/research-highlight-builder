import { useRef, useState } from 'react';
import { useDoc } from '../../store/useDoc';
import { uid, type Doc } from '../../schema/document';
import { loadImage, ImageLoadError } from '../../lib/loadImage';
import { LabeledNumber, LabeledRange, Section } from '../Field';

type Frame = { assetId: string | null; offsetX: number; offsetY: number; scale: number };
const EMPTY_FRAME: Frame = { assetId: null, offsetX: 0, offsetY: 0, scale: 1 };

/** One uploadable, framable image bound to either `doc.hero` or `doc.cover`. */
function ImagePicker({ slot, title, blurb }: { slot: 'hero' | 'cover'; title: string; blurb?: string }) {
  const frame = useDoc((s) => (s.doc[slot] ?? EMPTY_FRAME) as Frame);
  const asset = useDoc((s) => {
    const f = (s.doc[slot] ?? EMPTY_FRAME) as Frame;
    return f.assetId ? s.doc.assets[f.assetId] : null;
  });
  const update = useDoc((s) => s.update);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const setFrame = (d: Doc, f: Frame) => {
    if (slot === 'hero') d.hero = f;
    else d.cover = f;
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const { src, naturalWidth, naturalHeight } = await loadImage(file);
      update((d) => {
        const prev = (d[slot] as Frame | undefined)?.assetId ?? null;
        const id = uid();
        d.assets[id] = { src, naturalWidth, naturalHeight };
        setFrame(d, { assetId: id, offsetX: 0, offsetY: 0, scale: 1 });
        if (prev && prev !== id) delete d.assets[prev];
      });
    } catch (e) {
      setError(e instanceof ImageLoadError ? e.message : 'Gagal memuat gambar.');
    }
  };

  const removeImage = () =>
    update((d) => {
      const prev = (d[slot] as Frame | undefined)?.assetId ?? null;
      setFrame(d, { assetId: null, offsetX: 0, offsetY: 0, scale: 1 });
      if (prev) delete d.assets[prev];
    });

  const setKey = (key: 'offsetX' | 'offsetY' | 'scale') => (v: number) =>
    update((d) => {
      const f: Frame = { ...EMPTY_FRAME, ...(d[slot] as Frame | undefined) };
      f[key] = v;
      setFrame(d, f);
    });

  return (
    <Section title={title}>
      {blurb && <p className="hint">{blurb}</p>}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {asset ? (
        <>
          <div className="hero-thumb" style={{ aspectRatio: `${asset.naturalWidth} / ${asset.naturalHeight}` }}>
            <img
              src={asset.src}
              alt=""
              style={{ transform: `translate(${frame.offsetX}%, ${frame.offsetY}%) scale(${frame.scale})` }}
            />
          </div>
          <div className="hero-actions">
            <button type="button" className="add-btn" onClick={() => fileRef.current?.click()}>
              Replace image
            </button>
            <button type="button" className="icon-btn icon-btn--danger" title="Remove image" onClick={removeImage}>
              ✕
            </button>
          </div>

          <LabeledRange label="Shift horizontally" value={frame.offsetX} min={-50} max={50} step={1} format={(v) => `${v}%`} onChange={setKey('offsetX')} />
          <LabeledRange label="Shift vertically" value={frame.offsetY} min={-50} max={50} step={1} format={(v) => `${v}%`} onChange={setKey('offsetY')} />
          <LabeledRange label="Zoom" value={frame.scale} min={1} max={3} step={0.05} format={(v) => `${v.toFixed(2)}×`} onChange={setKey('scale')} />
        </>
      ) : (
        <button type="button" className="add-btn hero-upload" onClick={() => fileRef.current?.click()}>
          + Upload image
        </button>
      )}

      {error && (
        <p className="hint hint--warn" role="alert">
          {error}
        </p>
      )}
    </Section>
  );
}

export function HeroSection() {
  const templateId = useDoc((s) => s.doc.templateId ?? 'paper-1');
  const heroHeight = useDoc((s) => s.doc.design.heroHeight);
  const update = useDoc((s) => s.update);

  // magazine-3 is a gatefold: one cover photo split across both cover sheets, and
  // no article hero — so it shows only the cover picker.
  const isGate = templateId === 'magazine-3';
  // magazine-1 splits the cover (page 1) from the hero (page 2, top).
  const hasCover = templateId === 'magazine-1' || isGate;

  return (
    <>
      {hasCover && (
        <ImagePicker
          slot="cover"
          title={isGate ? 'Gatefold Photo' : 'Cover Image'}
          blurb={isGate ? 'Split across both cover sheets (use a wide photo)' : 'Page 1 · full-bleed cover'}
        />
      )}
      {!isGate && (
        <>
          <ImagePicker slot="hero" title="Hero Image" blurb={hasCover ? 'Page 2 · photo above the article' : undefined} />
          <Section title="Hero height">
            <LabeledNumber
              label="Height"
              unit="mm"
              value={heroHeight}
              min={0}
              max={160}
              step={1}
              onChange={(v) =>
                update((d) => {
                  d.design.heroHeight = v;
                })
              }
            />
          </Section>
        </>
      )}
    </>
  );
}
