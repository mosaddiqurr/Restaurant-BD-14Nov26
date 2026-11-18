'use client';
/* A QR code for the "For restaurants" page, in one of the table-card looks. It uses the same tested drawing as
   every other Khaoya QR (components/qr/qr-core), so what owners see here is what scans on their tables. */
import { useMemo } from 'react';
import { QR_LOOKS, qrSvg } from '@/components/qr/qr-core';

export const QRL = { rounded: { en: 'Rounded', bn: 'গোলাকার' }, leaf: { en: 'Leaf', bn: 'পাতা' }, dots: { en: 'Dots', bn: 'ডট' }, diamond: { en: 'Diamond', bn: 'ডায়মন্ড' }, classic: { en: 'Classic', bn: 'ক্লাসিক' } };
export type QRLook = keyof typeof QRL;

export function QR({ text, look = 'rounded', color = '#141414' }: { text: string; look?: QRLook; color?: string }) {
  const svg = useMemo(() => {
    const L = QR_LOOKS[look] || QR_LOOKS.rounded;
    return qrSvg(text, { dots: L.dots, eyes: L.eyes, fg: color, eye: color, bg: '#fff' });
  }, [text, look, color]);
  return <div className="qr" dangerouslySetInnerHTML={{ __html: svg }} />;
}
