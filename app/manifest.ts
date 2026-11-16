import type { MetadataRoute } from 'next';

/* lets a phone keep khabo on its home screen (and is what the table menu's offline copy belongs to) */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'khabo',
    short_name: 'khabo',
    description: 'Real menus, real prices and a real look inside, before you leave home. আসল মেনু, আসল দাম, বের হওয়ার আগেই।',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F5F6F3',
    theme_color: '#0C5A3E',
    lang: 'en',
    categories: ['food', 'lifestyle', 'travel'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
