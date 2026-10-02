import { ArrowUpRight, Award, Check, Code2, FileText, Play, Sparkles } from "lucide-react";
import { Icon } from "@/components/ui";

export function ProjectPreview({ variant = "classroom", name = "Project preview" }: { variant?: string; name?: string }) {
  return (
    <div className={`project-visual project-visual--${variant}`} aria-label={`${name} interface preview`} role="img">
      <div className="preview-orbit preview-orbit--one" /><div className="preview-orbit preview-orbit--two" />
      <div className="preview-window">
        <div className="preview-window__bar"><span className="window-dots"><i /><i /><i /></span><span className="preview-address"><span /> {name.toLowerCase().replaceAll(" ", "-")}.app</span><span className="preview-window__more">···</span></div>
        <div className="preview-body">
          <div className="preview-sidebar"><span className="preview-logo"><Code2 size={12} /></span><i /><i /><i /><i /><i /></div>
          <div className="preview-content">
            <div className="preview-welcome"><span className="preview-welcome__label">YOUR CREATIVE SPACE</span><b>{variant === "studio" ? "Make something remarkable." : variant === "assistant" ? "A better way to learn." : variant === "chat" ? "Good to see you again." : "A little progress every day."}</b><span className="preview-subline" /></div>
            <div className="preview-mini-row"><span className="preview-tile preview-tile--a"><i /><b /><small /></span><span className="preview-tile preview-tile--b"><i /><b /><small /></span><span className="preview-tile preview-tile--c"><i /><b /><small /></span></div>
            <div className="preview-detail-row"><span className="preview-lines"><i /><i /><i /><i /></span><span className="preview-graph"><i /><i /><i /><i /><i /><i /><i /></span></div>
          </div>
        </div>
      </div>
      <span className="preview-float preview-float--one"><Sparkles size={12} /> Made with care</span>
      <span className="preview-float preview-float--two"><span className="preview-live-dot" /> All systems ready</span>
    </div>
  );
}

export function ArticleArtwork({ variant = "react" }: { variant?: string }) {
  return (
    <div className={`article-art article-art--${variant}`} aria-hidden="true">
      <div className="article-art__sun" /><div className="article-art__grid" />
      <div className="article-art__code"><span><i /><i /><i /></span><em /><em /><em /><em /><em /></div>
      <div className="article-art__object"><b>{variant === "react" ? "⚛" : variant === "python" ? "Py" : variant === "tools" ? "✳" : variant === "journey" ? "✦" : "↗"}</b></div>
      <span className="article-art__caption">{variant === "react" ? "A new way to build" : variant === "python" ? "Curiosity in code" : variant === "tools" ? "A better toolkit" : variant === "journey" ? "Keep showing up" : "Made for every screen"}</span>
    </div>
  );
}

export function CertificateArt({ title, color = "blue", compact = false }: { title: string; color?: string; compact?: boolean }) {
  return (
    <div className={`certificate-art certificate-art--${color}${compact ? " certificate-art--compact" : ""}`} aria-label={`Certificate preview: ${title}`} role="img">
      <div className="certificate-art__corner certificate-art__corner--tl" /><div className="certificate-art__corner certificate-art__corner--br" />
      <div className="certificate-art__inside">
        <span className="certificate-art__brand"><span className="certificate-art__mark">CWβ</span><small>CODING WITH BASHIR</small></span>
        <span className="certificate-art__rule" />
        <small className="certificate-art__overline">CERTIFICATE OF COMPLETION</small>
        <span className="certificate-art__text">This certifies that</span>
        <b className="certificate-art__name">Bashir Hussein</b>
        <span className="certificate-art__text">has successfully completed</span>
        <b className="certificate-art__course">{title}</b>
        <span className="certificate-art__rule certificate-art__rule--short" />
        <span className="certificate-art__sign-row"><i>Bashir Hussein<small>INSTRUCTOR</small></i><b><Award size={compact ? 17 : 23} /></b><i>May 20, 2025<small>DATE ISSUED</small></i></span>
      </div>
      <span className="certificate-art__seal"><Check size={compact ? 11 : 14} /></span>
    </div>
  );
}

export function CourseArtwork({ icon, color, title }: { icon: string; color: string; title: string }) {
  return (
    <div className={`course-art course-art--${color}`} aria-hidden="true">
      <span className="course-art__grid" />
      <span className="course-art__icon"><Icon name={icon} size={27} /></span>
      <span className="course-art__orbit course-art__orbit--one" /><span className="course-art__orbit course-art__orbit--two" />
      <span className="course-art__caption">{title}<small>LEARN BY MAKING</small></span>
      <span className="course-art__play"><Play size={12} fill="currentColor" /></span>
    </div>
  );
}

export function TinyLabel({ children }: { children: React.ReactNode }) {
  return <span className="tiny-label"><FileText size={11} />{children}<ArrowUpRight size={10} /></span>;
}
