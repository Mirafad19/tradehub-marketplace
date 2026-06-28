import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const CHURCH_ADMIN_EMAIL = "fadahunsi.miracle@gmail.com";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: string[];
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  roles: [],
  isAdmin: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setLoading(true);
      setSession(s);
      if (s?.user) {
        // defer to avoid recursive supabase calls inside listener
        setTimeout(async () => {
          await loadRoles(s.user.id, s.user.email);
          setLoading(false);
        }, 0);
      } else {
        setRoles([]);
        setLoading(false);
      }
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) await loadRoles(data.session.user.id, data.session.user.email);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadRoles(userId: string, email?: string) {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const nextRoles = (data ?? []).map((r) => r.role as string);
    const currentEmail = email?.toLowerCase();
    if (currentEmail === CHURCH_ADMIN_EMAIL && !nextRoles.includes("admin")) {
      nextRoles.push("admin");
    }
    setRoles(nextRoles);
  }

  const value: AuthCtx = {
    user: session?.user ?? null,
    session,
    loading,
    roles,
    isAdmin: roles.includes("admin"),
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
