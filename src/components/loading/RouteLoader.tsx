import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

/** How long the loading screen stays up on every page transition / login. */
const TRANSITION_MS = 2_000;

/** Routes that must render immediately — a full-screen loader here is just friction. */
const NO_LOADING_PATHS = ['/settings', '/pay'];

export default function RouteLoader({ children }: { children: React.ReactNode }): JSX.Element {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [visible, setVisible] = useState(false);
  const prevPath = useRef(location.pathname);
  const prevAuth = useRef(Boolean(isAuthenticated));
  const seenNav = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const pathChanged = location.pathname !== prevPath.current;
    const authChanged = Boolean(isAuthenticated) !== prevAuth.current;
    prevPath.current = location.pathname;
    prevAuth.current = Boolean(isAuthenticated);

    if (!pathChanged && !authChanged) return;
    if (pathChanged) {
      seenNav.current = true;
      window.scrollTo(0, 0);
    }
    if (authChanged && !seenNav.current) return;
    if (NO_LOADING_PATHS.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`))) return;

    if (timer.current !== undefined) window.clearTimeout(timer.current);
    setVisible(true);
    timer.current = window.setTimeout(() => setVisible(false), TRANSITION_MS);
  }, [location.pathname, isAuthenticated]);

  useEffect(
    () => () => {
      if (timer.current !== undefined) window.clearTimeout(timer.current);
    },
    [],
  );

  return (
    <>
      {children}
      <AnimatePresence>{visible ? <LoadingScreen key="route-loader" /> : null}</AnimatePresence>
    </>
  );
}