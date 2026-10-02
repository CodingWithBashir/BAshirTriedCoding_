"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Award, BadgeCheck, BookOpen, Check, Clock3,
  Copy, Download, DownloadCloud, FileCheck2, LockKeyhole, Share2, Sparkles,
} from "lucide-react";
import { articles } from "@/lib/data";
import { usePortfolioCollection } from "@/lib/use-portfolio-collection";
import { useLearnerAuth, type EarnedCertificate } from "@/components/learner-auth";
import { ButtonLink, Eyebrow } from "@/components/ui";
import { ArticleArtwork, CertificateArt } from "@/components/visuals";

type ArticleContent = { intro: string; sections: Array<{ title: string; body: string[]; code?: string }> };

const articleSections: Record<string, ArticleContent> = {
  "getting-started-with-react": { intro: "The first time I opened a React project, I remember thinking there was a lot to take in. Then I learned to think in small pieces. A component is just a little part of the page you can understand, reuse, and make better.", sections: [{ title: "Start with one component", body: ["React is a JavaScript library for building interfaces out of components. A component can be a button, a card, a navigation bar — or an entire page made from smaller pieces.", "Instead of asking ‘How do I build this whole page?’, ask ‘What’s one small piece I can build first?’ That shift makes the whole process feel a lot lighter."] , code: "function Welcome() {\n  return <h1>It starts right here.</h1>;\n}" }, { title: "Give components a little data", body: ["Props let you pass information from one component to another. With props, one reusable card can show different titles, different images, and different ideas without repeating itself."] , code: "function ProjectCard({ title }) {\n  return <article>{title}</article>;\n}" }, { title: "Make one thing you care about", body: ["Follow a tutorial, then close it for a while and try the idea your own way. Build a small personal page, a favourite recipe list, or a learning tracker. The goal isn't perfection — it’s making something that belongs to you."] }] },
  "deploying-full-stack-app-render": { intro: "There is something special about sharing a link to something you made and watching it open on someone else’s screen. Deployment turns your local experiment into a real, reachable thing.", sections: [{ title: "Prepare before you deploy", body: ["Make sure your app builds locally and move secrets into environment variables. A .env file should stay on your machine; production platforms give you a secure place to add each key separately.", "I like to write down the app’s start command and the environment variables it needs before opening the hosting dashboard."] }, { title: "Connect your repository", body: ["Render can build from a Git repository and redeploy when you push. Keep the build and start commands clear, and remember that a full-stack project may need a separate frontend, API, and database service."] , code: "Build command   npm install && npm run build\nStart command   npm start\nEnvironment     Add secrets in the dashboard" }, { title: "Open the link, then look closely", body: ["After it is live, click through the real deployed version on your phone and laptop. Check the form, check the API, and check the console. Each deploy teaches you something about how the pieces fit together."] }] },
  "free-tools-for-developers": { intro: "A good toolbox does not have to be expensive. A few generous free plans — and a habit of using tools thoughtfully — go a long way when you are just getting started.", sections: [{ title: "Make a little room for design", body: ["Figma’s free plan is a lovely place to sketch an idea before writing code. A few rectangles and a type scale can save you a lot of uncertainty once you get to the browser."] }, { title: "Build with a friendly setup", body: ["VS Code has a strong free extension library. GitHub gives you a home for your code. Browser developer tools make layout, colours, network requests, and accessibility much easier to inspect."] }, { title: "Choose what fits the project", body: ["Free tiers change and a tool that is right for one app may not be right for another. Read the limits, keep backups, and resist signing up for every shiny thing at once. The simplest useful setup is often the best one."] }] },
  "building-responsive-web-apps": { intro: "A responsive interface is not a desktop page squeezed onto a small screen. It is the same thoughtful experience reshaped for a different set of hands, habits, and space.", sections: [{ title: "Let content lead", body: ["Start with the smallest screen and ask what a person actually needs first. Let that determine the order. A page that reads clearly in one column is much easier to adapt upward than a maze of tiny desktop columns."] }, { title: "Use flexible building blocks", body: ["Grid, flexbox, minmax, and clamped type sizes make helpful friends. Give text room, keep touch targets comfortable, and let cards move from four columns to two to one without a fight."] , code: "grid-template-columns: repeat(\n  auto-fit, minmax(220px, 1fr)\n);" }, { title: "Test the real thing", body: ["Resize a browser, use the device emulator, and if you can, check on a phone. Watch for awkward line breaks, horizontal scroll, and buttons that are a little hard to reach."] }] },
  "learn-python-in-2025": { intro: "Python is a nice language to begin with because it gives your ideas room to breathe. You do not need a grand plan. A little practice and a project you care about will take you further than you think.", sections: [{ title: "Learn the building blocks", body: ["Start with values, variables, conditions, loops, and functions. Write a short script that asks a question, prints something helpful, or organises a list. Tiny programs count."] }, { title: "Practice by making", body: ["Build a simple budget tracker, an interactive quiz, or a script that organises your notes. Breaking a bigger idea into small steps is one of the most useful programming skills you can develop."] }, { title: "Be kind to your future self", body: ["Read your code back out loud. Use names that tell you what a value means. When something breaks, slow down and read the error; it is often trying to help."] }] },
  "my-journey-young-developer": { intro: "I started coding because I wanted to understand how things worked. I stayed because I realised the internet was full of little tools, ideas, and communities I could help bring to life.", sections: [{ title: "Let curiosity be a good enough reason", body: ["The first version of an idea is rarely polished. It does not have to be. Each small attempt made the next one less mysterious: a page, a button, a form, a first API that actually responded."] }, { title: "Build in public, at your own pace", body: ["Sharing a project before it feels finished can be a vulnerable thing. But it also makes room for feedback, new friends, and somebody else who needed to see that they could start too."] }, { title: "Keep making room to learn", body: ["I still have so much to discover. That is the part I love most: I can wake up curious, spend the day building, and find something new to carry with me tomorrow."] }] },
};

export function BlogArticlePage() {
  const params = useParams<{ slug: string }>();
  const { items: liveArticles } = usePortfolioCollection("articles", articles);
  const article = liveArticles.find((item) => item.slug === params.slug);
  if (!article) return <NotFound kind="article" />;
  const authoredParagraphs = article.body?.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean) ?? [];
  const content: ArticleContent = article.body?.trim()
    ? { intro: article.excerpt, sections: authoredParagraphs.map((paragraph, index) => ({ title: `Notebook point ${index + 1}`, body: [paragraph] })) }
    : articleSections[article.slug] ?? {
    intro: article.excerpt,
    sections: [
      { title: "The idea", body: [article.excerpt, "Start with the smallest question you can answer. A clear first step makes a new concept easier to understand, test, and improve."] },
      { title: "Try it for yourself", body: ["Turn the idea into a small experiment. Write down what you expected, what you observed, and what you would change on the next pass."] },
      { title: "Carry the lesson forward", body: ["A useful lesson is one you can apply again. Keep the notes close, share what worked, and let the next project build on this one."] },
    ],
  };

  return (
    <main className="route-page wrap article-route"><Link className="breadcrumb-back" href="/blog"><ArrowLeft size={13} /> Back to the notebook <span>/</span> <span>{article.category}</span></Link><section className="article-hero"><ArticleArtwork variant={article.variant} /><div className="article-hero__overlay" /><div className="article-hero__copy"><div className="article-meta"><span>{article.category}</span><span>{article.date}</span><span><Clock3 size={12} />{article.readTime}</span></div><h1>{article.title}</h1><p>{article.excerpt}</p><div className="article-byline"><span className="byline-avatar">BH</span><span><b>Bashir Hussein</b><small>Builder, learner & note taker</small></span></div></div><span className="article-hero__spark"><Sparkles size={16} /></span></section>
      <div className="article-reading"><article className="article-body"><p className="article-lead">{content.intro}</p><div className="article-body__rule"><span /><i>✳</i><span /></div>{content.sections.map((section, index) => <section key={section.title} id={`section-${index + 1}`}><h2><span>{String(index + 1).padStart(2, "0")}</span>{section.title}</h2>{section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.code && <pre><span>THE SHORT VERSION</span><code>{section.code}</code></pre>}</section>)}<aside className="article-takeaway"><Sparkles size={18} /><span><b>A thought to carry with you</b><small>You do not have to know everything before you begin. Start with the next small, useful thing.</small></span></aside><div className="article-tags"><span>IN THIS NOTE</span><span>Build in public</span><span>Keep learning</span><span>Made with care</span></div><div className="article-author"><span className="article-author__avatar">BH</span><span><b>Written by Bashir</b><small>Developer, builder, and forever curious.</small></span><Link href="/about">A little more about Bashir <ArrowUpRight size={13} /></Link></div></article><aside className="article-sidebar"><div className="article-toc"><span>IN THIS ARTICLE</span>{content.sections.map((section, index) => <a key={section.title} href={`#section-${index + 1}`}><i>{String(index + 1).padStart(2, "0")}</i>{section.title}</a>)}</div><div className="article-aside-card"><span><Sparkles size={16} /></span><b>Enjoyed this note?</b><p>There’s always another idea just around the corner.</p><Link href="/blog">Explore the journal <ArrowRight size={13} /></Link></div><div className="article-share"><span>A GOOD NOTE IS BETTER SHARED.</span><button onClick={() => shareCurrentPage()}><Share2 size={13} /> Copy article link</button></div></aside></div><div className="article-next"><Link href="/blog"><ArrowLeft size={14} /> All notes</Link><Link href="/contact">Have a question? <ArrowRight size={14} /></Link></div>
    </main>
  );
}

export function CertificateDetailPage() {
  const params = useParams<{ slug: string }>();
  const { certificates: earnedCertificates, user } = useLearnerAuth();
  const certificate = earnedCertificates.find((item) => item.id === params.slug || item.certificateNumber === params.slug);
  const [copied, setCopied] = useState(false);
  if (!certificate) return <NotFound kind="certificate" />;
  const certificateNumber = certificate.certificateNumber;

  function share() {
    if (typeof window !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(`${window.location.origin}/verify/${encodeURIComponent(certificateNumber)}`).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1800); }).catch(() => {});
  }
  function printCertificate() { if (typeof window !== "undefined") window.print(); }
  const issued = new Date(certificate.issuedAt);
  const issuedLabel = Number.isNaN(issued.getTime()) ? "—" : issued.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  return (
    <main className="route-page wrap certificate-detail"><Link className="breadcrumb-back" href="/certificates"><ArrowLeft size={13} /> My certificates <span>/</span> <span>Certificate details</span></Link><div className="certificate-detail__heading"><Eyebrow icon="Award">A MILESTONE WORTH KEEPING</Eyebrow><h1>Your work.<br /><span className="gradient-text">Your achievement.</span></h1><p>This certificate was awarded to your account when you completed every lesson in the course.</p></div><div className="certificate-detail__layout"><div className="certificate-detail__preview"><CertificateArt title={certificate.courseTitle} recipient={certificate.recipientName || user?.name || "Learner"} issued={issuedLabel} color="blue" /><span className="certificate-detail__secure"><LockKeyhole size={12} /> ACCOUNT-VERIFIED ACHIEVEMENT</span><span className="certificate-detail__shine" /></div><section className="certificate-info"><span className="cert-type cert-type--blue">COURSE COMPLETION</span><h2>{certificate.courseTitle}</h2><p>Completed the full learning path and all {certificate.lessonCount} lessons. This award is recorded in your learner account.</p><div className="certificate-info__verified"><span><BadgeCheck size={19} /></span><span><b>Genuine course completion</b><small>Awarded by Coding With Bashir Learning</small></span><Check size={15} /></div><div className="certificate-info__details"><div><span>RECIPIENT</span><b>{certificate.recipientName || user?.name}</b></div><div><span>DATE EARNED</span><b>{issuedLabel}</b></div><div><span>CERTIFICATE ID</span><b>{certificate.certificateNumber}</b></div><div><span>STATUS</span><b>Course completed</b></div></div><div className="certificate-info__actions"><button className="button button--primary" onClick={printCertificate}><Download size={15} /> Download as PDF</button><button className="button button--outline" onClick={share}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Link copied" : "Share certificate"}</button></div><p className="certificate-info__print-hint"><FileCheck2 size={12} /> Use your browser’s “Save as PDF” option to keep a printable copy.</p></section></div><div className="certificate-detail__foot"><span><Sparkles size={14} />LEARN SOMETHING NEW EVERY DAY</span><Link href="/courses">Find your next course <ArrowRight size={13} /></Link></div></main>
  );
}


export function CertificateVerificationPage() {
  const params = useParams<{ number: string }>();
  const certificateNumber = params.number;
  const [certificate, setCertificate] = useState<Omit<EarnedCertificate, "id"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/verify/certificates/${encodeURIComponent(certificateNumber)}`, { headers: { accept: "application/json" }, cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "This certificate could not be verified.");
        if (active) setCertificate(payload.item);
      })
      .catch(() => { if (active) setCertificate(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [certificateNumber]);

  if (loading) return <main className="route-page wrap detail-not-found"><span className="detail-not-found__icon"><Award size={21} /></span><Eyebrow>CHECKING CERTIFICATE</Eyebrow><h1>Verifying this achievement…</h1><p>Looking up the award record.</p></main>;
  if (!certificate) return <main className="route-page wrap detail-not-found"><span className="detail-not-found__icon"><Award size={21} /></span><Eyebrow>CERTIFICATE NOT FOUND</Eyebrow><h1>We couldn’t verify that number.</h1><p>Check the certificate ID and try again. Only certificates awarded after completing a course can be verified.</p><ButtonLink href="/courses" icon="ArrowLeft" variant="outline">Explore courses</ButtonLink></main>;

  const issued = new Date(certificate.issuedAt);
  const issuedLabel = Number.isNaN(issued.getTime()) ? "—" : issued.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  function share() {
    if (typeof window !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(window.location.href).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1800); }).catch(() => {});
  }
  return (
    <main className="route-page wrap certificate-detail"><Link className="breadcrumb-back" href="/courses"><ArrowLeft size={13} /> Browse courses <span>/</span> <span>Certificate verification</span></Link><div className="certificate-detail__heading"><Eyebrow icon="BadgeCheck">VERIFIED COURSE ACHIEVEMENT</Eyebrow><h1>A real milestone.<br /><span className="gradient-text">Genuinely earned.</span></h1><p>This award is recorded in the Coding With Bashir learner platform.</p></div><div className="certificate-detail__layout"><div className="certificate-detail__preview"><CertificateArt title={certificate.courseTitle} recipient={certificate.recipientName} issued={issuedLabel} color="blue" /><span className="certificate-detail__secure"><BadgeCheck size={12} /> VERIFIED AWARD</span><span className="certificate-detail__shine" /></div><section className="certificate-info"><span className="cert-type cert-type--blue">VERIFIED COURSE COMPLETION</span><h2>{certificate.courseTitle}</h2><p>{certificate.recipientName} completed all {certificate.lessonCount} lessons in this course.</p><div className="certificate-info__verified"><span><BadgeCheck size={19} /></span><span><b>Certificate record confirmed</b><small>Issued by Coding With Bashir Learning</small></span><Check size={15} /></div><div className="certificate-info__details"><div><span>RECIPIENT</span><b>{certificate.recipientName}</b></div><div><span>DATE EARNED</span><b>{issuedLabel}</b></div><div><span>CERTIFICATE ID</span><b>{certificate.certificateNumber}</b></div><div><span>STATUS</span><b>Verified</b></div></div><div className="certificate-info__actions"><button className="button button--primary" onClick={share}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Link copied" : "Copy verification link"}</button><ButtonLink href="/courses" variant="outline" icon="ArrowRight">Explore courses</ButtonLink></div><p className="certificate-info__print-hint"><LockKeyhole size={12} /> This public page shows only the certificate details needed to verify the award.</p></section></div><div className="certificate-detail__foot"><span><BadgeCheck size={14} />AWARDED AFTER COURSE COMPLETION</span><Link href="/signup">Start learning <ArrowRight size={13} /></Link></div></main>
  );
}

function NotFound({ kind }: { kind: "article" | "certificate" }) {
  const isArticle = kind === "article";
  return <main className="route-page wrap detail-not-found"><span className="detail-not-found__icon">{isArticle ? <BookOpen size={21} /> : <Award size={21} />}</span><Eyebrow>NOT FOUND IN THE NOTEBOOK</Eyebrow><h1>This {kind} wandered off.</h1><p>Let’s head back and find another one to explore.</p><ButtonLink href={isArticle ? "/blog" : "/certificates"} icon="ArrowLeft" variant="outline">Go back</ButtonLink></main>;
}
function shareCurrentPage() { if (typeof window !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(window.location.href).catch(() => {}); }
