'use client';
/* The real popover behind <Choose> (components/ui/choose.tsx). It downloads the first time someone reaches
   for a choice list. Base UI handles focus, Escape and outside clicks; the popup grows from its button. */
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Popover } from '@base-ui/react/popover';
import { useI } from '@/components/providers/i18n';
import { I } from './bits';
import type { Opt, ChooseProps } from './choose';

export default function ChooseReal({ label, icon, title, opts, value, onPick, on, cls, align = 'end', children, initialOpen, initialFocus }: ChooseProps & { initialOpen?: boolean; initialFocus?: boolean }) {
  const [o, setO] = useState(!!initialOpen);
  /* keyboard users keep their place when the plain button is swapped for this one */
  const trig = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (initialFocus) trig.current?.focus(); }, [initialFocus]);
  return (
    <Popover.Root open={o} onOpenChange={setO}>
      <Popover.Trigger ref={trig} className={cls || clsx('tb-btn', on && 'on')}>
        {children || <>{icon ? <I n={icon} /> : null}<span>{label}</span><I n="caret-down" /></>}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align={align} className="posr">
          <Popover.Popup className="pop">
            {title ? <h4>{title}</h4> : null}
            {opts.map(([v, l, head]) => head
              ? <h4 key={'h' + v}>{l}</h4>
              : <button key={v} className={clsx('popt', v === value && 'on')} onClick={() => { onPick(v); setO(false); }}>
                  <span className="ck">{v === value ? <I n="check" b /> : null}</span>{l}
                </button>)}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

