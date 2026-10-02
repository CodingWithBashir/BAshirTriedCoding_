"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./learner-auth.module.css";

export type LearnerUser = { id: string; name: string; email: string; active?: boolean; lastLoginAt?: string | null };
export type CourseProgress = {
  id?: string;
  courseSlug: string;
  courseTitle: string;
  lessonCount: number;
  completedLessonIndexes: number[];
  completedAt: string | null;
  certificateId?: string | null;
  percent: number;
};
export type EarnedCertificate = {
  id: string;
  courseSlug: string;
  courseTitle: string;
  lessonCount: number;
  recipientName: string;
  certificateNumber: string;
  issuedAt: string;
};

type AuthContextValue = {
  user: LearnerUser | null;
  loading: boolean;
  error: string;
  progressByCourse: Record<string, CourseProgress>;
  certificates: EarnedCertificate[];
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeLesson: (courseSlug: string, lessonIndex: number) => Promise<{ progress: CourseProgress; certificate: EarnedCertificate | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("accept", "application/json");
  if (options.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(`/api${path}`, { ...options, credentials: "same-origin", cache: "no-store", headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "The learning service could not complete that request.");
  return payload as T;
}

function normalizeProgress(value: Omit<CourseProgress, "percent"> | CourseProgress): CourseProgress {
  const completedLessonIndexes = Array.isArray(value.completedLessonIndexes) ? value.completedLessonIndexes : [];
  const lessonCount = Math.max(1, Number(value.lessonCount) || 1);
  return { ...value, lessonCount, completedLessonIndexes, percent: Math.min(100, Math.round(completedLessonIndexes.length / lessonCount * 100)) };
}

export function LearnerProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LearnerUser | null>(null);
  const [progressItems, setProgressItems] = useState<CourseProgress[]>([]);
  const [certificates, setCertificates] = useState<EarnedCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const session = await request<{ authenticated: boolean; user: LearnerUser | null }>("/auth/session");
      setUser(session.authenticated ? session.user : null);
      if (!session.authenticated || !session.user) {
        setProgressItems([]);
        setCertificates([]);
        return;
      }
      const [progressResponse, certificateResponse] = await Promise.all([
        request<{ items: Array<Omit<CourseProgress, "percent">> }>("/learner/progress"),
        request<{ items: EarnedCertificate[] }>("/learner/certificates"),
      ]);
      setProgressItems(progressResponse.items.map(normalizeProgress));
      setCertificates(certificateResponse.items);
    } catch (caught) {
      setUser(null);
      setProgressItems([]);
      setCertificates([]);
      setError(caught instanceof Error ? caught.message : "Could not check your learning account.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const progressByCourse = useMemo(() => Object.fromEntries(progressItems.map((item) => [item.courseSlug, item])), [progressItems]);

  const signIn = useCallback(async (email: string, password: string) => {
    await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    await refresh();
  }, [refresh]);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    await request("/auth/signup", { method: "POST", body: JSON.stringify({ name, email, password }) });
    await refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    try { await request("/auth/logout", { method: "POST" }); } finally {
      setUser(null);
      setProgressItems([]);
      setCertificates([]);
      setError("");
    }
  }, []);

  const completeLesson = useCallback(async (courseSlug: string, lessonIndex: number) => {
    const result = await request<{ progress: Omit<CourseProgress, "percent">; certificate: EarnedCertificate | null }>(
      `/learner/courses/${encodeURIComponent(courseSlug)}/lessons/${lessonIndex}/complete`,
      { method: "POST" },
    );
    const progress = normalizeProgress(result.progress);
    setProgressItems((current) => [progress, ...current.filter((item) => item.courseSlug !== progress.courseSlug)]);
    if (result.certificate) {
      setCertificates((current) => [result.certificate!, ...current.filter((item) => item.id !== result.certificate!.id)]);
    }
    return { progress, certificate: result.certificate };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ user, loading, error, progressByCourse, certificates, refresh, signIn, signUp, signOut, completeLesson }), [user, loading, error, progressByCourse, certificates, refresh, signIn, signUp, signOut, completeLesson]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useLearnerAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useLearnerAuth must be used inside LearnerProvider.");
  return value;
}

export function RequireLearner({ children }: { children: ReactNode }) {
  const { user, loading } = useLearnerAuth();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
  }, [loading, user, pathname, router]);
  if (loading || !user) return <main className={styles.checking}><span className={styles.checkingSpinner} /><b>Opening your learning space</b><small>Checking your account…</small></main>;
  return children;
}
