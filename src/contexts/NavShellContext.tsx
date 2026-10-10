import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface NavShellState {
  /** Account sidebar drawer — hidden until the menu button opens it. */
  railOpen: boolean;
  setRailOpen: (v: boolean) => void;
  toggleRail: () => void;
  /** Temporary nav drawer (used by logged-out visitors & mobile). */
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
}

const NavShellContext = createContext<NavShellState | null>(null);

export function NavShellProvider({ children }: { children: ReactNode }): JSX.Element {
  const [railOpen, setRailOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleRail = useCallback(() => setRailOpen((v) => !v), []);

  const value = useMemo(
    () => ({ railOpen, setRailOpen, toggleRail, drawerOpen, setDrawerOpen }),
    [railOpen, toggleRail, drawerOpen],
  );

  return <NavShellContext.Provider value={value}>{children}</NavShellContext.Provider>;
}

export function useNavShell(): NavShellState {
  const ctx = useContext(NavShellContext);
  if (!ctx) throw new Error('useNavShell must be used inside <NavShellProvider>');
  return ctx;
}