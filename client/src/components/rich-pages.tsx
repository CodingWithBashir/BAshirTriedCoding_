"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Award, BookOpen, Braces, BriefcaseBusiness, Check,
  ChevronDown, Code2, Compass, Cuboid, Database, FileText, Layers3, Lightbulb,
  MapPin, MessageCircle, Palette, Play, Rocket, Search, Sparkles, Target, Users,
} from "lucide-react";
import { PageIntro, Eyebrow } from "@/components/ui";
import { articles, courses, projects, services, skillGroups } from "@/lib/data";
import styles from "./rich-pages.module.css";

type ServiceOption = { id: string; title: string; category: string; description: string; outcome: string; icon: typeof Code2; tint: string };

const serviceOptions: ServiceOption[] = [
  { id: "web", title: "Product & web apps", category: "ENGINEERING", description: "Thoughtful frontends and durable full-stack foundations, from a first release to a growing product.", outcome: "A clear product flow, responsive interface, and dependable technical foundation.", icon: Code2, tint: "violet" },
  { id: "api", title: "APIs & integrations", category: "SYSTEMS", description: "Clean interfaces between services, careful data handling, and practical documentation for the next developer.", outcome: "A predictable API contract, useful integrations, and clear operational notes.", icon: Layers3, tint: "cyan" },
  { id: "ai", title: "AI experiments", category: "INTELLIGENCE", description: "Useful AI features built around a real user need—not a demo that ends at the prompt box.", outcome: "A focused use case, safe interactions, and a path to evaluate quality.", icon: Lightbulb, tint: "pink" },
  { id: "design", title: "UI & product design", category: "EXPERIENCE", description: "A polished design system and accessible interaction details that help people feel at home.", outcome: "A reusable visual direction, annotated flows, and interaction-ready screens.", icon: Palette, tint: "amber" },
  { id: "data", title: "Data & platform work", category: "FOUNDATIONS", description: "A sensible data model, the right persistence choices, and a foundation that can grow safely.", outcome: "Documented collections, validated inputs, and a maintainable service boundary.", icon: Database, tint: "green" },
  { id: "learning", title: "Learning products", category: "EDUCATION", description: "Friendly learning paths, progress systems, and practical interfaces that make a hard first step easier.", outcome: "Clear learning milestones, useful feedback loops, and a learner-first interface.", icon: BookOpen, tint: "blue" },
];

const processSteps = [
  { title: "Listen first", body: "We make space for the actual problem, who it affects, and how you’ll know the work helped.", icon: MessageCircle },
  { title: "Shape the scope", body: "Turn a big idea into a useful first release, with clear milestones and the right level of detail.", icon: Target },
  { title: "Build in the open", body: "Work in small, reviewable steps. You can follow decisions, ask questions, and see the product take shape.", icon: Cuboid },
  { title: "Ship & learn", body: "Launch carefully, observe how people use it, and leave the project easier to maintain than we found it.", icon: Rocket },
];

const faqs = [
  { question: "What does an engagement usually look like?", answer: "It starts with a short conversation and a written brief. From there we agree on the first useful milestone, how we’ll review progress, and what a clean hand-off needs to include." },
  { question: "Can you work with an existing product or codebase?", answer: "Yes. A small technical and experience review is a good first step. We can identify the most useful improvement, note risks, and decide whether a focused change or a larger refactor makes sense." },
  { question: "Do you take on learning or community projects?", answer: "Education, community tools, and projects that make technology feel more accessible are especially close to the mission. The project planner below is a simple way to share the first outline." },
  { question: "How do you handle updates and ownership?", answer: "You receive regular, readable updates and a clear list of decisions. Source code, design files, and documentation are handed over according to the agreement we make before work begins." },
];

export function ServicesPage() {
  const [selected, setSelected] = useState<string[]>(["web", "design"]);
  const [timeline, setTimeline] = useState("Flexible");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const chosen = serviceOptions.filter((service) => selected.includes(service.id));
  const estimate = chosen.length === 0 ? "Choose an area to begin" : chosen.length === 1 ? "A focused 1–2 week milestone" : chosen.length <= 3 ? "A staged 2–5 week engagement" : "A phased 4–8 week roadmap";
  const brief = encodeURIComponent(JSON.stringify({
    services: chosen.map((service) => service.title),
    timeline,
    estimate,
  }));

  function toggleService(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return <main className={`route-page wrap ${styles.richPage} ${styles.servicesPage}`}>
    <PageIntro eyebrow="A CLEARER WAY TO BUILD" icon="Sparkles" title="Make room for" accent="good work." description="Product thinking, careful engineering, and thoughtful collaboration—from the first question through a useful launch." action={<Link className="button button--primary" href="#planner"><Compass size={14} /> Plan a project <ArrowDownRight size={14} /></Link>} />

    <section className={styles.servicesHero}><div className={styles.servicesHeroCopy}><span className={styles.miniKicker}><span /> BUILT AROUND YOUR NEXT STEP</span><h2>Good products start<br />with <em>one useful question.</em></h2><p>Choose the kind of help you need. We’ll use it to shape a first conversation—not to lock you into a package.</p><Link href="#approach" className={styles.inlineLink}>See the working approach <ArrowDownRight size={14} /></Link></div><div className={styles.servicesHeroAside}><div className={styles.heroAsideOrb} /><span className={styles.heroAsideIcon}><Sparkles size={22} /></span><b>Thoughtful by default.</b><p>Accessible, responsive, and built to be understood by the people who’ll maintain it.</p><div><span><Check size={11} /> Clear scope</span><span><Check size={11} /> Small releases</span><span><Check size={11} /> Practical hand-off</span></div></div></section>

    <section className={styles.serviceCatalogue} aria-labelledby="service-catalogue-title"><div className={styles.sectionHeading}><div><Eyebrow icon="Layers3">WAYS WE CAN WORK TOGETHER</Eyebrow><h2 id="service-catalogue-title">A strong idea deserves<br /><span className="gradient-text">the right kind of care.</span></h2><p>Pick one lane, mix a few, or use these as a starting point for something new.</p></div><span className={styles.sectionCounter}>01 <i>/ 06</i></span></div><div className={styles.serviceOptions}>{serviceOptions.map((service, index) => { const Icon = service.icon; const active = selected.includes(service.id); return <button key={service.id} className={`${styles.serviceOption} ${styles[`service${service.tint[0].toUpperCase()}${service.tint.slice(1)}`]} ${active ? styles.serviceOptionActive : ""}`} onClick={() => toggleService(service.id)} aria-pressed={active}><span className={styles.serviceOptionIndex}>0{index + 1}</span><span className={styles.serviceOptionIcon}><Icon size={18} /></span><span className={styles.serviceOptionCategory}>{service.category}</span><b>{service.title}</b><p>{service.description}</p><span className={styles.serviceOptionOutcome}><Check size={12} />{service.outcome}</span><i className={styles.serviceCheck}>{active ? <Check size={13} /> : <span />}</i></button>; })}</div></section>

    <section id="planner" className={styles.projectPlanner}><div className={styles.plannerIntro}><span className={styles.plannerIcon}><Target size={18} /></span><Eyebrow icon="Sparkles">A LITTLE PROJECT PLANNER</Eyebrow><h2>Build a brief<br /><span className="gradient-text">that sounds like you.</span></h2><p>Choose the areas you want to explore. We’ll carry those choices into a pre-filled contact note so you can spend less time staring at a blank form.</p><div className={styles.plannerTrust}><span><ShieldCheckIcon /> No commitment</span><span><Users size={13} /> Made for a real conversation</span></div></div><div className={styles.plannerCard}><div className={styles.plannerCardTop}><span><i /> LIVE BRIEF PREVIEW</span><span>{String(chosen.length).padStart(2,"0")} SELECTED</span></div><div className={styles.selectedList}>{chosen.length ? chosen.map((service) => <span key={service.id}><Check size={11} />{service.title}</span>) : <small>Pick an area above to add it to your brief.</small>}</div><label className={styles.timelineLabel}>Preferred timing<span className={styles.timelineSelect}><select value={timeline} onChange={(event) => setTimeline(event.target.value)}><option>Flexible</option><option>Within a month</option><option>In the next 1–2 months</option><option>Just exploring</option></select><ChevronDown size={13} /></span></label><div className={styles.estimateBox}><span><Clock3Icon /></span><div><small>FIRST MILESTONE ESTIMATE</small><b>{estimate}</b></div><span className={styles.estimateSpark}><ActivityIcon /></span></div><div className={styles.plannerDisclaimer}>A directional guide only. We’ll confirm scope, availability, and milestones together.</div><Link className={styles.plannerSubmit} href={`/contact?brief=${brief}`}>Continue with this brief <ArrowRight size={15} /></Link></div></section>

    <section id="approach" className={styles.processSection}><div className={styles.sectionHeading}><div><Eyebrow icon="Compass">A HUMAN-SIZED PROCESS</Eyebrow><h2>From a first thought<br />to <span className="gradient-text">a real thing.</span></h2></div><p>Good collaboration should make the hard parts clearer, not add another layer of mystery.</p></div><div className={styles.processGrid}>{processSteps.map((step,index)=>{const Icon=step.icon;return <article key={step.title} className={styles.processCard}><span className={styles.processIndex}>0{index+1}</span><span className={styles.processIcon}><Icon size={17}/></span><h3>{step.title}</h3><p>{step.body}</p>{index<processSteps.length-1&&<ArrowRight className={styles.processArrow} size={15}/>}</article>;})}</div></section>

    <section className={styles.faqSection}><div className={styles.faqHeading}><Eyebrow icon="MessageCircle">A FEW GOOD QUESTIONS</Eyebrow><h2>Clarity is<br /><span className="gradient-text">part of the work.</span></h2><p>If your question isn’t here, bring it to the first conversation.</p><Link href="/contact" className={styles.inlineLink}>Ask me directly <ArrowUpRight size={13}/></Link></div><div className={styles.faqList}>{faqs.map((faq,index)=><article key={faq.question} className={`${styles.faqItem} ${openFaq===index?styles.faqItemOpen:""}`}><button onClick={()=>setOpenFaq(openFaq===index?null:index)} aria-expanded={openFaq===index}><span><i>0{index+1}</i>{faq.question}</span><ChevronDown size={15}/></button>{openFaq===index&&<p>{faq.answer}</p>}</article>)}</div></section>
  </main>;
}

function ShieldCheckIcon() { return <Check size={12} />; }
function Clock3Icon() { return <BookOpen size={15} />; }
function ActivityIcon() { return <ArrowUpRight size={15} />; }

const journey = [
  { id: "listen", step: "01", title: "Listen & learn", label: "START WITH PEOPLE", icon: MessageCircle, body: "Understand the context before reaching for a framework. Good questions can save days of building the wrong thing.", proof: "A shared problem statement and a short list of signals that success should improve." },
  { id: "shape", step: "02", title: "Make it tangible", label: "TURN IDEAS INTO SHAPE", icon: Layers3, body: "Map the simplest useful experience. Make trade-offs visible and keep the first milestone small enough to learn from.", proof: "A clear flow, an honest scope, and a plan the whole team can explain." },
  { id: "build", step: "03", title: "Build with care", label: "CRAFT IN SMALL STEPS", icon: Code2, body: "Write code that makes sense in six months, design for the people using it today, and keep the work reviewable.", proof: "A responsive, tested increment with thoughtful defaults and practical documentation." },
  { id: "share", step: "04", title: "Share & improve", label: "LEARN FROM THE LAUNCH", icon: Rocket, body: "A launch is the beginning of a conversation. Use real feedback to decide what deserves attention next.", proof: "A usable hand-off, clear next steps, and a product that can keep getting better." },
];

export function AboutPage() {
  const [activeStep, setActiveStep] = useState(0);
  const step = journey[activeStep];
  const ActiveIcon = step.icon;
  const totalProjects = projects.length;
  const totalCourses = courses.length;
  const totalArticles = articles.length;
  return <main className={`route-page wrap ${styles.richPage} ${styles.aboutPage}`}>
    <PageIntro eyebrow="A LITTLE MORE CONTEXT" icon="Sparkles" title="Build with purpose." accent="Learn out loud." description="A fuller look at the values, working style, and curiosity behind Coding With Bashir." action={<Link className="button button--outline" href="/services"><Layers3 size={14}/> Explore services <ArrowUpRight size={14}/></Link>} />
    <section className={styles.aboutHero}><div className={styles.aboutHeroCopy}><span className={styles.miniKicker}><MapPin size={13}/> KIGALI, RWANDA · GMT+2</span><h2>Curiosity is a good<br />place to <em>begin.</em></h2><p>I’m Bashir Hussein—a developer, builder, and lifelong learner interested in useful technology and the people it serves. I like making complex things feel more approachable, then sharing what I learn so someone else can start sooner.</p><div className={styles.aboutHeroLinks}><Link href="/projects">See selected work <ArrowRight size={13}/></Link><Link href="/contact">Start a conversation <ArrowUpRight size={13}/></Link></div></div><div className={styles.aboutOrbit}><div className={styles.orbitLine} /><div className={styles.orbitCore}><span>CW</span><i>β</i></div><span className={`${styles.orbitNode} ${styles.orbitNodeOne}`}><Code2 size={15}/></span><span className={`${styles.orbitNode} ${styles.orbitNodeTwo}`}><BookOpen size={15}/></span><span className={`${styles.orbitNode} ${styles.orbitNodeThree}`}><Sparkles size={15}/></span><span className={styles.orbitCaption}>BUILD · LEARN · SHARE</span></div></section>

    <section className={styles.aboutNumbers} aria-label="Portfolio at a glance"><div><span><BriefcaseBusiness size={15}/></span><b>{totalProjects.toString().padStart(2,"0")}</b><small>PROJECT EXPLORATIONS</small></div><div><span><BookOpen size={15}/></span><b>{totalCourses.toString().padStart(2,"0")}</b><small>LEARNING PATHS</small></div><div><span><FileText size={15}/></span><b>{totalArticles.toString().padStart(2,"0")}</b><small>JOURNAL NOTES</small></div><div><span><Award size={15}/></span><b>{skillGroups.reduce((sum,group)=>sum+group.skills.length,0).toString().padStart(2,"0")}</b><small>TOOLS IN THE TOOLKIT</small></div></section>

    <section className={styles.journeySection}><div className={styles.sectionHeading}><div><Eyebrow icon="Compass">HOW I LIKE TO WORK</Eyebrow><h2>Good work is a<br /><span className="gradient-text">series of good decisions.</span></h2></div><p>Pick a moment in the process to see what I focus on and what I try to leave behind.</p></div><div className={styles.journeyShell}><div className={styles.journeyRail} role="tablist" aria-label="Working approach">{journey.map((item,index)=>{const Icon=item.icon;return <button key={item.id} role="tab" aria-selected={activeStep===index} className={activeStep===index?styles.journeyActive:""} onClick={()=>setActiveStep(index)}><span>{item.step}</span><i><Icon size={14}/></i><b>{item.title}</b><small>{item.label}</small></button>;})}</div><div className={styles.journeyDetail} role="tabpanel"><span className={styles.journeyDetailIcon}><ActiveIcon size={20}/></span><span className={styles.miniKicker}>{step.label}</span><h3>{step.title}.</h3><p>{step.body}</p><div className={styles.journeyProof}><Check size={14}/><span><small>WHAT WE WANT TO LEAVE WITH</small><b>{step.proof}</b></span></div><div className={styles.journeyProgress}><span>{step.step} <i>/ 04</i></span><div><b style={{width:`${(activeStep+1)*25}%`}}/></div><button onClick={()=>setActiveStep((activeStep+1)%journey.length)}>Next <ArrowRight size={12}/></button></div></div></div></section>

    <section className={styles.aboutToolkit}><div><Eyebrow icon="Braces">A TOOLKIT, NOT A CHECKLIST</Eyebrow><h2>Use the right tool<br /><span className="gradient-text">for the right problem.</span></h2><p>These are familiar building blocks, not a promise to reach for every new thing. The work comes first; the stack follows.</p><Link href="/resources" className={styles.inlineLink}>Browse the learning library <ArrowUpRight size={13}/></Link></div><div className={styles.toolGroups}>{skillGroups.map((group,index)=><article key={group.name}><span>0{index+1}</span><div><b>{group.name}</b><small>{group.skills.join(" · ")}</small></div><ArrowDownRight size={14}/></article>)}</div></section>

    <section className={styles.aboutFinal}><span><Users size={17}/></span><div><b>Let’s make something useful.</b><small>Bring a question, a rough idea, or a product that needs a thoughtful next step.</small></div><Link href="/contact">Say hello <ArrowRight size={14}/></Link></section>
  </main>;
}

const resourceTracks = ["All paths", "Start building", "Go deeper", "Share your work"];
const resources = [
  { title: "Your first responsive page", kind: "Course", path: "Start building", description: "Learn the HTML and CSS essentials by shaping a page you can actually share.", href: "/learn/html-css", label: "18 lessons", icon: Code2, color: "violet" },
  { title: "JavaScript, one useful idea at a time", kind: "Course", path: "Start building", description: "Practice the language through small interactions, clear examples, and a tiny project.", href: "/learn/javascript", label: "24 lessons", icon: Braces, color: "amber" },
  { title: "From component to product", kind: "Course", path: "Go deeper", description: "Explore modern React and Next.js patterns by building a product-shaped experience.", href: "/learn/react-nextjs", label: "Intermediate", icon: Layers3, color: "cyan" },
  { title: "Build an API you can explain", kind: "Course", path: "Go deeper", description: "Practice request validation, data boundaries, and server-side problem solving.", href: "/learn/node-express", label: "26 lessons", icon: Database, color: "green" },
  { title: "A gentle guide to your first GitHub project", kind: "Journal", path: "Share your work", description: "A few practical steps for making a repository clear, friendly, and ready to share.", href: "/blog/getting-started-with-react", label: "6 min read", icon: FileText, color: "pink" },
  { title: "The portfolio project shelf", kind: "Project gallery", path: "Share your work", description: "Explore polished experiments, note their trade-offs, and borrow ideas for your own work.", href: "/projects", label: `${projects.length} examples`, icon: Rocket, color: "blue" },
  { title: "Make a milestone visible", kind: "Achievement", path: "Share your work", description: "Browse certificates and turn a completed learning sprint into a small celebration.", href: "/certificates", label: "Achievement board", icon: Award, color: "amber" },
  { title: "A calmer way to learn Python", kind: "Journal", path: "Start building", description: "A practical starting plan for getting comfortable with Python and small programs.", href: "/blog/learn-python-in-2025", label: "4 min read", icon: Code2, color: "cyan" },
];

export function ResourcesPage() {
  const [track, setTrack] = useState("All paths");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => resources.filter((resource) => (track === "All paths" || resource.path === track) && `${resource.title} ${resource.description} ${resource.kind}`.toLowerCase().includes(query.toLowerCase())), [track, query]);
  return <main className={`route-page wrap ${styles.richPage} ${styles.resourcesPage}`}>
    <PageIntro eyebrow="A PRACTICAL LEARNING LIBRARY" icon="Compass" title="Find a useful" accent="next step." description="Courses, project examples, journal notes, and milestones—collected into a calmer path through learning and building." action={<Link className="button button--primary" href="/courses"><BookOpen size={14}/> Browse every course <ArrowUpRight size={14}/></Link>} />
    <section className={styles.resourceHero}><div><span className={styles.miniKicker}><span/> LEARN A LITTLE, MAKE A LITTLE</span><h2>Less scrolling.<br /><em>More making.</em></h2><p>Pick a direction and start with one resource. You don’t need the perfect roadmap; you need a next step you can finish.</p></div><div className={styles.resourceHeroSide}><span className={styles.resourceHeroNumber}>01<span> / 08</span></span><span className={styles.resourceHeroGraphic}><Compass size={38}/><i/><b/></span><small>YOUR NEXT IDEA IS CLOSER THAN IT LOOKS</small></div></section>
    <div className={styles.resourceToolbar}><div className={styles.resourceFilters} role="tablist" aria-label="Filter learning resources">{resourceTracks.map((item)=><button key={item} role="tab" aria-selected={track===item} className={track===item?styles.resourceFilterActive:""} onClick={()=>setTrack(item)}>{item}</button>)}</div><label className={styles.resourceSearch}><Search size={14}/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search the library…" aria-label="Search resources"/><span>{filtered.length} found</span></label></div>
    <div className={styles.resourceGrid}>{filtered.map((resource,index)=>{const Icon=resource.icon;return <Link href={resource.href} key={resource.title} className={`${styles.resourceCard} ${styles[`resource${resource.color[0].toUpperCase()}${resource.color.slice(1)}`]}`}><div className={styles.resourceCardArt}><span className={styles.resourceCardNo}>0{index+1}</span><span><Icon size={22}/></span><i/><b/></div><div className={styles.resourceCardBody}><div className={styles.resourceMeta}><span>{resource.kind}</span><small>{resource.label}</small></div><h2>{resource.title}<ArrowUpRight size={14}/></h2><p>{resource.description}</p><span className={styles.resourceCardFoot}>Explore resource <ArrowRight size={13}/></span></div></Link>;})}</div>
    {!filtered.length&&<div className={styles.resourceEmpty}><Search size={18}/><b>No resource matches that search.</b><button onClick={()=>{setTrack("All paths");setQuery("")}}>Clear filters <ArrowRight size={12}/></button></div>}
    <section className={styles.resourceCallout}><span><Target size={17}/></span><div><b>Want a path shaped around your goal?</b><small>Build a short learning plan with the AI assistant, or choose a course and start today.</small></div><Link href="/assistant">Ask the assistant <ArrowRight size={13}/></Link></section>
  </main>;
}
