import Link from "next/link";
import { ArrowUpRight, Heart } from "lucide-react";
import { LogoMark } from "@/components/ui";

export function SiteFooter() {
  return (
    <footer className="site-footer learning-site-footer">
      <div className="site-footer__main wrap">
        <div className="site-footer__brand">
          <Link className="brand" href="/" aria-label="Coding With Bashir Learning home"><LogoMark /><span className="brand__word">Coding With <b>Bashir</b></span></Link>
          <p>Learn with purpose.<br />Build with confidence.</p>
        </div>
        <div className="site-footer__links">
          <div><span className="footer-label">Learning</span><Link href="/courses">Course catalog</Link><Link href="/dashboard">My learning</Link><Link href="/certificates">Earned certificates</Link><Link href="/profile">Learner profile</Link></div>
          <div><span className="footer-label">Your account</span><Link href="/signup">Create an account <ArrowUpRight size={12} /></Link><Link href="/login">Sign in <ArrowUpRight size={12} /></Link><Link href="/admin">Learning Admin</Link></div>
        </div>
        <div className="site-footer__social"><span className="footer-label">Learning, at your pace</span><p className="footer-learning-note">Your progress belongs to your account. Certificates are awarded for completed courses.</p><Link href="/courses" className="footer-course-link">Find a course <ArrowUpRight size={13} /></Link></div>
      </div>
      <div className="site-footer__bottom wrap"><span>© {new Date().getFullYear()} Coding With Bashir Learning</span><span>Made for curious learners <Heart size={12} fill="currentColor" /></span><Link href="/courses">Keep learning <ArrowUpRight size={12} /></Link></div>
    </footer>
  );
}
