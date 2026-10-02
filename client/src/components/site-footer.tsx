import Link from "next/link";
import { ArrowUpRight, Github, Heart, Linkedin, Youtube } from "lucide-react";
import { LogoMark } from "@/components/ui";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__main wrap">
        <div className="site-footer__brand">
          <Link className="brand" href="/" aria-label="Coding With Bashir home"><LogoMark /><span className="brand__word">Coding With <b>Bashir</b></span></Link>
          <p>Build boldly. Learn out loud.<br />Make something that matters.</p>
        </div>
        <div className="site-footer__links">
          <div><span className="footer-label">Explore</span><Link href="/courses">Courses</Link><Link href="/projects">Projects</Link><Link href="/certificates">Certificates</Link></div>
          <div><span className="footer-label">Say hello</span><Link href="/blog">From the blog</Link><Link href="/contact">Contact Bashir <ArrowUpRight size={12} /></Link><a href="mailto:hello@codingwithbashir.dev">Email me <ArrowUpRight size={12} /></a></div>
        </div>
        <div className="site-footer__social"><span className="footer-label">Around the web</span><div className="social-links"><a href="https://github.com/CodingWithBashir" target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={16} /></a><a href="https://youtube.com/@CodingWithBashir" target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube size={16} /></a><a href="https://linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={16} /></a></div><span className="availability"><i /> Available for thoughtful projects</span></div>
      </div>
      <div className="site-footer__bottom wrap"><span>© {new Date().getFullYear()} Coding With Bashir · Kigali, Rwanda</span><span>Made with <Heart size={12} fill="currentColor" /> and a little curiosity.</span><Link href="/contact">Let’s build something <ArrowUpRight size={12} /></Link></div>
    </footer>
  );
}
