import { useRef, useState } from 'react';
import { useDoc } from '../../store/useDoc';
import { uid } from '../../schema/document';
import { loadImage, ImageLoadError } from '../../lib/loadImage';
import { LabeledNumber, LabeledRange, Section } from '../Field';

export function HeroSection() {
  const hero = useDoc((s) => s.doc.hero);
  const asset = useDoc((s) => (s.doc.hero.assetId ? s.doc.assets[s.doc.hero.assetId] : null));
  const heroHeight = useDoc((s) => s.doc.design.heroHeight);
  const update = useDoc((s) => s.update);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const { src, naturalWidth, naturalHeight } = await loadImage(file);
      update((d) => {
        const prev = d.hero.assetId;
        const id = uid();
        d.assets[id] = { src, naturalWidth, naturalHeight };
        d.hero = { assetId: id, offsetX: 0, offsetY: 0, scale: 1 };
        if (prev && prev !== id) delete d.assets[prev];
      });
    } catch (e) {
      setError(e instanceof ImageLoadError ? e.message : 'Gagal memuat gambar.');
    }
  };

  const removeImage = () =>
    update((d) => {
      const prev = d.hero.assetId;
      d.hero = { assetId: null, offsetX: 0, offsetY: 0, scale: 1 };
      if (prev) delete d.assets[prev];
    });

  const setHero = (key: 'offsetX' | 'offsetY' | 'scale') => (v: number) =>
    update((d) => {
      d.hero[key] = v;
    });

  return (
    <Section title="Gambar Hero">
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
              style={{ transform: `translate(${hero.offsetX}%, ${hero.offsetY}%) scale(${hero.scale})` }}
            />
          </div>
          <div className="hero-actions">
            <button type="button" className="add-btn" onClick={() => fileRef.current?.click()}>
              Ganti gambar
            </button>
            <button type="button" className="icon-btn icon-btn--danger" title="Hapus gambar" onClick={removeImage}>
              ✕
            </button>
          </div>

          <LabeledRange label="Geser mendatar" value={hero.offsetX} min={-50} max={50} step={1} format={(v) => `${v}%`} onChange={setHero('offsetX')} />
          <LabeledRange label="Geser tegak" value={hero.offsetY} min={-50} max={50} step={1} format={(v) => `${v}%`} onChange={setHero('offsetY')} />
          <LabeledRange label="Perbesar" value={hero.scale} min={1} max={3} step={0.05} format={(v) => `${v.toFixed(2)}×`} onChange={setHero('scale')} />
        </>
      ) : (
        <button type="button" className="add-btn hero-upload" onClick={() => fileRef.current?.click()}>
          + Unggah gambar hero
        </button>
      )}

      {error && (
        <p className="hint hint--warn" role="alert">
          {error}
        </p>
      )}

      <LabeledNumber
        label="Tinggi hero"
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
  );
}
