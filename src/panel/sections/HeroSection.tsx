import { useRef } from 'react';
import { useDoc } from '../../store/useDoc';
import { uid } from '../../schema/document';
import { LabeledNumber, LabeledRange, Section } from '../Field';

export function HeroSection() {
  const hero = useDoc((s) => s.doc.hero);
  const asset = useDoc((s) => (s.doc.hero.assetId ? s.doc.assets[s.doc.hero.assetId] : null));
  const heroHeight = useDoc((s) => s.doc.design.heroHeight);
  const update = useDoc((s) => s.update);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () =>
        update((d) => {
          const prev = d.hero.assetId;
          const id = uid();
          d.assets[id] = { src, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight };
          d.hero = { assetId: id, offsetX: 0, offsetY: 0, scale: 1 };
          if (prev && prev !== id) delete d.assets[prev];
        });
      img.src = src;
    };
    reader.readAsDataURL(file);
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
    <Section title="Hero Image">
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
              Replace image
            </button>
            <button type="button" className="icon-btn icon-btn--danger" title="Remove image" onClick={removeImage}>
              ✕
            </button>
          </div>

          <LabeledRange label="Shift horizontally" value={hero.offsetX} min={-50} max={50} step={1} format={(v) => `${v}%`} onChange={setHero('offsetX')} />
          <LabeledRange label="Shift vertically" value={hero.offsetY} min={-50} max={50} step={1} format={(v) => `${v}%`} onChange={setHero('offsetY')} />
          <LabeledRange label="Zoom" value={hero.scale} min={1} max={3} step={0.05} format={(v) => `${v.toFixed(2)}×`} onChange={setHero('scale')} />
        </>
      ) : (
        <button type="button" className="add-btn hero-upload" onClick={() => fileRef.current?.click()}>
          + Upload hero image
        </button>
      )}

      <LabeledNumber
        label="Hero height"
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
