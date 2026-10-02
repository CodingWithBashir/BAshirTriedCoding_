"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowDown, ArrowDownRight, ArrowRight, ArrowUpRight, Award, BrainCircuit, Braces,
  BriefcaseBusiness, Check, ChevronLeft, ChevronRight, Code2, CodeXml, Database,
  Github, GraduationCap, Layers3, Linkedin, Mail, MapPin, MonitorPlay, MousePointer2,
  Palette, Rocket, Sparkles, Terminal, Youtube,
} from "lucide-react";
import { articles, projects, services, skillGroups, testimonials } from "@/lib/data";
import { usePortfolioCollection } from "@/lib/use-portfolio-collection";
import { ButtonLink, Eyebrow, Icon, SectionHeading } from "@/components/ui";
import { ArticleArtwork, ProjectPreview } from "@/components/visuals";

const iconForSkill: Record<string, string> = {
  HTML: "Code2", CSS: "Palette", JavaScript: "Braces", TypeScript: "Braces", React: "Atom", "Next.js": "ArrowUpRight",
  "Tailwind CSS": "Palette", "Node.js": "Terminal", Express: "Plug", Python: "Webhook", Django: "Layers3", "REST APIs": "CodeXml",
  "Socket.io": "Sparkles", MongoDB: "Database", MySQL: "Database", PostgreSQL: "Database", Firebase: "Sparkles",
  Git: "Code2", GitHub: "Github", Docker: "Layers3", Linux: "Terminal", Vercel: "ArrowUpRight",
};

export function HomePage() {
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const { items: liveProjects } = usePortfolioCollection("projects", projects);
  const { items: liveArticles } = usePortfolioCollection("articles", articles);
  const { items: liveTestimonials } = usePortfolioCollection("testimonials", testimonials);
  const featured = liveProjects.slice(0, 4);
  const articlesToShow = liveArticles.slice(0, 4);
  useEffect(() => { if (testimonialIndex >= liveTestimonials.length) setTestimonialIndex(0); }, [testimonialIndex, liveTestimonials.length]);
  const visibleTestimonials = Array.from({ length: Math.min(3, liveTestimonials.length) }, (_, i) => liveTestimonials[(testimonialIndex + i) % liveTestimonials.length]);

  return (
    <main className="home-page">
      <section className="hero wrap" id="home">
        <div className="hero__glow hero__glow--one" /><div className="hero__glow hero__glow--two" />
        <div className="hero-copy">
          <span className="availability-pill"><i /> Open to collaboration <span>·</span> Kigali, Rwanda</span>
          <div className="hero-greeting"><span className="wave-hand">✳</span> Hello, I’m</div>
          <h1>Bashir<span className="hero-dot">.</span><span className="hero-surname"> Hussein</span></h1>
          <p className="hero-role" aria-label="Full-stack developer, builder, lifelong learner in Kigali, Rwanda">Full-stack <AnimatedRole /> <i>·</i> Kigali, Rwanda</p>
          <p className="hero-summary">I build thoughtful digital products, explore new ideas, and share what I learn along the way. A little curiosity can take us somewhere extraordinary.</p>
          <div className="hero-cta">
            <ButtonLink href="/#projects" icon="ArrowRight">Explore my work</ButtonLink>
            <a href="/resume.pdf" className="button button--outline" download><span><ArrowDown size={15} /> Download CV</span></a>
          </div>
          <div className="hero-socials" aria-label="Social links">
            <a href="https://github.com/" target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={17} /></a>
            <a href="https://youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube size={17} /></a>
            <a href="https://linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={17} /></a>
            <a href="mailto:hello@codingwithbashir.dev" aria-label="Email"><Mail size={16} /></a>
            <span />
            <span className="hero-social-note">Coding with purpose</span>
          </div>
          <span className="signature">Coding With Bashir <i /></span>
        </div>

        <div className="hero-portrait">
          <Image src="/images/developer-hero.png" alt="A young developer at work in a softly lit coding studio" fill priority loading="eager" sizes="(max-width: 800px) 100vw, 58vw" unoptimized className="hero-portrait__image" />
          <div className="hero-portrait__shade" />
          <div className="floating-tag floating-tag--github"><span className="floating-icon"><Github size={17} fill="currentColor" /></span><span><b>Open source</b><small>Building in public</small></span></div>
          <div className="floating-tag floating-tag--stack"><span className="stack-dot stack-dot--purple"><Code2 size={15} /></span><span><b>Full-stack dev</b><small>Ideas → shipped</small></span></div>
          <div className="code-card"><div className="code-card__top"><span><i /><i /><i /></span><b>the-next-big-idea.ts</b><MoreDots /></div><div className="code-lines"><p><i>01</i> <span className="code-purple">const</span> dream = <span className="code-green">"build something good"</span>;</p><p><i>02</i> <span className="code-purple">const</span> builder = <span className="code-blue">Bashir</span>();</p><p><i>03</i> <span className="code-purple">while</span> (dream) {'{'}</p><p><i>04</i> &nbsp;learn(); build(); share();</p><p><i>05</i> {'}'}</p></div><div className="code-card__status"><span><i /> Building something meaningful</span><span>main*</span></div></div>
          <div className="hero-caption"><span>01</span><span>BUILD. LEARN. REPEAT.</span><span>✳</span></div>
        </div>
        <a className="hero-scroll" href="#intro"><span>Scroll to explore</span><span className="scroll-track"><i /></span></a>
      </section>

      <section className="stat-strip wrap" id="intro" aria-label="At a glance">
        <div className="stat-item"><span className="stat-icon stat-icon--purple"><BriefcaseBusiness size={19} /></span><span><b>10<span>+</span></b><small>Projects completed</small></span></div>
        <div className="stat-item"><span className="stat-icon stat-icon--pink"><GraduationCap size={20} /></span><span><b>1<span>+</span></b><small>Years learning</small></span></div>
        <div className="stat-item"><span className="stat-icon stat-icon--blue"><Layers3 size={20} /></span><span><b>5<span>+</span></b><small>Technologies mastered</small></span></div>
        <div className="stat-item"><span className="stat-icon stat-icon--amber"><Sparkles size={20} /></span><span><b>100<span>%</span></b><small>Motivation</small></span></div>
      </section>

      <div className="ticker" aria-label="Building with modern tools"><div className="ticker__track">{[0, 1].map((copy) => <div className="ticker__group" key={copy} aria-hidden={copy === 1}>{["React", "Next.js", "TypeScript", "Node.js", "MongoDB", "Python", "Figma", "Git & GitHub"].map((tool, index) => <span key={tool}><i className={`ticker-dot ticker-dot--${index % 4}`} />{tool}</span>)}</div>)}</div></div>

      <section className="section wrap services-section" id="what-i-do">
        <SectionHeading kicker="A little about what I do" title="Turning curious ideas" accent="into useful things." copy="From a quick sketch to a product people love using — I care about the craft behind every click." align="split" />
        <div className="services-layout">
          <div className="services-note"><span className="services-note__number">01 / WHAT I DO</span><h3>Good work<br />starts with <em>curiosity.</em></h3><p>I work across the full stack, blending thoughtful engineering with a human-first approach to design. Whether it's a web app, an AI experiment, or a learning tool, I love making the complicated feel simple.</p><ButtonLink href="/services" variant="outline" icon="ArrowUpRight">Explore services & scope</ButtonLink><span className="services-note__scribble">Ideas welcome ↗</span></div>
          <div className="service-grid">{services.map((service, index) => <article className="service-card" key={service.title}><div className={`service-card__icon service-card__icon--${index % 4}`}><Icon name={service.icon} size={20} /></div><span className="service-card__index">0{index + 1}</span><h3>{service.title}</h3><p>{service.text}</p><span className="service-card__arrow"><ArrowUpRight size={14} /></span></article>)}</div>
        </div>
      </section>

      <section className="skills-band" id="skills"><div className="section wrap skills-section"><div className="skills-heading"><Eyebrow icon="CodeXml">My toolkit</Eyebrow><h2>Tools I reach for.<br /><span className="gradient-text">Things I keep learning.</span></h2><p>Technology is only as good as what you do with it. Here are a few of the tools I enjoy making things with.</p><ButtonLink href="/profile" variant="outline" icon="ArrowRight">A bit more about me</ButtonLink></div>
        <div className="skill-groups">{skillGroups.map((group, index) => <div className="skill-group" key={group.name}><div className="skill-group__head"><span className={`skill-group__dot skill-group__dot--${index}`} /><b>{group.name}</b><span>0{index + 1}</span></div><div className="skill-pills">{group.skills.map((skill) => <span className="skill-pill" key={skill}><Icon name={iconForSkill[skill] ?? "Code2"} size={13} />{skill}</span>)}</div></div>)}</div>
      </div></section>

      <section className="section wrap projects-section" id="projects"><SectionHeading kicker="Some things I've made" title="A few ideas, brought" accent="to life." copy="Every project is a little different. These are a few of the things I've had fun building recently." link="/projects" linkLabel="View all projects" /><div className="project-grid">{featured.map((project, index) => <article className="project-card" key={project.slug}><Link href={`/projects#${project.slug}`} className="project-card__preview-link" aria-label={`See ${project.name} project`}><ProjectPreview variant={project.variant} name={project.name} /><span className="project-open"><ArrowUpRight size={16} /></span></Link><div className="project-card__body"><div className="project-card__meta"><span className="project-category"><i />{project.label}</span><span className="project-card__number">0{index + 1}</span></div><Link href={`/projects#${project.slug}`} className="project-card__title">{project.name}<ArrowUpRight size={15} /></Link><p>{project.summary || project.description}</p><div className="tag-list">{project.stack.slice(0, 3).map((tag) => <span className="tech-tag" key={tag}>{tag}</span>)}</div></div></article>)}</div><div className="center-action"><ButtonLink href="/projects" variant="outline" icon="ArrowRight">More projects & experiments</ButtonLink></div></section>

      <section className="about-section" id="about"><div className="about-layout wrap"><div className="about-photo"><Image src="/images/developer-hero.png" alt="Bashir working on a new idea" fill sizes="(max-width: 760px) 100vw, 50vw" unoptimized /><div className="about-photo__gradient" /><div className="about-photo__badge"><span><MapPin size={14} /></span><span><small>BASED IN</small><b>Kigali, Rwanda</b></span></div><span className="about-photo__caption">A good day is a day I learned something.</span></div><div className="about-copy"><Eyebrow icon="Sparkles">A little about me</Eyebrow><h2>A young developer<br />with <span className="gradient-text">big dreams.</span></h2><p className="about-lead">Hi, I'm Bashir — a developer, maker, and lifelong learner from Rwanda.</p><p>I love using code to solve problems, tell stories, and help good ideas find their way into the world. When I'm not learning a new framework, I'm building tools that make it a little easier for someone else to begin.</p><div className="about-facts"><div><MapPin size={16} /><span><small>LOCATION</small><b>Kigali, Rwanda</b></span></div><div><GraduationCap size={17} /><span><small>FOCUS</small><b>Full-stack & product</b></span></div><div><Award size={17} /><span><small>CURRENTLY</small><b>Learning by building</b></span></div><div><Sparkles size={16} /><span><small>OPEN TO</small><b>Good collaborations</b></span></div></div><div className="about-actions"><ButtonLink href="/contact" icon="ArrowRight">Say hello</ButtonLink><a className="text-link" href="mailto:hello@codingwithbashir.dev">hello@codingwithbashir.dev <ArrowUpRight size={14} /></a></div><span className="signature signature--about">Keep building. <i /></span></div></div></section>

      <section className="section wrap testimonial-section"><SectionHeading kicker="Kind words from kind people" title="The best part is" accent="building together." copy="A few thoughtful notes from people I've had the joy of learning and working alongside." align="split" /><div className="testimonial-controls"><span>{String(testimonialIndex + 1).padStart(2, "0")} <i>/</i> {String(liveTestimonials.length).padStart(2, "0")}</span><button aria-label="Previous testimonial" disabled={!liveTestimonials.length} onClick={() => setTestimonialIndex((index) => liveTestimonials.length ? (index + liveTestimonials.length - 1) % liveTestimonials.length : 0)}><ChevronLeft size={17} /></button><button aria-label="Next testimonial" disabled={!liveTestimonials.length} onClick={() => setTestimonialIndex((index) => liveTestimonials.length ? (index + 1) % liveTestimonials.length : 0)}><ChevronRight size={17} /></button></div><div className="testimonial-grid">{visibleTestimonials.map((person) => <article className="testimonial-card" key={`${testimonialIndex}-${person.name}`}><span className="quote-mark">“</span><p>{person.quote}</p><div className="testimonial-person"><span className={`person-avatar person-avatar--${person.color}`}>{person.initials}</span><span><b>{person.name}</b><small>{person.role}</small></span><span className="testimonial-stars" aria-label="5 out of 5 stars">★★★★★</span></div></article>)}</div><div className="testimonial-dots">{liveTestimonials.map((item, i) => <button key={item.name} onClick={() => setTestimonialIndex(i)} className={testimonialIndex === i ? "is-active" : ""} aria-label={`Show testimonial ${i + 1}`} />)}</div></section>

      <section className="section wrap journal-section" id="blog"><SectionHeading kicker="Notes from the journey" title="Curiosity, in" accent="paragraph form." copy="Little lessons, interesting discoveries, and the occasional note to my past self." link="/blog" linkLabel="Visit the journal" /><div className="journal-grid">{articlesToShow.map((article) => <Link className="journal-card" href={`/blog/${article.slug}`} key={article.slug}><ArticleArtwork variant={article.variant} /><div className="journal-card__meta"><span>{article.category}</span><span>{article.date}</span></div><h3>{article.title}<ArrowUpRight size={15} /></h3><p>{article.excerpt}</p><span className="journal-read">Read the story <ArrowRight size={13} /></span></Link>)}</div></section>

      <section className="mountain-cta"><div className="mountain-cta__glow" /><svg className="mountain-cta__art" viewBox="0 0 1440 260" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="mountains-a" x1="0" x2="0.9" y1="0" y2="1"><stop stopColor="#5b38c8" stopOpacity=".24" /><stop offset="1" stopColor="#1c2458" stopOpacity=".7" /></linearGradient><linearGradient id="mountains-b" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#8255fc" stopOpacity=".42" /><stop offset="1" stopColor="#141c3b" stopOpacity=".7" /></linearGradient></defs><path fill="url(#mountains-a)" d="M0 210 95 163l62 24 94-104 50 64 91-30 60 70 68-96 84 102 96-46 56 39 70-122 84 103 91-71 66 82 83-116 65 53 78-42 86 96 77-35 55 43v51H0z"/><path fill="url(#mountains-b)" d="M0 225 91 187l59 21 83-78 90 81 89-102 66 60 73-75 83 111 58-51 87 59 76-93 71 88 76-61 96 58 80-92 70 86 78-54 74 64v50H0z"/><path fill="#090c18" fillOpacity=".68" d="m0 242 114-42 58 19 102-56 91 39 87-23 73 32 96-59 69 43 81-31 67 42 88-47 88 31 105-35 80 39 83-24 60 33v57H0z"/></svg><div className="mountain-cta__inner wrap"><span className="mountain-cta__eyebrow"><Sparkles size={14} /> THE NEXT GOOD IDEA STARTS SOMEWHERE</span><h2>Got an idea?<br /><span>Let's build it together.</span></h2><p>Have a project in mind, a question, or just want to say hello?<br />I’d love to hear what you’re dreaming up.</p><ButtonLink href="/contact" icon="ArrowUpRight">Start a conversation</ButtonLink><span className="mountain-cta__footnote"><i /> Currently open to new projects</span></div></section>
    </main>
  );
}

function AnimatedRole() {
  const roles = ["developer", "builder", "learner", "problem solver"];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => setIndex((current) => (current + 1) % roles.length), 2600);
    return () => window.clearInterval(interval);
  }, []);
  return <span className="hero-role__dynamic" aria-hidden="true">{roles[index]}</span>;
}

function MoreDots() { return <span className="more-dots">•••</span>; }
