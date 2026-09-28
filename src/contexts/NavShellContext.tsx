import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface NavShellState {
  /** Sidebar collapsed to an icon-only rail (default true = collapsed). */
  railCollapsed: boolean;
  setRailCollapsed: (v: boolean) => void;
  toggleRail: () => void;
  /** Temporary nav drawer (used by logged-out visitors & mobile). */
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
}

const NavShellContext = createContext<NavShellState | null>(null);

export function NavShellProvider({ children }: { children: ReactNode }): JSX.Element {
  const [railCollapsed, setRailCollapsed] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleRail = useCallback(() => setRailCollapsed((v) => !v), []);

  const value = useMemo(
    () => ({ railCollapsed, setRailCollapsed, toggleRail, drawerOpen, setDrawerOpen }),
    [railCollapsed, toggleRail, drawerOpen],
  );

  return <NavShellContext.Provider value={value}>{children}</NavShellContext.Provider>;
}

export function useNavShell(): NavShellState {
  const ctx = useContext(NavShellContext);
  if (!ctx) throw new Error('useNavShell must be used inside <NavShellProvider>');
  return ctx;
}