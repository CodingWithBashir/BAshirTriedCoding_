"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Activity, ArrowLeft, ArrowRight, ArrowUpRight, Award, BadgeCheck, Bell, BookOpen,
  Bot, BrainCircuit, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, Clock3, Code2, FileText, Flame, GraduationCap, History, Lightbulb,
  LoaderCircle, LockKeyhole, LogOut, MessageCircle, MoreHorizontal, Play, Plus,
  Search, Send, Settings, Share2, Sparkles, Target, Upload, UserRound, Users, X,
} from "lucide-react";
import { courses } from "@/lib/data";
import { buildCourseLessons } from "@/lib/course-lessons";
import { usePortfolioCollection } from "@/lib/use-portfolio-collection";
import { useLearnerAuth, type CourseProgress, type EarnedCertificate } from "@/components/learner-auth";
import { ButtonLink, Eyebrow, Icon, ProgressBar } from "@/components/ui";
import { CourseArtwork } from "@/components/visuals";

const workspaceLinks = [
  { label: "Dashboard", href: "/dashboard", icon: "PanelsTopLeft" },
  { label: "My courses", href: "/courses", icon: "BookOpen" },
  { label: "Certificates", href: "/certificates", icon: "Award" },
  { label: "My profile", href: "/profile", icon: "UserRound" },
];

function initials(name: string) {
  return name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "L";
}

function timeAgo(value?: string | Date | null) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}

function initialsAvatar(name: string, className: string, profileImage?: string | null) {
  return <span className={className} aria-hidden="true">{profileImage ? <img src={profileImage} alt="" /> : initials(name)}</span>;
}

async function makeProfilePhoto(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file for your profile photo.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Choose an image smaller than 8 MB.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This image format could not be opened. Try a JPEG or PNG photo.");
  }
  if (!bitmap.width || !bitmap.height || bitmap.width > 8192 || bitmap.height > 8192) {
    bitmap.close();
    throw new Error("Choose an image with dimensions under 8,192 pixels.");
  }
  const canvas = document.createElement("canvas");
  const size = 320;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("This browser could not prepare the profile photo.");
  }
  const crop = Math.min(bitmap.width, bitmap.height);
  context.drawImage(bitmap, (bitmap.width - crop) / 2, (bitmap.height - crop) / 2, crop, crop, 0, 0, size, size);
  bitmap.close();
  let image = canvas.toDataURL("image/jpeg", 0.78);
  if (image.length > 290_000) image = canvas.toDataURL("image/jpeg", 0.58);
  if (image.length > 290_000) throw new Error("This photo is too detailed to save. Try a smaller image.");
  return image;
}

export function WorkspaceSidebar({ active = "Dashboard" }: { active?: string }) {
  const { user, signOut } = useLearnerAuth();
  const name = user?.name ?? "Learner";
  return <aside className="workspace-sidebar"><Link href="/profile" className="workspace-user">{initialsAvatar(name, "workspace-user__avatar", user?.profileImage)}<span><b>{name}</b><small>{user?.email ?? "Learning account"}</small><i><span /> Learner account</i></span><ChevronDown size={13} /></Link><span className="workspace-label">YOUR SPACE</span><nav>{workspaceLinks.map((item) => <Link key={item.label} className={active === item.label ? "is-active" : ""} href={item.href}><Icon name={item.icon} size={15} />{item.label}{item.label === "AI assistant" && <span className="workspace-new">NEW</span>}</Link>)}</nav><div className="workspace-sidebar__bottom"><div className="sidebar-quote"><span>“</span><p>Small steps still move you forward.</p><small>KEEP BUILDING</small></div><Link href="/courses"><CircleHelp size={14} /> Course catalog</Link><Link href="/profile"><Settings size={14} /> Account settings</Link><button className="workspace-signout" onClick={() => { void signOut().catch(() => undefined); }}><LogOut size={14} /> Sign out</button><div className="workspace-side-brand"><span className="logo-mark logo-mark--small"><span>CW</span><i>β</i></span><span><b>Coding With Bashir</b><small>Learn · Practice · Grow</small></span></div></div></aside>;
}

export function DashboardPage() {
  const [notice, setNotice] = useState(true);
  const [today, setToday] = useState("");
  const { user, progressByCourse, certificates } = useLearnerAuth();
  const { items: dashboardCourses } = usePortfolioCollection("courses", courses);
  const progressItems = Object.values(progressByCourse);
  const activeProgress = progressItems.filter((item) => item.percent > 0 && item.percent < 100);
  const completedLessons = progressItems.reduce((total, item) => total + item.completedLessonIndexes.length, 0);
  const inProgressCourses = dashboardCourses.filter((course) => (progressByCourse[course.slug]?.percent ?? 0) > 0 && (progressByCourse[course.slug]?.percent ?? 0) < 100);
  const recent = useMemo(() => {
    const courseEvents = progressItems.map((item) => ({
      key: item.courseSlug,
      title: item.percent === 100 ? `Completed ${item.courseTitle}` : `Studied ${item.courseTitle}`,
      detail: `${item.completedLessonIndexes.length} of ${item.lessonCount} lessons completed`,
      at: item.completedAt ?? (item as CourseProgress & { updatedAt?: string }).updatedAt,
      color: item.percent === 100 ? "green" : "cyan",
      icon: item.percent === 100 ? "Award" : "BookOpen",
    }));
    const certificateEvents = certificates.map((item) => ({ key: item.id, title: `Earned ${item.courseTitle}`, detail: item.certificateNumber, at: item.issuedAt, color: "violet", icon: "Award" }));
    return [...courseEvents, ...certificateEvents].sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime()).slice(0, 4);
  }, [progressItems, certificates]);

  useEffect(() => { setToday(new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(new Date())); }, []);
  return (
    <main className="route-page wrap dashboard-route"><div className="dashboard-frame"><WorkspaceSidebar /><div className="dashboard-main">
      <div className="dashboard-topline"><span><span className="status-live" /> YOUR LEARNING SPACE</span><div><span className="dashboard-date">{today}</span></div></div>
      <section className="dashboard-welcome"><div><Eyebrow icon="Sparkles">WELCOME TO YOUR SPACE</Eyebrow><h1>Welcome, {user?.name.split(/\s+/)[0] ?? "learner"} <span className="wave-hand">✳</span></h1><p>Your learning progress and certificates, all in one place.</p></div><div className="dashboard-welcome__actions"><label className="search-field dashboard-search"><Search size={13} /><input placeholder="Search your space…" aria-label="Search your learning space" /></label><Link className="icon-button" href="/courses" aria-label="Browse courses"><Plus size={16} /></Link></div></section>
      <section className="dash-metric-grid"><Metric icon="BookOpen" label="Courses in progress" value={String(activeProgress.length)} note="Pick up where you left off" color="violet" /><Metric icon="CheckCircle2" label="Lessons completed" value={String(completedLessons)} note="Every step counts" color="green" /><Metric icon="Award" label="Earned certificates" value={String(certificates.length)} note="Your real achievements" color="pink" /><Metric icon="GraduationCap" label="Learning paths" value={String(dashboardCourses.length)} note="Explore at your own pace" color="cyan" /></section>
      {notice && <div className="dashboard-streak"><span><Flame size={18} /></span><p><b>A little learning goes a long way.</b><small>Choose a lesson, make progress, and come back whenever you’re ready.</small></p><Link href="/courses">Browse courses <ArrowRight size={13} /></Link><button onClick={() => setNotice(false)} aria-label="Dismiss learning reminder"><X size={14} /></button></div>}
      <div className="dashboard-content-grid"><section className="dash-panel continue-panel"><div className="dash-panel__head"><span><h2>Continue learning</h2><p>Your saved course progress.</p></span><Link href="/courses">All courses <ArrowUpRight size={13} /></Link></div>{inProgressCourses.slice(0, 3).map((course) => { const progress = progressByCourse[course.slug]; return <Link href={`/learn/${course.slug}`} className="continue-course" key={course.slug}><CourseArtwork icon={course.icon} color={course.color} title={course.title} /><span className="continue-course__info"><span className="course-category-label">{course.category} <i>·</i> {course.level}</span><b>{course.title}</b><small>{progress.percent}% complete <span>·</span> {progress.lessonCount} lessons</small><ProgressBar value={progress.percent} /></span><span className="continue-course__play"><Play size={14} fill="currentColor" /></span></Link>; })}{!inProgressCourses.length && <div className="dashboard-empty"><BookOpen size={19} /><b>No course in progress yet</b><p>Choose a learning path and your progress will appear here.</p><ButtonLink href="/courses" variant="outline" icon="ArrowRight">Explore courses</ButtonLink></div>}</section>
        <section className="dash-panel activity-panel"><div className="dash-panel__head"><span><h2>Recent learning</h2><p>Updates from your account.</p></span><History size={16} /></div>{recent.length ? <div className="activity-list">{recent.map((activity) => <div className="activity-row" key={activity.key}><span className={`activity-icon activity-icon--${activity.color}`}><Icon name={activity.icon} size={13} /></span><span><b>{activity.title}</b><small>{activity.detail} · {timeAgo(activity.at)}</small></span><Check size={12} className="activity-check" /></div>)}</div> : <div className="activity-empty"><span><Activity size={18} /></span><p>Your course activity will appear here after your first lesson.</p></div>}<Link className="activity-all" href="/profile">View your account <ArrowRight size={12} /></Link></section></div>
      <section className="dashboard-skills"><div><div className="dash-panel__head"><span><h2>Make space for curiosity</h2><p>Start with a topic that feels useful today.</p></span><Sparkles size={15} /></div><div className="dashboard-skill-pills"><span className="dashboard-skill-pill dashboard-skill-pill--0"><Check size={10} /> Learn by doing</span><span className="dashboard-skill-pill dashboard-skill-pill--1"><Check size={10} /> Ask questions</span><span className="dashboard-skill-pill dashboard-skill-pill--2"><Check size={10} /> Build small things</span></div></div><div className="dashboard-skills__progress"><span>YOUR NEXT STEP</span><b>{activeProgress.length ? "Keep your momentum" : "Choose your first course"}</b><ProgressBar value={activeProgress.length ? Math.max(...activeProgress.map((item) => item.percent)) : 0} /><small>{activeProgress.length ? `${activeProgress.length} course${activeProgress.length === 1 ? "" : "s"} underway` : "A fresh start is a good start."}</small><Link href={activeProgress.length ? `/learn/${inProgressCourses[0]?.slug ?? dashboardCourses[0]?.slug}` : "/courses"}>{activeProgress.length ? "Continue learning" : "Explore courses"} <ArrowRight size={12} /></Link></div></section>
      <div className="dashboard-bottom"><span><span className="status-live" /> Your learning space is up to date.</span><Link href="/courses"><BookOpen size={13} /> Explore the course catalog <ArrowUpRight size={12} /></Link></div>
    </div></div></main>
  );
}

function Metric({ icon, label, value, note, color }: { icon: string; label: string; value: string; note: string; color: string }) {
  return <article className="dash-metric"><span className={`dash-metric__icon dash-metric__icon--${color}`}><Icon name={icon} size={17} /></span><span className="dash-metric__label">{label}</span><b>{value}</b><small>{note}</small><i className="dash-metric__spark" /></article>;
}

export function ProfilePage() {
  const { user, progressByCourse, certificates, signOut, updateProfileImage } = useLearnerAuth();
  const tabs = ["Overview", "Certificates", "Activity"];
  const [activeTab, setActiveTab] = useState("Overview");
  const photoInput = useRef<HTMLInputElement>(null);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoError, setPhotoError] = useState("");

  async function saveProfilePhoto(file: File) {
    setPhotoSaving(true);
    setPhotoError("");
    try {
      await updateProfileImage(await makeProfilePhoto(file));
    } catch (caught) {
      setPhotoError(caught instanceof Error ? caught.message : "Could not save your profile photo.");
    } finally {
      setPhotoSaving(false);
      if (photoInput.current) photoInput.current.value = "";
    }
  }

  async function removeProfilePhoto() {
    setPhotoSaving(true);
    setPhotoError("");
    try {
      await updateProfileImage(null);
    } catch (caught) {
      setPhotoError(caught instanceof Error ? caught.message : "Could not remove your profile photo.");
    } finally {
      setPhotoSaving(false);
    }
  }
  const progress = Object.values(progressByCourse);
  const doneLessons = progress.reduce((count, item) => count + item.completedLessonIndexes.length, 0);
  const recentItems = progress.map((item) => ({ key: item.courseSlug, title: item.percent === 100 ? `Completed ${item.courseTitle}` : `Progress in ${item.courseTitle}`, detail: `${item.completedLessonIndexes.length} of ${item.lessonCount} lessons`, at: item.completedAt ?? (item as CourseProgress & { updatedAt?: string }).updatedAt }));
  const accountDate = user && "createdAt" in user && typeof user.createdAt === "string" ? new Date(user.createdAt) : null;
  return (
    <main className="route-page wrap dashboard-route"><div className="dashboard-frame"><WorkspaceSidebar active="My profile" /><div className="profile-main"><div className="profile-banner"><div className="profile-banner__mesh" /><div className="profile-banner__avatar profile-learner-avatar">{user?.profileImage ? <img src={user.profileImage} alt={`${user.name}'s profile photo`} /> : initials(user?.name ?? "Learner")}</div><div className="profile-banner__info"><span className="availability-pill"><i /> Learner account</span><h1>{user?.name ?? "Learner"}</h1><p><span>{user?.email}</span> <i>·</i> Learning at your own pace</p><div className="profile-social-row"><span><LockKeyhole size={13} /> Private account</span><input ref={photoInput} className="profile-photo-input" type="file" accept="image/*" aria-label="Choose a profile photo" disabled={photoSaving} onChange={(event: ChangeEvent<HTMLInputElement>) => { const file = event.currentTarget.files?.[0]; if (file) void saveProfilePhoto(file); }} /><button type="button" className="profile-photo-button" disabled={photoSaving} onClick={() => photoInput.current?.click()}>{photoSaving ? <LoaderCircle size={12} className="spin-icon" /> : <Upload size={12} />}{photoSaving ? "Saving…" : user?.profileImage ? "Change photo" : "Add photo"}</button>{user?.profileImage && <button type="button" className="profile-photo-button profile-photo-button--remove" disabled={photoSaving} onClick={() => void removeProfilePhoto()}>Remove</button>}</div>{photoError && <p className="profile-photo-error" role="alert">{photoError}</p>}</div><button className="button button--outline profile-edit-button" onClick={() => { void signOut().catch(() => undefined); }}><LogOut size={13} /> Sign out</button><div className="profile-stats"><div><b>{progress.length}</b><small>Courses started</small></div><div><b>{doneLessons}</b><small>Lessons done</small></div><div><b>{certificates.length}</b><small>Certificates</small></div><div><b>{accountDate && !Number.isNaN(accountDate.getTime()) ? accountDate.toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—"}</b><small>Learning since</small></div></div></div>
      <nav className="profile-tabs" aria-label="Account sections">{tabs.map((tab) => <button className={activeTab === tab ? "is-active" : ""} key={tab} onClick={() => setActiveTab(tab)}>{tab}{activeTab === tab && <i />}</button>)}</nav>
      <div className="profile-content"><section className="profile-about-card"><div className="dash-panel__head"><span><h2>{activeTab === "Certificates" ? "Certificates you have earned" : activeTab === "Activity" ? "Your learning activity" : "Your learning profile"}</h2><p>{activeTab === "Overview" ? "A private account for your learning journey." : "Only achievements earned by your account appear here."}</p></span><Sparkles size={15} /></div>
        {activeTab === "Overview" && <><p className="profile-about-lead">Welcome, {user?.name}. This is your personal space for keeping track of lessons, course milestones, and certificates you have genuinely earned.</p><div className="profile-details"><div><UserRound size={14} /><span><small>ACCOUNT NAME</small><b>{user?.name}</b></span></div><div><FileText size={14} /><span><small>EMAIL ADDRESS</small><b>{user?.email}</b></span></div><div><GraduationCap size={14} /><span><small>COURSES STARTED</small><b>{progress.length}</b></span></div><div><Target size={14} /><span><small>LESSONS COMPLETED</small><b>{doneLessons}</b></span></div></div><div className="profile-now"><span className="profile-now__dot" /><span><small>KEEP GOING</small><b>Your course progress is saved to this account.</b></span><BookOpen size={14} /></div></>}
        {activeTab === "Certificates" && (certificates.length ? <div className="profile-certificate-list">{certificates.map((item) => <div key={item.id}><span className="profile-cert-seal profile-cert-seal--violet"><Award size={16} /></span><span><b>{item.courseTitle}</b><small>{new Date(item.issuedAt).toLocaleDateString()} <i>·</i> {item.certificateNumber}</small></span><Link href={`/certificates/${encodeURIComponent(item.id)}`}>View <ArrowUpRight size={12} /></Link></div>)}</div> : <EmptyLearningState text="Earn your first certificate by completing every lesson in a course." href="/courses" action="Explore courses" />)}
        {activeTab === "Activity" && (recentItems.length ? <div className="activity-list profile-activity-list">{recentItems.sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime()).map((item) => <div className="activity-row" key={item.key}><span className="activity-icon activity-icon--cyan"><BookOpen size={13} /></span><span><b>{item.title}</b><small>{item.detail} · {timeAgo(item.at)}</small></span><ArrowUpRight size={12} /></div>)}</div> : <EmptyLearningState text="When you complete a lesson, your real learning activity will show up here." href="/courses" action="Choose a course" />)}
      </section></div>
    </div></div></main>
  );
}

function EmptyLearningState({ text, href, action }: { text: string; href: string; action: string }) {
  return <div className="dashboard-empty"><BookOpen size={19} /><p>{text}</p><ButtonLink href={href} variant="outline" icon="ArrowRight">{action}</ButtonLink></div>;
}

export function LearningPage() {
  const params = useParams<{ slug: string }>();
  const { items: liveCourses } = usePortfolioCollection("courses", courses);
  const course = liveCourses.find((item) => item.slug === params.slug);
  const { progressByCourse, completeLesson } = useLearnerAuth();
  const lessons = useMemo(() => course ? buildCourseLessons(course) : [], [course]);
  const progress = course ? progressByCourse[course.slug] : undefined;
  const firstIncomplete = lessons.findIndex((_lesson, index) => !progress?.completedLessonIndexes.includes(index));
  const firstOpen = firstIncomplete < 0 ? Math.max(0, lessons.length - 1) : firstIncomplete;
  const [lessonIndex, setLessonIndex] = useState(firstOpen);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [certificate, setCertificate] = useState<EarnedCertificate | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  useEffect(() => { setLessonIndex(firstOpen); setCertificate(null); setError(""); }, [params.slug, firstOpen]);

  if (!course) return <main className="route-page wrap detail-not-found"><span className="detail-not-found__icon"><BookOpen size={21} /></span><Eyebrow>COURSE NOT FOUND</Eyebrow><h1>This course is not available.</h1><p>Only published courses with authored lesson content can be opened.</p><ButtonLink href="/courses" icon="ArrowLeft" variant="outline">Browse courses</ButtonLink></main>;
  if (!lessons.length) return <main className="route-page wrap detail-not-found"><span className="detail-not-found__icon"><BookOpen size={21} /></span><Eyebrow>LESSONS NOT PUBLISHED</Eyebrow><h1>This course is not ready to start.</h1><p>The course author must add the complete lesson curriculum before learners can begin.</p><ButtonLink href="/courses" icon="ArrowLeft" variant="outline">Browse courses</ButtonLink></main>;

  const currentLesson = lessons[lessonIndex];
  const completedIndexes = new Set(progress?.completedLessonIndexes ?? []);
  const completedCount = completedIndexes.size;
  const percentage = Math.min(100, Math.round(completedCount / lessons.length * 100));
  const isLessonComplete = completedIndexes.has(lessonIndex);
  const paragraphs = currentLesson.content.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);

  async function markLessonComplete() {
    if (!course || submitting || isLessonComplete) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await completeLesson(course.slug, lessonIndex);
      if (result.certificate) setCertificate(result.certificate);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save your lesson progress.");
    } finally {
      setSubmitting(false);
    }
  }

  function selectLesson(index: number) { setLessonIndex(index); setError(""); }

  return (
    <main className="route-page wrap learning-route learning-route--authored">
      <div className="learning-topline"><Link href="/courses"><ArrowLeft size={13} /> All courses</Link><span>/</span><span>{course.title}</span><span className="learning-topline__progress"><span>{percentage}% complete</span><ProgressBar value={percentage} /></span></div>
      <div className={`learning-layout${sidebarOpen ? "" : " learning-layout--compact"}`}>
        <aside className="lesson-sidebar"><div className="lesson-sidebar__head"><div><span className={`course-small-icon course-small-icon--${course.color}`}><Icon name={course.icon} size={16} /></span><span><b>{course.title}</b><small>COURSE CONTENT</small></span></div><button onClick={() => setSidebarOpen(false)} aria-label="Collapse lessons"><ChevronLeft size={16} /></button></div>
          <div className="lesson-progress"><span>YOUR PROGRESS</span><b>{percentage}%</b><ProgressBar value={percentage} /><small>{completedCount} of {lessons.length} lessons complete</small></div>
          <div className="lesson-list__label">AUTHORED LESSONS <span>{lessons.length}</span></div>
          <div className="lesson-list">{lessons.map((lesson, index) => <button className={`lesson-item${lessonIndex === index ? " is-active" : ""}${completedIndexes.has(index) ? " is-done" : ""}`} key={`${index}-${lesson.title}`} onClick={() => selectLesson(index)}><span className="lesson-item__status">{completedIndexes.has(index) ? <Check size={12} /> : <span>{String(index + 1).padStart(2, "0")}</span>}</span><span><b>{lesson.title}</b><small>Authored lesson</small></span></button>)}</div>
          <div className="lesson-sidebar__foot"><span><LockKeyhole size={12} /> SAVED TO YOUR ACCOUNT</span><Link href="/dashboard">Dashboard <ArrowUpRight size={12} /></Link></div>
        </aside>
        <section className="learning-content learning-content--authored">
          {!sidebarOpen && <button className="lesson-reopen" onClick={() => setSidebarOpen(true)}><ChevronRight size={14} /> Course content</button>}
          <div className="lesson-breadcrumb"><span>{course.title}</span><span>/</span><b>{String(lessonIndex + 1).padStart(2, "0")} · {currentLesson.title}</b></div>
          <article className="authored-lesson"><div className="authored-lesson__top"><span>LESSON {String(lessonIndex + 1).padStart(2, "0")} OF {String(lessons.length).padStart(2, "0")}</span>{isLessonComplete && <span className="authored-lesson__complete"><CheckCircle2 size={13} /> COMPLETED</span>}</div><h1>{currentLesson.title}</h1><p className="authored-lesson__course">{course.title}</p><div className="authored-lesson__rule" /><div className="authored-lesson__copy">{paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 25)}`}>{paragraph}</p>)}</div><div className="authored-lesson__note"><BookOpen size={15} /><span><b>Course author’s lesson</b><small>This lesson is part of the published curriculum for {course.title}.</small></span></div></article>
          {certificate && <div className="lesson-earned" role="status"><span><Award size={18} /></span><p><b>Course completed. Your certificate is ready.</b><small>{certificate.certificateNumber}</small></p><Link href={`/certificates/${encodeURIComponent(certificate.id)}`}>View certificate <ArrowRight size={13} /></Link></div>}
          {percentage === 100 && !certificate && <div className="lesson-earned" role="status"><span><BadgeCheck size={18} /></span><p><b>Course complete — certificate earned.</b><small>View the certificate awarded to your account.</small></p><Link href="/certificates">My certificates <ArrowRight size={13} /></Link></div>}
          {error && <p className="lesson-error" role="alert">{error}</p>}
          <div className="authored-lesson__navigation"><button disabled={lessonIndex === 0} onClick={() => selectLesson(Math.max(0, lessonIndex - 1))}><ArrowLeft size={14} /> Previous lesson</button><button className="lesson-complete-button" onClick={() => void markLessonComplete()} disabled={isLessonComplete || submitting}>{submitting ? <><LoaderCircle size={14} className="spin-icon" /> Saving…</> : isLessonComplete ? <><CheckCircle2 size={14} /> Lesson complete</> : <>Mark lesson complete <Check size={14} /></>}</button><button disabled={lessonIndex >= lessons.length - 1} onClick={() => selectLesson(Math.min(lessons.length - 1, lessonIndex + 1))}>Next lesson <ArrowRight size={14} /></button></div>
        </section>
      </div>
    </main>
  );
}

export function AssistantPage() {
  const { user } = useLearnerAuth();
  const name = user?.name.split(/\s+/)[0] ?? "learner";
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const suggestions = ["Explain React in simple terms", "How do APIs work?", "Help me start a project"];
  const messages = [{ role: "assistant" as const, text: `Hey ${name}! What are you working on today? Ask me about a concept, a bug, or an idea you want to explore. We can work through it one small step at a time.` }, ...history];

  function ask(question: string) {
    const prompt = question.trim(); if (!prompt || loading) return;
    setInput(""); setHistory((items) => [...items, { role: "user", text: prompt }]); setLoading(true);
    window.setTimeout(() => {
      const q = prompt.toLowerCase();
      let answer = "Great question. Start with the smallest piece of the problem: what do you want someone to be able to do? Then sketch a simple solution, build one small part, and improve it as you learn. What have you tried so far?";
      if (q.includes("react")) answer = "React is a way to build a web page from small, reusable pieces called components. Think of each component like one building block: a button, a card, a navigation bar. When the data changes, React helps update the right part of the page. Want to try making your first component together?";
      else if (q.includes("api")) answer = "An API is a way for two pieces of software to talk to each other. Your website might ask a server for a list of courses, and the server sends the data back — usually in JSON. Imagine a helpful librarian: you ask for a book, they find it, and bring it to you.";
      else if (q.includes("css") || q.includes("responsive")) answer = "CSS controls how a page looks and adapts to different screens. Start with the content, use flexible tools like CSS Grid or Flexbox, and add a media query when the layout truly needs to change. It’s a lot easier if you start narrow and give each element room to breathe.";
      else if (q.includes("node") || q.includes("express")) answer = "Node.js lets you run JavaScript on the server. Express gives you a clear way to define routes: a URL like /api/courses can return a JSON list, while a POST route can handle a form. Keep input validation, security, and useful error responses in mind as you build.";
      setHistory((items) => [...items, { role: "assistant", text: answer }]); setLoading(false);
    }, 650);
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); ask(input); }

  return (
    <main className="route-page wrap assistant-route"><div className="assistant-frame"><aside className="assistant-sidebar"><Link className="assistant-side-brand" href="/assistant"><span><Bot size={17} /></span><b>Learning<br />assistant</b><i>✦</i></Link><button className="assistant-new-chat" onClick={() => { setHistory([]); setInput(""); }}><Plus size={14} /> Start a new chat</button><span className="assistant-sidebar__label">YOUR SPACE</span><nav><Link href="/dashboard"><Icon name="PanelsTopLeft" size={14} /> Dashboard</Link><Link href="/courses"><BookOpen size={14} /> My courses</Link><Link href="/certificates"><Award size={14} /> Certificates</Link></nav><span className="assistant-sidebar__label assistant-sidebar__label--recent"><History size={12} /> CURRENT CHAT</span><p className="assistant-history-item is-active"><MessageCircle size={13} /> Learning questions</p><div className="assistant-sidebar__foot">{initialsAvatar(user?.name ?? "Learner", "assistant-side-avatar", user?.profileImage)}<span><b>{user?.name ?? "Learner"}</b><small>Learning by building</small></span><MoreHorizontal size={16} /></div></aside><section className="assistant-chat"><div className="assistant-chat__top"><span className="assistant-model"><span><Bot size={15} /></span><b>Learning assistant</b><i><span /> READY</i></span><div><button className="icon-button" aria-label="Start new conversation" onClick={() => setHistory([])}><Plus size={15} /></button><button className="icon-button" aria-label="About the assistant"><CircleHelp size={15} /></button></div></div><div className="assistant-conversation"><div className="assistant-conversation__date"><span /> A LITTLE SPACE TO LEARN <span /></div><div className="assistant-chat-intro"><span className="assistant-hero-orb"><Bot size={28} /></span><span className="assistant-chat-intro__kicker">YOUR FRIENDLY LEARNING COMPANION</span><h1>Good ideas start<br /><span className="gradient-text">with good questions.</span></h1><p>A space to explore, untangle, and learn a little more. No question is too small.</p></div><div className="assistant-messages">{messages.map((message, index) => <div className={`assistant-message assistant-message--${message.role}`} key={`${index}-${message.role}`}><span className={`assistant-message__avatar${message.role === "assistant" ? " is-bot" : ""}`}>{message.role === "assistant" ? <Bot size={14} /> : initials(user?.name ?? "Learner")}</span><div><span className="assistant-message__name">{message.role === "assistant" ? "YOUR LEARNING ASSISTANT" : "YOU"}</span><p>{message.text}</p>{message.role === "assistant" && index === 0 && history.length === 0 && <div className="assistant-suggestions">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => ask(suggestion)}>{suggestion}<ArrowUpRight size={12} /></button>)}</div>}</div></div>)}{loading && <div className="assistant-message assistant-message--assistant"><span className="assistant-message__avatar is-bot"><Bot size={14} /></span><div><span className="assistant-message__name">YOUR LEARNING ASSISTANT</span><p className="assistant-thinking"><span /><span /><span /> Thinking it through…</p></div></div>}</div></div><form className="assistant-composer" onSubmit={submit}><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); ask(input); } }} placeholder="Ask a question or share an idea…" rows={2} maxLength={1400} aria-label="Message your learning assistant" /><div><span><Sparkles size={12} /> Curious minds welcome <i>·</i> {input.length}/1400</span><button type="submit" disabled={!input.trim() || loading} aria-label="Send message">{loading ? <LoaderCircle size={15} className="spin-icon" /> : <Send size={15} />}</button></div></form><p className="assistant-powered">A study companion with quick guidance — keep exploring and verify important facts as you learn.</p></section></div></main>
  );
}

function shareLesson() { if (typeof window !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(window.location.href).catch(() => {}); }
