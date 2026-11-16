'use client';
/* Toasts (Sonner) without putting Sonner in the first download: the first toast loads it.
   Same calls as Sonner: toast(message, options), toast.success(...), toast.error(...). */
import type { ExternalToast } from 'sonner';
import type { ReactNode } from 'react';

const load = () => import('sonner').then(m => m.toast);
type Msg = string | ReactNode;
export function toast(msg: Msg, o?: ExternalToast) { load().then(t => t(msg, o)); }
toast.success = (msg: Msg, o?: ExternalToast) => { load().then(t => t.success(msg, o)); };
toast.error = (msg: Msg, o?: ExternalToast) => { load().then(t => t.error(msg, o)); };
toast.message = (msg: Msg, o?: ExternalToast) => { load().then(t => t.message(msg, o)); };
