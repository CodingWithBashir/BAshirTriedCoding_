"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Check, Menu, Moon, Search, Sun, X } from "lucide-react";
import { LogoMark } from "@/components/ui";
import { useLearnerAuth } from "@/components/learner-auth";

const homeLinks = [
  ["Courses", "/courses"], ["My learning", "/dashboard"], ["Certificates", "/certificates"], ["Profile", "/profile"],
];
const appLinks = homeLinks;
const searchable = [
  { title: "Courses", detail: "Explore authored learning paths", href: "/courses" },
  { title: "My learning", detail: "View your saved progress", href: "/dashboard" },
  { title: "Certificates", detail: "See certificates you earned", href: "/certificates" },
  { title: "Profile", detail: "Manage your learner account", href: "/profile" },
];

export function SiteHeader() {
  const { user, signOut } = useLearnerAuth();
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
            <button className="icon-button theme-toggle" aria-label={light ? "Switch to dark theme" : "Switch to light theme"} title="Change appearance" onClick={toggleTheme}>{light ? <Moon size={16} /> : <Sun size={16} />}</button>
            {user ? <>
              <Link href="/dashboard" className="header-account" aria-label={`${user.name}'s learning dashboard`} onClick={() => setMobileOpen(false)}>
                <span className="header-avatar" aria-hidden="true">{user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span>
                <span className="header-account__name">{user.name.split(/\s+/)[0]}</span>
              </Link>
              <button className="header-signout" onClick={() => { void signOut().catch(() => undefined); setMobileOpen(false); }}>Sign out</button>
            </> : <Link href="/signup" className="header-signin" onClick={() => setMobileOpen(false)}>Get started</Link>}
            <button className="icon-button mobile-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen}>
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </header>

      {searchOpen && (
        <div className="search-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}>
          <div className="search-dialog" role="dialog" aria-modal="true" aria-labelledby="search-title">
            <div className="search-dialog__field"><Search size={18} /><input ref={searchRef} id="search-title" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search courses, progress, certificates…" /><kbd>ESC</kbd></div>
            <div className="search-dialog__meta">QUICK LINKS</div>
            <div className="search-results">
              {results.length ? results.map((item) => <Link key={item.href} href={item.href} className="search-result" onClick={() => setSearchOpen(false)}><span className="search-result__icon"><ArrowUpRight size={16} /></span><span><b>{item.title}</b><small>{item.detail}</small></span><ArrowUpRight className="search-result__go" size={14} /></Link>) : <div className="search-empty">No matches yet. Try “courses” or “certificates”.</div>}
            </div>
            <div className="search-dialog__foot"><span><Check size={13} /> Fast navigation</span><span>Use <kbd>⌘ K</kbd> anywhere</span></div>
          </div>
        </div>
      )}
    </>
  );
}
