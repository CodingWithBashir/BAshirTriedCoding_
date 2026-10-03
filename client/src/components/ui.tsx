import Link from "next/link";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Atom, BrainCircuit, Braces, BriefcaseBusiness,
  Code2, CodeXml, Compass, Cpu, Database, Gamepad2, Github, Layers3, Leaf, Mail, MonitorPlay,
  Award, BookOpen, Blocks, GraduationCap, MapPin, PanelsTopLeft, Palette, Plug, Sparkles, Terminal, UserRound, Webhook, type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  ArrowDownRight, ArrowRight, ArrowUpRight, Atom, BrainCircuit, Braces, BriefcaseBusiness,
  Code2, CodeXml, Compass, Cpu, Database, Gamepad2, Github, Layers3, Leaf, Mail, MonitorPlay,
  Award, BookOpen, Blocks, GraduationCap, MapPin, PanelsTopLeft, Palette, Plug, Sparkles, Terminal, UserRound, Webhook,
};

export function Icon({ name, size = 20, ...props }: { name: string; size?: number; className?: string }) {
  const Component = iconMap[name] ?? Code2;
  return <Component size={size} strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function LogoMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`logo-mark${small ? " logo-mark--small" : ""}`} aria-hidden="true">
      <span>CW</span><i>β</i>
    </span>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  icon,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline" | "quiet";
  icon?: string;
  className?: string;
}) {
  return (
    <Link className={`button button--${variant} ${className}`} href={href}>
      <span>{children}</span>{icon && <Icon name={icon} size={15} />}
    </Link>
  );
}

export function Eyebrow({ children, icon }: { children: React.ReactNode; icon?: string }) {
  return <span className="eyebrow">{icon && <Icon name={icon} size={13} />}{children}</span>;
}

export function SectionHeading({
  kicker,
  title,
  accent,
  copy,
  link,
  linkLabel,
  id,
  align = "split",
}: {
  kicker: string;
  title: string;
  accent?: string;
  copy?: string;
  link?: string;
  linkLabel?: string;
  id?: string;
  align?: "split" | "center" | "left";
}) {
  return (
    <div className={`section-heading section-heading--${align}`} id={id}>
      <div className="section-heading__copy">
        <Eyebrow>{kicker}</Eyebrow>
        <h2>{title}{accent && <> <span className="gradient-text">{accent}</span></>}</h2>
        {copy && <p>{copy}</p>}
      </div>
      {link && <ButtonLink href={link} variant="quiet" icon="ArrowUpRight">{linkLabel ?? "Explore more"}</ButtonLink>}
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  accent,
  description,
  icon = "Sparkles",
  action,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  description: string;
  icon?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        <Eyebrow icon={icon}>{eyebrow}</Eyebrow>
        <h1>{title}{accent && <> <span className="gradient-text">{accent}</span></>}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="page-intro__action">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value, color = "violet" }: { value: number; color?: string }) {
  return (
    <div className={`progress progress--${color}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}
