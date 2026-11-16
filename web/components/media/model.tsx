'use client';
/* 3D dishes: Google's <model-viewer> (loaded only when a 3D dish is shown) with the glTF files in public/media/models. */
import { useEffect, useRef, useState } from 'react';
import { useI } from '@/components/providers/i18n';

let lib: Promise<void> | null = null;
const loadLib = () => lib || (lib = new Promise<void>((res, rej) => {
  if (customElements.get('model-viewer')) return res();
  const s = document.createElement('script'); s.type = 'module';
  s.src = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
  s.onload = () => customElements.whenDefined('model-viewer').then(() => res()); s.onerror = rej;
  document.head.appendChild(s);
}));

export function Model({ id, compact, alt = '' }: { id: string; compact?: boolean; alt?: string }) {
  const i = useI();
  const host = useRef<HTMLDivElement>(null);
  const [st, setSt] = useState<'load' | 'ok' | 'fail'>('load');
  useEffect(() => {
    let dead = false;
    const el = host.current;
    loadLib().then(() => {
      if (dead || !el) return;
      const mv = document.createElement('model-viewer');
      mv.setAttribute('src', `/media/models/${id}.gltf`); mv.setAttribute('alt', alt);
      mv.setAttribute('auto-rotate', ''); if (!compact) mv.setAttribute('camera-controls', '');
      mv.setAttribute('auto-rotate-delay', '0'); mv.setAttribute('rotation-per-second', compact ? '18deg' : '24deg'); mv.setAttribute('interaction-prompt', 'none');
      mv.setAttribute('shadow-intensity', '1.1'); mv.setAttribute('exposure', '1.05'); mv.setAttribute('environment-image', 'neutral'); mv.setAttribute('tone-mapping', 'commerce');
      mv.setAttribute('camera-orbit', '25deg 68deg auto'); mv.setAttribute('touch-action', 'pan-y');
      mv.addEventListener('load', () => setSt('ok')); mv.addEventListener('error', () => setSt('fail'));
      el.appendChild(mv);
    }).catch(() => !dead && setSt('fail'));
    return () => { dead = true; if (el) el.innerHTML = ''; };
  }, [id, compact, alt]);
  return (
    <div className="mv">
      <div className="mv-host" ref={host} />
      {st === 'load' ? <span className="mv-l">{i.t('loading_3d')}</span> : st === 'fail' ? <span className="mv-l">{i.t('d3_fail')}</span> : null}
    </div>
  );
}
