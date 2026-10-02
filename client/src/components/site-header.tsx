"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Check, Menu, Moon, Search, Sun, X } from "lucide-react";
import { LogoMark } from "@/components/ui";

const homeLinks = [
  ["Home", "/#home"], ["About", "/#about"], ["Services", "/#what-i-do"],
  ["Projects", "/#projects"], ["Skills", "/#skills"], ["Blog", "/#blog"], ["Contact", "/contact"],
];
const appLinks = [
  ["Home", "/"], ["About", "/about"], ["Services", "/services"],
  ["Resources", "/resources"], ["Courses", "/courses"], ["Projects", "/projects"],
  ["Certificates", "/certificates"], ["Blog", "/blog"], ["Contact", "/contact"],
];
const searchable = [
  { title: "Home", detail: "Meet Bashir", href: "/" },
  { title: "About", detail: "Values, approach, and toolkit", href: "/about" },
  { title: "Services", detail: "Explore a scope and plan a project", href: "/services" },
  { title: "Learning resources", detail: "Search courses, notes, and examples", href: "/resources" },
  { title: "Creator studio", detail: "Private portfolio administration", href: "/admin" },
  { title: "Courses", detail: "Explore learning paths", href: "/courses" },
  { title: "Certificates", detail: "View achievements", href: "/certificates" },
  { title: "Projects", detail: "Selected work", href: "/projects" },
  { title: "Blog & articles", detail: "Notes from the journey", href: "/blog" },
  { title: "Learning dashboard", detail: "Pick up where you left off", href: "/dashboard" },
  { title: "AI learning assistant", detail: "Get a thoughtful explanation", href: "/assistant" },
  { title: "Get in touch", detail: "Start a conversation", href: "/contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [light, setLight] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const links = isHome ? homeLinks : appLinks;
  const results = searchable.filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
      if (event.key === "Escape") { setSearchOpen(false); setMobileOpen(false); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function toggleTheme() {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
  }

  return (
    <>
      <header className="site-header">
        <div className="header-inner wrap">
          <Link className="brand" href="/" aria-label="Coding With Bashir home" onClick={() => setMobileOpen(false)}>
            <LogoMark />
            <span className="brand__word">Coding With <b>Bashir</b></span>
          </Link>

          <nav className={`main-nav${mobileOpen ? " main-nav--open" : ""}`} aria-label="Main navigation">
            {links.map(([label, href]) => {
              const target = href.startsWith("/#") ? href.slice(2) : href;
              const active = isHome
                ? href === "/#home" && pathname === "/"
                : href === "/" ? false : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={label}
                  className={`nav-link${active ? " nav-link--active" : ""}`}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="header-actions">
            <button className="icon-button header-search" aria-label="Search the site" title="Search (⌘K)" onClick={() => setSearchOpen(true)}><Search size={17} /></button>
            <a className="icon-button header-github" aria-label="Bashir on GitHub" href="https://github.com/CodingWithBashir" target="_blank" rel="noreferrer"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.15.68-3.82-1.34-3.82-1.34-.51-1.31-1.26-1.66-1.26-1.66-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.02 1.74 2.67 1.24 3.32.95.1-.74.4-1.24.73-1.53-2.51-.29-5.15-1.26-5.15-5.58 0-1.24.44-2.24 1.17-3.03-.12-.29-.51-1.44.11-2.99 0 0 .95-.3 3.09 1.16a10.72 10.72 0 0 1 5.63 0c2.15-1.46 3.08-1.16 3.08-1.16.62 1.55.23 2.7.12 2.99.73.79 1.16 1.79 1.16 3.03 0 4.33-2.64 5.28-5.16 5.57.41.36.77 1.04.77 2.1v3.11c0 .3.2.65.77.54A11.25 11.25 0 0 0 12 .75Z" /></svg></a>
            <button className="icon-button theme-toggle" aria-label={light ? "Switch to dark theme" : "Switch to light theme"} title="Change appearance" onClick={toggleTheme}>{light ? <Moon size={16} /> : <Sun size={16} />}</button>
            <Link href="/profile" className="header-avatar" aria-label="View Bashir's profile">
              <Image src="/images/developer-hero.png" alt="Bashir" fill sizes="36px" unoptimized />
            </Link>
            <button className="icon-button mobile-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen}>
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </header>

      {searchOpen && (
        <div className="search-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}>
          <div className="search-dialog" role="dialog" aria-modal="true" aria-labelledby="search-title">
            <div className="search-dialog__field"><Search size={18} /><input ref={searchRef} id="search-title" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search courses, projects, articles…" /><kbd>ESC</kbd></div>
            <div className="search-dialog__meta">QUICK LINKS</div>
            <div className="search-results">
              {results.length ? results.map((item) => <Link key={item.href} href={item.href} className="search-result" onClick={() => setSearchOpen(false)}><span className="search-result__icon"><ArrowUpRight size={16} /></span><span><b>{item.title}</b><small>{item.detail}</small></span><ArrowUpRight className="search-result__go" size={14} /></Link>) : <div className="search-empty">No matches yet. Try “courses” or “projects”.</div>}
            </div>
            <div className="search-dialog__foot"><span><Check size={13} /> Fast navigation</span><span>Use <kbd>⌘ K</kbd> anywhere</span></div>
          </div>
        </div>
      )}
    </>
  );
}
