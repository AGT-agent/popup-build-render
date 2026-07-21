import { useEffect, useState } from 'react';
import type { PopupTrigger } from '@schema';

/**
 * Returns true once the trigger condition has fired. The mount layer uses this
 * to decide when to open the popup; the content renderer never sees it.
 */
export function useTrigger(trigger: PopupTrigger, enabled = true): boolean {
  const [fired, setFired] = useState(trigger.type === 'immediate');

  useEffect(() => {
    if (!enabled || fired) return;

    if (trigger.type === 'immediate') {
      setFired(true);
      return;
    }

    if (trigger.type === 'delay') {
      const t = setTimeout(() => setFired(true), Math.max(0, trigger.seconds) * 1000);
      return () => clearTimeout(t);
    }

    if (trigger.type === 'scroll') {
      const onScroll = () => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100;
        if (pct >= trigger.percent) setFired(true);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener('scroll', onScroll);
    }

    if (trigger.type === 'exitIntent') {
      const onLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) setFired(true);
      };
      document.addEventListener('mouseout', onLeave);
      return () => document.removeEventListener('mouseout', onLeave);
    }

    return undefined;
  }, [trigger, enabled, fired]);

  return fired;
}
