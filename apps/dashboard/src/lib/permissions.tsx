"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { adminFetch } from "@/lib/api";

/**
 * RBAC context (plan 62). Fetches GET /api/admin/auth/me once per mount —
 * the API returns { id, email, name, roles, permissions } since the RBAC
 * rollout. UX-only: the API PermissionsGuard is the real wall; hiding here
 * just keeps the dashboard honest about what a click would 403 on.
 */
export interface AdminIdentity {
  adminId: string | null;
  email: string | null;
  name: string | null;
  roles: string[];
  permissions: string[];
  loading: boolean;
  /** True while loading (optimistic) and for held permissions after load. */
  can: (permission: string) => boolean;
  refresh: () => Promise<void>;
}

const PermissionsContext = createContext<AdminIdentity>({
  adminId: null,
  email: null,
  name: null,
  roles: [],
  permissions: [],
  loading: true,
  can: () => false,
  refresh: async () => {},
});

interface MeResponse {
  id?: string;
  email?: string;
  name?: string;
  roles?: string[];
  permissions?: string[];
}

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = (await adminFetch("/auth/me")) as MeResponse;
      setMe(res);
    } catch {
      // Unauthenticated or API down — proxy.ts handles the login redirect;
      // treat as zero permissions.
      setMe(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AdminIdentity>(() => {
    const permissions = me?.permissions ?? [];
    const held = new Set(permissions);
    return {
      adminId: me?.id ?? null,
      email: me?.email ?? null,
      name: me?.name ?? null,
      roles: me?.roles ?? [],
      permissions,
      loading,
      can: (permission: string) => held.has(permission),
      refresh: load,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, loading]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): AdminIdentity {
  return useContext(PermissionsContext);
}
