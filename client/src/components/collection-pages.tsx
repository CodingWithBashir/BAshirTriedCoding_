"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine, ArrowRight, ArrowUpRight, Award, BadgeCheck, BookOpen, BriefcaseBusiness,
  Check, Clock3, Filter, GraduationCap, Layers3, Mail, Search, Share2, Sparkles, Star, Users,
} from "lucide-react";
import { articles, courses, pageCategories, projects as defaultProjects } from "@/lib/data";
import { usePortfolioCollection } from "@/lib/use-portfolio-collection";
import { useLearnerAuth } from "@/components/learner-auth";
import { ButtonLink, Eyebrow, Icon, PageIntro, ProgressBar } from "@/components/ui";
import { ArticleArtwork, CertificateArt, CourseArtwork, ProjectPreview } from "@/components/visuals";
import { WorkspaceSidebar } from "@/components/workspace-pages";

const courseCategories = ["All", ...pageCategories.slice(1)];

export function ProjectsPage() {
  const { items } = usePortfolioCollection("projects", defaultProjects);
  const [filter, setFilter] = useState("All work");
  const [query, setQuery] = useState("");
  const categories = ["All work", ...Array.from(new Set(items.map((project) => project.category).filter(Boolean)))];
  const filtered = useMemo(() => items.filter((project) => {
    const matchesCategory = filter === "All work" || project.category === filter;
    const matchesQuery = `${project.name} ${project.description} ${project.stack.join(" ")}`.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  }), [items, filter, query]);

  return (
    <main className="route-page wrap">
      <PageIntro eyebrow="THE THINGS I’VE MADE" icon="PanelsTopLeft" title="Small ideas." accent="Real things." description="A collection of experiments, useful tools, and products built with a lot of curiosity and a little bit of code." action={<Link className="button button--primary" href="/contact"><Sparkles size={15} /> Build something <ArrowUpRight size={14} /></Link>} />
      <div className="collection-toolbar"><div className="filter-pills" role="tablist" aria-label="Filter projects">{categories.map((category) => <button key={category} role="tab" aria-selected={filter === category} onClick={() => setFilter(category)} className={`filter-pill${filter === category ? " is-active" : ""}`}>{category}</button>)}</div><label className="search-field"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a project…" aria-label="Search projects" /></label></div>
      <div className="collection-count"><span>{filtered.length} <i>{filtered.length === 1 ? "project" : "projects"}</i></span><span className="result-filter"><Filter size={12} /> Curated experiments & shipped work</span></div>
      {filtered.length ? <div className="project-grid project-grid--collection">{filtered.map((project, index) => <article className="project-card" id={project.slug} key={project.slug}><Link href={`/projects#${project.slug}`} className="project-card__preview-link" aria-label={`Open ${project.name} project details`}><ProjectPreview variant={project.variant} name={project.name} /><span className="project-open"><ArrowUpRight size={16} /></span></Link><div className="project-card__body"><div className="project-card__meta"><span className="project-category"><i />{project.label}</span><span className="project-card__number">{String(index + 1).padStart(2, "0")}</span></div><h2 className="project-card__title">{project.name}<ArrowUpRight size={15} /></h2><p>{project.description}</p><div className="tag-list">{project.stack.map((tag) => <span className="tech-tag" key={tag}>{tag}</span>)}</div><div className="project-card__actions">{project.liveUrl ? <a href={project.liveUrl} target="_blank" rel="noreferrer" className="text-link">Preview project <ArrowUpRight size={13} /></a> : <span className="text-link project-preview-note"><Clock3 size={12} />Preview link coming soon</span>}<span className="project-private"><Check size={11} /> Built with purpose</span></div></div></article>)}</div> : <EmptyState title="No projects found" text="Try a different search or browse all work." onClear={() => { setFilter("All work"); setQuery(""); }} />}
      <div className="project-footnote"><span className="project-footnote__mark"><Code2Fallback /></span><span><b>Always a work in progress.</b><small>I’m usually making something new. Check back soon for the next experiment.</small></span><Link href="/contact">Have an idea? <ArrowRight size={13} /></Link></div>
    </main>
  );
}

export function CoursesPage() {
  const { items, ready } = usePortfolioCollection("courses", courses);
  const { user, progressByCourse } = useLearnerAuth();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const filtered = items.filter((course) => (category === "All" || course.category === category) && `${course.title} ${course.description}`.toLowerCase().includes(query.toLowerCase()));
  const categories = ["All", ...Array.from(new Set(items.map((course) => course.category)))];

  return (
    <main className="route-page wrap courses-page">
      <PageIntro eyebrow="GROW AT YOUR OWN PACE" icon="GraduationCap" title="All courses" description="Explore courses only after their authored lessons are ready. Create an account to save your progress as you learn." action={<Link className="catalog-search search-field" href="#course-catalog"><Search size={14} /><span>Find your next course</span><kbd>↓</kbd></Link>} />
      <div className="learning-stats"><div><span className="learning-stat-icon learning-stat-icon--violet"><BookOpen size={18} /></span><b>{String(items.length).padStart(2, "0")} <small>courses to explore</small></b></div><div><span className="learning-stat-icon learning-stat-icon--cyan"><Users size={18} /></span><b>Learn by doing <small>hands-on lessons</small></b></div><div><span className="learning-stat-icon learning-stat-icon--green"><Award size={18} /></span><b>Earn as you grow <small>share your progress</small></b></div></div>
      <section id="course-catalog" className="course-catalog"><div className="collection-toolbar"><div className="filter-pills" role="tablist" aria-label="Filter courses">{categories.map((value) => <button key={value} role="tab" aria-selected={category === value} className={`filter-pill${category === value ? " is-active" : ""}`} onClick={() => setCategory(value)}>{value}</button>)}</div><label className="search-field course-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search courses…" aria-label="Search courses" /></label></div>
        <div className="course-grid">{filtered.map((course) => {
          const learnerProgress = progressByCourse[course.slug];
          const percent = learnerProgress?.percent ?? 0;
          return <article className="course-card" key={course.slug}><CourseArtwork icon={course.icon} color={course.color} title={course.title} /><div className="course-card__body"><div className="course-card__meta"><span className="level-pill">{course.level}</span><span className="course-category-label">{course.category}</span></div><h2>{course.title}</h2><p>{course.description}</p><div className="course-card__detail"><span><BookOpen size={12} />{course.lessons} lessons</span><span><Clock3 size={12} />{course.duration}</span></div>{percent > 0 ? <div className="course-progress"><span>{percent === 100 ? "Course complete" : "Your progress"}</span><b>{percent}%</b><ProgressBar value={percent} /></div> : <span className="course-card__empty-progress">{user ? "A fresh start is a good start." : "Sign in to save your progress."}</span>}<Link className="button button--primary course-card__button" href={`/learn/${course.slug}`}>{!user ? "Sign in to start" : percent === 100 ? "Review course" : percent > 0 ? "Continue learning" : "Start learning"}<ArrowRight size={14} /></Link></div></article>;
        })}</div>
        {!filtered.length && (items.length ? <EmptyState title="No courses found" text="Try a different category or search term." onClear={() => { setCategory("All"); setQuery(""); }} /> : <div className="learning-catalog-empty"><span><BookOpen size={20} /></span><h2>{ready ? "No courses published yet" : "Loading the course catalog…"}</h2><p>{ready ? "Courses will appear when their real lesson curriculum has been authored. We do not show placeholder courses." : "Only published courses with authored lessons can be listed."}</p></div>)}
      </section>
      <section className="learning-banner"><span className="learning-banner__spark"><Sparkles size={20} /></span><div><span className="banner-kicker">A LITTLE GOES A LONG WAY</span><h2>Your next idea starts with one lesson.</h2><p>No rush. No pressure. Just a good place to begin.</p></div><ButtonLink href="/dashboard" variant="outline" icon="ArrowRight">Your learning space</ButtonLink><span className="learning-banner__orb" /></section>
    </main>
  );
}

export function CertificatesPage() {
  const { items: publishedCourses } = usePortfolioCollection("courses", courses);
  const { certificates: earnedCertificates, progressByCourse } = useLearnerAuth();
  const [query, setQuery] = useState("");
  const inProgress = Object.values(progressByCourse).filter((item) => item.percent > 0 && item.percent < 100).length;
  const filtered = earnedCertificates.filter((item) => `${item.courseTitle} ${item.certificateNumber}`.toLowerCase().includes(query.toLowerCase()));
  const featured = earnedCertificates[0];
  const notStarted = Math.max(0, publishedCourses.length - Object.keys(progressByCourse).length);

  return (
    <main className="route-page wrap certificates-page">
      <div className="dashboard-frame certificate-dashboard"><WorkspaceSidebar active="Certificates" /><div className="certificate-dashboard__main">
      <div className="achievement-hero"><div className="achievement-hero__copy"><Eyebrow icon="Award">EARNED THROUGH YOUR LEARNING</Eyebrow><h1>Your achievements<br /><span className="gradient-text">belong to you.</span></h1><p>Certificates appear here when you finish every lesson in a course. Each one is tied to your account and course completion.</p><div className="achievement-perks"><span><BadgeCheck size={16} /><b>Genuinely earned</b><small>Course lessons complete</small></span><span><ArrowDownToLine size={16} /><b>Account-linked</b><small>Yours to revisit</small></span><span><Share2 size={16} /><b>Ready to share</b><small>Keep your milestones</small></span></div></div><div className="achievement-hero__art">{featured ? <><div className="cert-glow" /><CertificateArt title={featured.courseTitle} recipient={featured.recipientName} issued={new Date(featured.issuedAt).toLocaleDateString()} certificateNumber={featured.certificateNumber} courseIcon={featured.courseIcon || "Award"} courseColor={featured.courseColor || "violet"} color="blue" /></> : <div className="certificate-empty-hero"><span><Award size={31} /></span><b>Your first certificate</b><small>Complete a course to earn it.</small></div>}</div><aside className="achievement-quote"><span>“</span><p>Every finished lesson is a step you took for yourself.</p><small>YOUR LEARNING JOURNEY</small><i /></aside><div className="achievement-hero__ring" /></div>
      <div className="achievement-summary"><div><span className="summary-icon"><Award size={16} /></span><b>{earnedCertificates.length}<small>Earned</small></b></div><div><span className="summary-icon summary-icon--blue"><BookOpen size={16} /></span><b>{inProgress}<small>In progress</small></b></div><div><span className="summary-icon summary-icon--muted"><Layers3 size={16} /></span><b>{notStarted}<small>Not started</small></b></div><div className="summary-note"><span><Check size={12} />Only completed courses earn a certificate.</span><span>Your account progress is saved</span></div></div>
      <div className="cert-toolbar"><div className="filter-pills"><span className="filter-pill is-active">Earned certificates</span></div><label className="search-field"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your certificates…" aria-label="Search earned certificates" /></label></div>
      <div className="cert-results-heading"><span><span className="cert-results-dot" /> YOUR EARNED MILESTONES</span><small>{filtered.length} {filtered.length === 1 ? "certificate" : "certificates"}</small></div>
      {filtered.length ? <div className="certificate-grid">{filtered.map((item, index) => <article className="certificate-card" key={item.id}><Link className="certificate-card__art" href={`/certificates/${encodeURIComponent(item.id)}`} aria-label={`View your ${item.courseTitle} certificate`}><CertificateArt title={item.courseTitle} recipient={item.recipientName} issued={new Date(item.issuedAt).toLocaleDateString()} certificateNumber={item.certificateNumber} courseIcon={item.courseIcon || "Award"} courseColor={item.courseColor || "violet"} color="blue" compact /><span className="certificate-card__art-open"><ArrowUpRight size={15} /></span></Link><div className="certificate-card__content"><span className="cert-type cert-type--blue">COURSE COMPLETED</span><h2>{item.courseTitle}</h2><p>Earned by {item.recipientName} after completing every lesson in this course.</p><div className="certificate-card__meta"><span><Clock3 size={12} />{new Date(item.issuedAt).toLocaleDateString()}</span><span><BadgeCheck size={12} />{item.certificateNumber}</span></div><div className="certificate-card__actions"><Link href={`/certificates/${encodeURIComponent(item.id)}`} className="button button--primary"><Award size={13} /> View certificate</Link><button className="icon-button" aria-label={`Share ${item.courseTitle} certificate`} onClick={() => copyShareLink(item.certificateNumber)}><Share2 size={14} /></button></div></div><span className="certificate-card__index">{String(index + 1).padStart(2, "0")}</span></article>)}</div> : <div className="certificate-empty-state"><span><Award size={23} /></span><h2>{earnedCertificates.length ? "No matching certificates" : "Your first certificate is waiting"}</h2><p>{earnedCertificates.length ? "Try a different course title or certificate number." : "Choose a course and complete every lesson. Once it is finished, your account will receive a verifiable certificate here."}</p><ButtonLink href={earnedCertificates.length ? "/certificates" : "/courses"} icon="ArrowRight">{earnedCertificates.length ? "Clear search" : "Explore courses"}</ButtonLink></div>}
      <section className="achievement-cta"><div className="achievement-cta__light" /><span className="achievement-cta__icon"><Sparkles size={20} /></span><div><Eyebrow>THE NEXT ONE IS WAITING</Eyebrow><h2>Keep going. You’re doing great.</h2><p>Finish the lessons in a course to earn your next certificate.</p></div><ButtonLink href="/courses" icon="ArrowRight">Explore the courses</ButtonLink></section>
      </div></div>
    </main>
  );
}

export function BlogPage() {
  const { items } = usePortfolioCollection("articles", articles);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const categories = ["All", ...Array.from(new Set(items.map((item) => item.category).filter(Boolean)))];
  const filtered = items.filter((item) => (category === "All" || item.category === category) && `${item.title} ${item.excerpt}`.toLowerCase().includes(query.toLowerCase()));
  const featured = filtered[0];

  return (
    <main className="route-page wrap blog-page">
      <PageIntro eyebrow="THE DEVELOPER’S JOURNAL" icon="BookOpen" title="Ideas worth" accent="writing down." description="Tutorials, little discoveries, and notes from the journey of learning and building in public." action={<label className="search-field"><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the journal…" aria-label="Search blog articles" /></label>} />
      {featured && <Link className="blog-featured" href={`/blog/${featured.slug}`}><ArticleArtwork variant={featured.variant} /><div className="blog-featured__copy"><span className="blog-featured__kicker"><span /> THE LATEST NOTE</span><div className="blog-featured__meta"><span>{featured.category}</span><span>{featured.date}</span><span><Clock3 size={11} />{featured.readTime}</span></div><h2>{featured.title}</h2><p>{featured.excerpt} A few thoughts, practical examples, and the little details that made the difference.</p><span className="blog-featured__link">Read the article <ArrowRight size={14} /></span></div><span className="blog-featured__spark"><Sparkles size={16} /></span></Link>}
      <div className="blog-toolbar"><div className="filter-pills" role="tablist" aria-label="Filter articles">{categories.map((item) => <button key={item} role="tab" aria-selected={category === item} className={`filter-pill${category === item ? " is-active" : ""}`} onClick={() => setCategory(item)}>{item}</button>)}</div><span className="blog-result-count">{filtered.length} notes & stories</span></div>
      <div className="blog-grid">{filtered.slice(1).map((article) => <Link className="blog-card" href={`/blog/${article.slug}`} key={article.slug}><ArticleArtwork variant={article.variant} /><div className="blog-card__meta"><span>{article.category}</span><span>{article.date}</span></div><h2>{article.title}<ArrowUpRight size={14} /></h2><p>{article.excerpt}</p><span className="blog-card__read"><span><Clock3 size={12} />{article.readTime}</span><span>Read story <ArrowRight size={13} /></span></span></Link>)}</div>
      {!filtered.length && <EmptyState title="Nothing in the notebook yet" text="Try a different search or category." onClear={() => { setCategory("All"); setQuery(""); }} />}
      <div className="blog-endnote"><span className="blog-endnote__spark"><Sparkles size={16} /></span><span>Curiosity looks good on you. <b>Come back soon for the next note.</b></span></div>
    </main>
  );
}

export function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const [apiMode, setApiMode] = useState("");

  useEffect(() => {
    const rawBrief = new URLSearchParams(window.location.search).get("brief");
    if (!rawBrief) return;
    try {
      const brief = JSON.parse(rawBrief) as { services?: string[]; timeline?: string; estimate?: string };
      const selected = Array.isArray(brief.services) ? brief.services.filter((item) => typeof item === "string").slice(0, 8) : [];
      if (!selected.length) return;
      setForm((current) => ({
        ...current,
        subject: `Project conversation: ${selected.slice(0, 2).join(" + ")}`.slice(0, 160),
        message: `Hi Bashir,\n\nI’d like to explore a project together. I’m interested in: ${selected.join(", ")}.\n\nPreferred timing: ${String(brief.timeline || "Flexible").slice(0, 80)}.\nSuggested first milestone: ${String(brief.estimate || "Let’s discuss the scope").slice(0, 100)}.\n\nA little more about what I have in mind:\n`,
      }));
    } catch {
      // Ignore malformed query parameters and leave the contact form blank.
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setErrors({}); setFeedback(""); setStatus("sending");
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const body = await response.json();
      if (!response.ok) { setErrors(body.fields ?? {}); throw new Error(body.error || "Something went wrong. Please try again."); }
      setStatus("sent"); setFeedback(body.message || "Thanks for the note — I'll get back to you soon."); setForm({ name: "", email: "", subject: "", message: "" });
    } catch (error) { setStatus("error"); setFeedback(error instanceof Error ? error.message : "The message could not be sent. Please try emailing instead."); }
  }
  useEffect(() => {
    let active = true;
    fetch("/api/health")
      .then((response) => response.json())
      .then((body) => { if (active) setApiMode(body.database === "mongodb" ? "MongoDB connected" : "secure demo inbox"); })
      .catch(() => { if (active) setApiMode("email"); });
    return () => { active = false; };
  }, []);

  return (
    <main className="route-page wrap contact-page"><PageIntro eyebrow="SOMETHING ON YOUR MIND?" icon="Mail" title="Let’s make" accent="something matter." description="Have an idea, a question, or simply want to say hello? There’s always room for a good conversation." />
      <div className="contact-layout"><section className="contact-form-wrap"><div className="contact-form-heading"><span className="contact-form-icon"><Mail size={16} /></span><div><h2>Leave me a note.</h2><p>I’ll be in touch as soon as I can.</p></div></div><form className="contact-form" onSubmit={submit} noValidate><div className="form-row"><Field label="Your name" name="name" value={form.name} error={errors.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="e.g. Amina Uwimana" /><Field label="Email address" name="email" value={form.email} error={errors.email} onChange={(value) => setForm({ ...form, email: value })} placeholder="you@example.com" type="email" /></div><Field label="What’s this about?" name="subject" value={form.subject} error={errors.subject} onChange={(value) => setForm({ ...form, subject: value })} placeholder="A project, a question, a big idea…" /><label className={`form-field${errors.message ? " form-field--error" : ""}`}><span>Your message <i>· at least 10 characters</i></span><textarea name="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="A few words to get us started…" rows={5} maxLength={5000} aria-invalid={!!errors.message} />{errors.message && <small className="field-error">{errors.message}</small>}<small className="field-counter">{form.message.length}/5000</small></label><div className="contact-form__submit"><button disabled={status === "sending"} className="button button--primary" type="submit">{status === "sending" ? <><span className="button-spinner" /> Sending…</> : status === "sent" ? <><Check size={15} /> Message sent</> : <>Send your message <ArrowUpRight size={14} /></>}</button><span>Kind words and good ideas welcome.</span></div>{feedback && <div role="status" className={`form-feedback form-feedback--${status}`}>{status === "sent" ? <Check size={14} /> : <Sparkles size={14} />}{feedback}</div>}</form></section>
        <aside className="contact-aside"><div className="contact-aside__top"><Eyebrow icon="Sparkles">A QUICK HELLO WORKS TOO</Eyebrow><h2>The next great thing might start with a <span className="gradient-text">conversation.</span></h2><p>Tell me what you’re building or what you’re curious about. I usually reply within a couple of days.</p></div><a className="contact-method" href="mailto:hello@codingwithbashir.dev"><span><Mail size={16} /></span><div><small>DROP ME A LINE</small><b>hello@codingwithbashir.dev</b></div><ArrowUpRight size={15} /></a><div className="contact-method"><span><Layers3 size={16} /></span><div><small>FIND ME AROUND</small><b>Kigali, Rwanda <span>·</span> GMT+2</b></div><span className="contact-currently"><i /> Here now</span></div><div className="contact-social-block"><span>LET’S CONNECT</span><div><a href="https://github.com/" target="_blank" rel="noreferrer" aria-label="GitHub"><Icon name="Github" size={16} /></a><a href="https://linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Icon name="BriefcaseBusiness" size={16} /></a><a href="https://youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube"><Icon name="MonitorPlay" size={16} /></a></div></div><div className="contact-response"><span className="contact-response__icon"><Sparkles size={15} /></span><span><b>What happens next?</b><small>Your note lands safely in my {apiMode || "inbox"}. I’ll read it and get back to you — personally.</small></span><BadgeCheck size={14} /></div></aside></div>
      <div className="contact-bottom-note"><span><i /> OPEN TO GOOD COLLABORATIONS</span><span>Good work is a team sport. <Link href="/projects">See what I’ve been building <ArrowUpRight size={12} /></Link></span></div>
    </main>
  );
}

function Field({ label, name, value, error, onChange, placeholder, type = "text" }: { label: string; name: string; value: string; error?: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return <label className={`form-field${error ? " form-field--error" : ""}`}><span>{label}</span><input type={type} name={name} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-invalid={!!error} maxLength={name === "email" ? 160 : 90} />{error && <small className="field-error">{error}</small>}</label>;
}

function EmptyState({ title, text, onClear }: { title: string; text: string; onClear: () => void }) {
  return <div className="empty-state"><span><Search size={19} /></span><h2>{title}</h2><p>{text}</p><button className="button button--outline" onClick={onClear}>Clear filters <ArrowRight size={13} /></button></div>;
}
function Code2Fallback() { return <Icon name="CodeXml" size={18} />; }
function copyShareLink(certificateNumber: string) { if (typeof window !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(`${window.location.origin}/verify/${encodeURIComponent(certificateNumber)}`).catch(() => {}); }
