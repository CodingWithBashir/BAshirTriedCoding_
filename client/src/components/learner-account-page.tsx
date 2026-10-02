"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";
import { useLearnerAuth } from "@/components/learner-auth";
import styles from "./learner-account-page.module.css";

type Mode = "signin" | "signup";

export function LearnerAccountPage({ mode }: { mode: Mode }) {
  const isSignup = mode === "signup";
  const { user, loading, signIn, signUp } = useLearnerAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isSignup) await signUp(name, email, password);
      else await signIn(email, password);
      const requested = new URLSearchParams(window.location.search).get("next");
      const destination = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard";
      router.replace(destination);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not sign you in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <Link href="/courses" className={styles.back}><ArrowLeft size={14} /> Explore courses</Link>
      <section className={styles.card}>
        <div className={styles.art} aria-hidden="true">
          <span className={styles.artGlow} />
          <span className={styles.artMark}><BookOpen size={23} /></span>
          <span className={styles.artSpark}><Sparkles size={18} /></span>
          <div className={styles.artCopy}><span>YOUR NEXT CHAPTER</span><b>Small lessons.<br />Real progress.</b><small>Learn at your own pace, and keep every win.</small></div>
          <div className={styles.artFoot}><i /><i /><i /><span>Built for curious minds</span></div>
        </div>
        <div className={styles.formPanel}>
          <div className={styles.brand}><span><BookOpen size={15} /></span><b>CODING WITH BASHIR</b></div>
          <span className={styles.eyebrow}>{isSignup ? "START LEARNING" : "WELCOME BACK"}</span>
          <h1>{isSignup ? "Create your account" : "Sign in to learn"}</h1>
          <p className={styles.intro}>{isSignup ? "Your learning space is yours. Save course progress and earn certificates as you go." : "Pick up where you left off. Your courses and earned certificates are waiting."}</p>
          <form className={styles.form} onSubmit={handleSubmit}>
            {isSignup && <label className={styles.field}><span>Your name</span><div><UserRound size={16} /><input value={name} onChange={(event) => setName(event.target.value)} name="name" autoComplete="name" minLength={2} maxLength={80} placeholder="e.g. Alex Murenzi" required /></div></label>}
            <label className={styles.field}><span>Email address</span><div><Mail size={16} /><input value={email} onChange={(event) => setEmail(event.target.value)} name="email" type="email" autoComplete="email" maxLength={160} placeholder="you@example.com" required /></div></label>
            <label className={styles.field}><span>Password</span><div><LockKeyhole size={16} /><input value={password} onChange={(event) => setPassword(event.target.value)} name="password" type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} minLength={isSignup ? 12 : undefined} maxLength={256} placeholder={isSignup ? "At least 12 characters" : "Enter your password"} required /><button className={styles.reveal} type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>{isSignup && <small>Use 12 characters or more for a stronger password.</small>}</label>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <button className={styles.submit} type="submit" disabled={submitting || loading}>{submitting ? "One moment…" : isSignup ? "Create account" : "Sign in"}<ArrowRight size={15} /></button>
          </form>
          <p className={styles.switch}>{isSignup ? "Already have an account?" : "New to the learning space?"} <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link></p>
          <div className={styles.secure}><CheckCircle2 size={14} /><span>Your progress belongs to your account and stays private.</span></div>
        </div>
      </section>
      <p className={styles.terms}>By continuing, you agree to use this learning space respectfully.</p>
    </main>
  );
}
