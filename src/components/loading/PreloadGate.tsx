import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import LoadingScreen from './LoadingScreen';
import { propertiesApi, geoApi } from '../../lib/api';

const HERO_VIDEO_URL = '/assets/videos/vid.mp4';
const HERO_POSTER_URL =
  'https://images.unsplash.com/photo-1757356657991-c3fd6e2e812e?w=2400&q=80&auto=format&fit=crop';

/* Keep the loading screen on screen for at least this long. */
const MIN_DISPLAY_MS = 2_000;
/* Absolute safety cap so a hung preload never blocks entry into the app. */
const MAX_WAIT_MS = 15_000;

const PRELOAD_TASKS: Array<{ key: string; run: () => Promise<unknown> }> = [
  {
    key: 'video',
    run: () =>
      fetch(HERO_VIDEO_URL).then((res) => {
        if (!res.ok) throw new Error('video preload failed');
      }),
  },
  {
    key: 'poster',
    run: () =>
      new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('poster preload failed'));
        img.src = HERO_POSTER_URL;
      }),
  },
  { key: 'featured', run: () => propertiesApi.getFeatured(12) },
  { key: 'locations', run: () => propertiesApi.getPopularLocations(12) },
  { key: 'rates', run: () => geoApi.getExchangeRates() },
];

interface PreloadGateProps {
  children: React.ReactNode;
}

export default function PreloadGate({ children }: PreloadGateProps): JSX.Element {
  const [done, setDone] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let finished = false;
    let completed = 0;
    const startedAt = Date.now();
    let revealTimer: number | undefined;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (revealTimer !== undefined) window.clearTimeout(revealTimer);
      if (!cancelled) setReady(true);
    };

    const scheduleFinish = () => {
      if (finished) return;
      const remaining = MIN_DISPLAY_MS - (Date.now() - startedAt);
      if (remaining <= 0) finish();
      else revealTimer = window.setTimeout(finish, remaining);
    };

    const bump = () => {
      completed += 1;
      if (!cancelled) setDone(completed);
      if (completed >= PRELOAD_TASKS.length) scheduleFinish();
    };

    const capTimer = window.setTimeout(() => {
      if (!cancelled) setDone(PRELOAD_TASKS.length);
      finish();
    }, MAX_WAIT_MS);

    Promise.allSettled(
      PRELOAD_TASKS.map(({ run }) =>
        Promise.resolve()
          .then(run)
          .then(bump, bump),
      ),
    );

    return () => {
      cancelled = true;
      window.clearTimeout(capTimer);
      if (revealTimer !== undefined) window.clearTimeout(revealTimer);
    };
  }, []);

  const total = PRELOAD_TASKS.length;
  const percent = Math.min(100, Math.round((done / total) * 100));

  return (
    <>
      {children}
      <AnimatePresence>
        {!ready ? <LoadingScreen key="preload" progress={percent} /> : null}
      </AnimatePresence>
    </>
  );
}