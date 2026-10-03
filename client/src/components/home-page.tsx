"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Award, BookOpen, CheckCircle2, GraduationCap, LockKeyhole, Sparkles } from "lucide-react";
import { courses } from "@/lib/data";
import { usePortfolioCollection } from "@/lib/use-portfolio-collection";
import { useLearnerAuth } from "@/components/learner-auth";
import { CourseArtwork } from "@/components/visuals";

export function HomePage() {
  const { items: publishedCourses, ready } = usePortfolioCollection("courses", courses);
  const { user, progressByCourse, certificates } = useLearnerAuth();
  const featured = publishedCourses.slice(0, 3);
  const started = Object.values(progressByCourse).filter((item) => item.percent > 0).length;

  return (
    <main className="learning-home">
      <section className="learning-home__hero wrap">
        <div className="learning-home__hero-copy">
          <span className="learning-home__eyebrow"><Sparkles size={14} /> A LEARNING SPACE FOR CURIOUS MINDS</span>
          <h1>Learn by building.<br /><span>Grow at your pace.</span></h1>
          <p>Explore real, authored coding courses, work through lessons one step at a time, and keep your progress in your own learner account.</p>
          <div className="learning-home__actions">
            <Link href="/courses" className="button button--primary">Explore courses <ArrowRight size={15} /></Link>
            {user ? <Link href="/dashboard" className="button button--outline">Your learning space <ArrowUpRight size={14} /></Link> : <Link href="/signup" className="button button--outline">Create a free account <ArrowUpRight size={14} /></Link>}
          </div>
          <div className="learning-home__promise"><span><CheckCircle2 size={14} /> Progress saved privately</span><span><Award size={14} /> Certificates earned by completion</span></div>
        </div>
        <div className="learning-home__hero-art" aria-label="A learning path from first lesson to course completion">
          <div className="learning-home__orbit learning-home__orbit--one" /><div className="learning-home__orbit learning-home__orbit--two" />
          <div className="learning-home__hero-card"><span className="learning-home__hero-card-icon"><GraduationCap size={23} /></span><span className="learning-home__hero-card-kicker">YOUR NEXT STEP</span><b>One lesson at a time.</b><small>Learn · Practice · Complete</small><div className="learning-home__path"><i /><i /><i /><i /></div></div>
          <span className="learning-home__floating learning-home__floating--top"><BookOpen size={15} /> Authored lessons</span>
          <span className="learning-home__floating learning-home__floating--bottom"><LockKeyhole size={14} /> Your progress stays yours</span>
          <span className="learning-home__spark learning-home__spark--one">✳</span><span className="learning-home__spark learning-home__spark--two">✦</span>
        </div>
      </section>

      <section className="learning-home__proof wrap" aria-label="How learning works">
        <article><span><BookOpen size={17} /></span><div><b>Real course content</b><small>Lessons are authored before a course is published.</small></div></article>
        <article><span><LockKeyhole size={17} /></span><div><b>Your own account</b><small>Sign in to save progress privately across devices.</small></div></article>
        <article><span><Award size={17} /></span><div><b>Awarded on completion</b><small>Certificates reflect a finished learning path.</small></div></article>
      </section>

      <section className="learning-home__courses wrap">
        <div className="learning-home__section-head"><div><span className="learning-home__eyebrow">THE COURSE CATALOG</span><h2>Start with a real course.</h2><p>Only courses with authored lesson content are shown here.</p></div><Link href="/courses" className="learning-home__text-link">Browse all courses <ArrowRight size={14} /></Link></div>
        {featured.length ? <div className="learning-home__course-grid">{featured.map((course) => <article className="learning-home__course" key={course.slug}><CourseArtwork icon={course.icon} color={course.color} title={course.title} /><div className="learning-home__course-body"><span className="learning-home__course-meta">{course.level} <i>·</i> {course.lessons} lessons</span><h3>{course.title}</h3><p>{course.description}</p><Link href={`/learn/${course.slug}`}>View course <ArrowRight size={13} /></Link></div></article>)}</div> : <div className="learning-home__empty"><span><BookOpen size={19} /></span><div><b>{ready ? "No courses published yet" : "Checking published courses…"}</b><p>{ready ? "New courses will appear here once their lesson curriculum is ready. No placeholder courses are shown." : "Loading the learning catalog."}</p></div></div>}
      </section>

      <section className="learning-home__account wrap">
        <div className="learning-home__account-icon">{user ? <GraduationCap size={21} /> : <LockKeyhole size={20} />}</div>
        <div className="learning-home__account-copy"><span className="learning-home__eyebrow">YOUR LEARNING SPACE</span><h2>{user ? `Welcome back, ${user.name}.` : "Your learning, under your name."}</h2><p>{user ? `You have started ${started} ${started === 1 ? "course" : "courses"} and earned ${certificates.length} ${certificates.length === 1 ? "certificate" : "certificates"}.` : "Create an account or sign in to save your own progress, see completed lessons, and receive certificates you genuinely earn."}</p></div>
        <Link href={user ? "/dashboard" : "/signup"} className="button button--outline">{user ? "Open dashboard" : "Sign up to begin"} <ArrowRight size={14} /></Link>
      </section>
      <div className="learning-home__footer wrap"><span>CODING WITH BASHIR LEARNING</span><span>Learn with purpose. Build with confidence.</span><Link href="/certificates">How certificates work <ArrowUpRight size={13} /></Link></div>
    </main>
  );
}
