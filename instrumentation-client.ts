/* Runs in the browser before the site starts (Next.js instrumentation-client).

   Page changes use React's <ViewTransition>. When the tab is hidden (you switched tabs while a page was
   loading), the browser skips the animation and says so with an error. That is normal and harmless, and React
   ignores it, but only when the message matches exactly. Newer Chrome adds words to the message
   ("... invalid state. Document hidden"), so React showed it as a red error. Here we trim the message back
   to the wording React knows, so it is ignored again. Nothing else about the transition changes. */

const SKIPPED = 'Transition was aborted because of invalid state';

if (typeof document !== 'undefined' && typeof document.startViewTransition === 'function') {
  const start = document.startViewTransition.bind(document);
  const tidy = (e: unknown) =>
    e instanceof DOMException && e.name === 'InvalidStateError' && e.message.startsWith(SKIPPED) && e.message !== SKIPPED
      ? new DOMException(SKIPPED, 'InvalidStateError')
      : e;
  const wrap = (p: Promise<unknown>) => p.catch(e => { throw tidy(e); });
  document.startViewTransition = ((arg?: Parameters<Document['startViewTransition']>[0]) => {
    const t = start(arg);
    return new Proxy(t, {
      get(o, k) {
        if (k === 'ready' || k === 'finished' || k === 'updateCallbackDone') return wrap(o[k]);
        const v = Reflect.get(o, k);
        return typeof v === 'function' ? v.bind(o) : v;
      },
    });
  }) as Document['startViewTransition'];
}
