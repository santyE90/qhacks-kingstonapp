"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  effectiveRole: Profile["role"] | null;
  viewAsCitizen: boolean;
  setViewAsCitizen: (value: boolean) => void;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("id", userId)
    .single();

  if (error) {
    return null;
  }

  return data as Profile;
}

async function ensureProfile(user: User) {
  const existing = await fetchProfile(user.id);
  if (existing) return existing;

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email ||
    "Resident";

  const { data } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      full_name: fullName,
      role: "citizen",
    })
    .select("id, full_name, role, created_at")
    .single();

  return (data as Profile) || null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [viewAsCitizen, setViewAsCitizenState] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    const data = await ensureProfile(session.user);
    if (data) setProfile(data);
  }, [session]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) {
        ensureProfile(data.session.user).then((profileData) => {
          if (isMounted) setProfile(profileData);
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession?.user) {
        setProfile(null);
        return;
      }
      ensureProfile(newSession.user).then((profileData) => {
        if (isMounted) setProfile(profileData);
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("cityfix:viewAsCitizen") : null;
    if (stored === "true") {
      setViewAsCitizenState(true);
    }
  }, []);

  const setViewAsCitizen = useCallback((value: boolean) => {
    setViewAsCitizenState(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("cityfix:viewAsCitizen", value ? "true" : "false");
    }
  }, []);

  const effectiveRole =
    profile?.role === "admin" && viewAsCitizen ? "citizen" : profile?.role ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      effectiveRole,
      viewAsCitizen,
      setViewAsCitizen,
      loading,
      refreshProfile,
      signOut,
    }),
    [
      session,
      profile,
      effectiveRole,
      viewAsCitizen,
      setViewAsCitizen,
      loading,
      refreshProfile,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
