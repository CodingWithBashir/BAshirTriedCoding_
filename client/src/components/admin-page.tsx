"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Archive, Award,
  BarChart3, Bell, BookOpen, BriefcaseBusiness, Check, CheckCircle2, ChevronDown,
  CircleHelp, Clock3, Code2, FileText, Filter, KeyRound, Layers3, LockKeyhole,
  LogOut, Mail, MessageSquareText, MoreHorizontal, Plus, RefreshCw, Search,
  Settings2, Shield, ShieldCheck, Sparkles, UserPlus, Users, X,
} from "lucide-react";
import { LogoMark } from "@/components/ui";
import styles from "./admin-page.module.css";

type Role = "owner" | "admin" | "editor" | "support" | "viewer";
type AdminTab = "overview" | "content" | "messages" | "team" | "activity";
type Collection = "projects" | "courses" | "certificates" | "articles" | "testimonials";
type AdminUser = { id: string; name: string; email: string; role: Role; active: boolean; createdBy: string; lastLoginAt?: string | null };
type ContentItem = Record<string, unknown> & { id?: string; slug?: string; name?: string; title?: string; createdAt?: string };
type ContactMessage = { id: string; name: string; email: string; subject: string; message: string; status: "new" | "read" | "replied" | "archived"; createdAt: string };
type AuditEvent = { id: string; actorEmail: string; action: string; entity: string; summary: string; createdAt: string };
type Overview = {
  counts: Record<string, number>;
  messageCounts: Record<string, number> | null;
  inboxAvailable: boolean;
  activityAvailable: boolean;
  dailyActivity: Array<{ date: string; label: string; count: number }>;
  recentMessages: ContactMessage[];
  recentActivity: AuditEvent[];
};
type SessionPayload = { configured: boolean; setupRequired: boolean; authenticated: boolean; user: AdminUser | null };
type FieldSpec = { key: string; label: string; kind?: "textarea" | "number" | "checkbox"; hint?: string };
type EditorState = { collection: Collection; key: string | null; values: Record<string, string | boolean> };

const collections: Array<{ id: Collection; label: string; icon: typeof BriefcaseBusiness }> = [
  { id: "courses", label: "Courses", icon: BookOpen },
];

const roleInfo: Record<Role, { label: string; description: string }> = {
  owner: { label: "Owner", description: "Full access to learning-course management, team roles, and account settings." },
  admin: { label: "Administrator", description: "Manage authored learning courses and the contact inbox." },
  editor: { label: "Editor", description: "Create, update, and remove published learning courses." },
  support: { label: "Support", description: "Read and triage contact messages without editing content." },
  viewer: { label: "Viewer", description: "Read dashboard and content data without making changes." },
};

const fields: Record<Collection, FieldSpec[]> = {
  projects: [],
  courses: [
    { key: "title", label: "Course title" }, { key: "slug", label: "URL slug", hint: "lowercase-words-with-hyphens" },
    { key: "category", label: "Category" }, { key: "level", label: "Level" },
    { key: "duration", label: "Estimated duration" }, { key: "icon", label: "Vector icon name", hint: "A vector icon: Code2, Braces, Atom, BrainCircuit, BookOpen, or GraduationCap." },
    { key: "color", label: "Accent color" }, { key: "description", label: "Course description", kind: "textarea" },
    { key: "curriculum", label: "Authored lesson curriculum", kind: "textarea", hint: "Each lesson block: first line is its title; add substantive lesson content below. Separate lessons with --- on a line by itself. 1–120 lessons; at least 20 characters of content each." },
  ],
  certificates: [], articles: [], testimonials: [],
};

const navigation: Array<{ id: AdminTab; label: string; icon: typeof Activity }> = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "content", label: "Course management", icon: Layers3 },
  { id: "messages", label: "Inbox", icon: Mail },
  { id: "team", label: "Team & roles", icon: Users },
  { id: "activity", label: "Audit trail", icon: ShieldCheck },
];

async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/admin${path}`, {
    ...init,
    credentials: "same-origin",
    headers: { accept: "application/json", ...(init.body ? { "content-type": "application/json" } : {}), ...init.headers },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status}).`);
  return payload as T;
}

function itemTitle(item: ContentItem) {
  return String(item.title || item.name || item.slug || "Untitled item");
}

function initials(name: string) {
  return name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "CW";
}

function timeAgo(value?: string | null, fallback = "No activity recorded") {
  if (!value) return fallback;
  const difference = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(difference / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function toEditorValues(collection: Collection, item?: ContentItem): Record<string, string | boolean> {
  return Object.fromEntries(fields[collection].map((field) => {
    const value = item?.[field.key];
    if (field.key === "curriculum" && Array.isArray(value)) return [field.key, value.map((lesson) => `${String((lesson as Record<string, unknown>).title || "")}\n${String((lesson as Record<string, unknown>).content || "")}`).join("\n\n---\n\n")];
    if (field.kind === "checkbox") return [field.key, Boolean(value)];
    if (Array.isArray(value)) return [field.key, value.join(", ")];
    return [field.key, value === undefined || value === null ? "" : String(value)];
  }));
}

function parseCurriculumText(value: string) {
  return value.split(/\n\s*---\s*\n/).map((block) => block.trim()).filter(Boolean).map((block) => {
    const [title = "", ...contentLines] = block.split(/\r?\n/);
    return { title: title.trim(), content: contentLines.join("\n").trim() };
  });
}

function slugify(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function AdminPage() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [tab, setTab] = useState<AdminTab>("overview");
  const [message, setMessage] = useState("");
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [contentCollection, setContentCollection] = useState<Collection>("courses");
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [messageFilter, setMessageFilter] = useState("all");
  const [members, setMembers] = useState<AdminUser[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [invite, setInvite] = useState({ name: "", email: "", password: "", role: "editor" as Role });
  const [inviteBusy, setInviteBusy] = useState(false);

  const canEdit = Boolean(user && ["owner", "admin", "editor"].includes(user.role));
  const canReadMessages = Boolean(user && ["owner", "admin", "support"].includes(user.role));
  const canManageTeam = user?.role === "owner";
  const canReadAudit = Boolean(user && ["owner", "admin"].includes(user.role));
  const visibleNavigation = useMemo(() => navigation.filter(({ id }) => {
    if (id === "content") return user && ["owner", "admin", "editor", "viewer"].includes(user.role);
    if (id === "messages") return canReadMessages;
    if (id === "team") return canManageTeam;
    if (id === "activity") return canReadAudit;
    return Boolean(user);
  }), [user, canReadMessages, canManageTeam, canReadAudit]);

  useEffect(() => {
    let active = true;
    adminRequest<SessionPayload>("/session")
      .then((result) => {
        if (!active) return;
        setSession(result);
        setUser(result.user);
      })
      .catch((error: Error) => { if (active) setMessage(error.message); })
      .finally(() => { if (active) setLoadingSession(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setPanelLoading(true);
    setPanelError("");
    const load = async () => {
      try {
        if (tab === "overview") {
          const result = await adminRequest<Overview>("/overview");
          if (active) setOverview(result);
        } else if (tab === "content") {
          const result = await adminRequest<{ items: ContentItem[] }>(`/content/${contentCollection}`);
          if (active) setContentItems(result.items);
        } else if (tab === "messages") {
          const result = await adminRequest<{ items: ContactMessage[] }>(`/messages?status=${encodeURIComponent(messageFilter)}`);
          if (active) setMessages(result.items);
        } else if (tab === "team") {
          const result = await adminRequest<{ items: AdminUser[] }>("/users");
          if (active) setMembers(result.items);
        } else if (tab === "activity") {
          const result = await adminRequest<{ items: AuditEvent[] }>("/activity?limit=100");
          if (active) setAuditEvents(result.items);
        }
      } catch (error) {
        if (active) setPanelError(error instanceof Error ? error.message : "Could not load this workspace panel.");
      } finally {
        if (active) setPanelLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [user, tab, contentCollection, messageFilter, refreshKey]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoginBusy(true);
    try {
      const result = await adminRequest<{ user: AdminUser }>("/login", { method: "POST", body: JSON.stringify({ email: loginEmail, password: loginPassword }) });
      setUser(result.user);
      setSession((previous) => previous ? { ...previous, authenticated: true, user: result.user } : previous);
      setLoginPassword("");
      setTab("overview");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleLogout() {
    try { await adminRequest("/logout", { method: "POST" }); } catch { /* Clearing a stale cookie is still safe. */ }
    setUser(null);
    setSession((previous) => previous ? { ...previous, authenticated: false, user: null } : previous);
    setTab("overview");
    setMessage("You’ve signed out securely.");
  }

  async function changeMessageStatus(id: string, status: ContactMessage["status"]) {
    setPanelError("");
    try {
      await adminRequest(`/messages/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setRefreshKey((value) => value + 1);
    } catch (error) { setPanelError(error instanceof Error ? error.message : "Could not update this message."); }
  }

  async function saveContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    const definition = fields[editor.collection];
    const payload: Record<string, unknown> = {};
    for (const field of definition) {
      const value = editor.values[field.key];
      if (field.kind === "checkbox") payload[field.key] = Boolean(value);
      else if (field.kind === "number") payload[field.key] = Number(value || 0);
      else if (field.key === "stack") payload[field.key] = String(value || "").split(",").map((part) => part.trim()).filter(Boolean);
      else if (field.key === "curriculum") payload[field.key] = parseCurriculumText(String(value ?? ""));
      else payload[field.key] = String(value ?? "").trim();
    }
    setPanelError("");
    try {
      if (editor.key) {
        await adminRequest(`/content/${editor.collection}/${encodeURIComponent(editor.key)}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await adminRequest(`/content/${editor.collection}`, { method: "POST", body: JSON.stringify(payload) });
      }
      setEditor(null);
      setRefreshKey((value) => value + 1);
    } catch (error) { setPanelError(error instanceof Error ? error.message : "Could not save this item."); }
  }

  async function removeContent(item: ContentItem) {
    const title = itemTitle(item);
    if (!window.confirm(`Delete “${title}” from the course catalog? This cannot be undone.`)) return;
    try {
      await adminRequest(`/content/${contentCollection}/${encodeURIComponent(String(item.id || item.slug))}`, { method: "DELETE" });
      setRefreshKey((value) => value + 1);
    } catch (error) { setPanelError(error instanceof Error ? error.message : "Could not delete this item."); }
  }

  async function createMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviteBusy(true);
    setPanelError("");
    try {
      await adminRequest("/users", { method: "POST", body: JSON.stringify(invite) });
      setInvite({ name: "", email: "", password: "", role: "editor" });
      setRefreshKey((value) => value + 1);
    } catch (error) { setPanelError(error instanceof Error ? error.message : "Could not invite this teammate."); }
    finally { setInviteBusy(false); }
  }

  async function updateMember(member: AdminUser, changes: Partial<Pick<AdminUser, "role" | "active">>) {
    try {
      await adminRequest(`/users/${encodeURIComponent(member.id)}`, { method: "PATCH", body: JSON.stringify(changes) });
      setRefreshKey((value) => value + 1);
    } catch (error) { setPanelError(error instanceof Error ? error.message : "Could not update this account."); }
  }

  const visibleContent = useMemo(() => contentItems.filter((item) => `${itemTitle(item)} ${item.slug || ""} ${item.category || ""}`.toLowerCase().includes(search.toLowerCase())), [contentItems, search]);

  if (loadingSession) return <main className={styles.adminPage}><div className={styles.loading}><span className={styles.spinner} /><b>Opening your studio</b><small>Checking secure access…</small></div></main>;

  if (!user) {
    const setupRequired = session?.setupRequired ?? true;
    return <main className={styles.loginPage}>
      <div className={styles.loginGlow} />
      <div className={styles.loginLayout}>
        <section className={styles.loginStory}>
          <Link href="/" className={styles.loginBrand}><LogoMark /><span>Coding With <b>Bashir</b></span></Link>
          <div className={styles.loginStoryCopy}>
            <span className={styles.kicker}><Sparkles size={14} /> THE LEARNING ADMIN</span>
            <h1>Everything you’re building,<br /><em>in one clear view.</em></h1>
            <p>Manage real courses and publish only after their lesson curriculum is authored.</p>
            <div className={styles.loginFeatures}><span><CheckCircle2 size={15} /> Course authoring with required lessons</span><span><ShieldCheck size={15} /> Clear roles and least-privilege access</span><span><Activity size={15} /> Activity log for important changes</span></div>
          </div>
          <div className={styles.loginStoryFoot}><span><span /> PRIVATE WORKSPACE</span><Link href="/">Return to the learning platform <ArrowUpRight size={13} /></Link></div>
        </section>
        <section className={styles.loginCard}>
          <span className={styles.loginCardIcon}><LockKeyhole size={19} /></span>
          <span className={styles.kicker}>SECURE SIGN-IN</span>
          <h2>Welcome to Learning Admin.</h2>
          <p>Use an admin account provided by the learning-platform owner. There is no public sign-up.</p>
          {setupRequired && <div className={styles.setupNotice}><Shield size={16} /><span><b>Admin setup is required</b><small>Configure <code>JWT_SECRET</code>, <code>ADMIN_EMAIL</code>, and <code>ADMIN_PASSWORD</code> on the server. See the deployment guide in README.</small></span></div>}
          {message && <div className={styles.formError} role="alert">{message}</div>}
          {!setupRequired && <form onSubmit={handleLogin} className={styles.loginForm}>
            <label>Email address<input type="email" autoComplete="username" required value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder="you@yourdomain.com" /></label>
            <label>Password<input type="password" autoComplete="current-password" minLength={12} required value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder="Your secure password" /></label>
            <button className={styles.primaryButton} disabled={loginBusy}>{loginBusy ? <><span className={styles.spinnerSmall} /> Checking credentials…</> : <>Open Learning Admin workspace <ArrowRight size={15} /></>}</button>
          </form>}
          <div className={styles.loginCardFoot}><span><LockKeyhole size={12} /> HttpOnly session · 8 hour expiry</span><a href="mailto:hello@codingwithbashir.dev">Need access? <ArrowUpRight size={12} /></a></div>
        </section>
      </div>
    </main>;
  }

  return <main className={styles.adminPage}>
    <div className={styles.adminShell}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.sidebarBrand}><LogoMark small /><span><b>Learning Admin</b><small>CODING WITH BASHIR</small></span></Link>
        <div className={styles.workspaceLabel}>WORKSPACE</div>
        <nav aria-label="Admin workspace">
          {visibleNavigation.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setTab(id); setPanelError(""); }} className={`${styles.navItem} ${tab === id ? styles.navItemActive : ""}`} aria-current={tab === id ? "page" : undefined}><Icon size={16} /><span>{label}</span>{id === "messages" && overview?.counts.unreadMessages ? <i>{overview.counts.unreadMessages}</i> : null}</button>)}
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.sideHelp}><CircleHelp size={15} /><span><b>Need a hand?</b><small>Browse learner courses</small></span><Link href="/courses" aria-label="Browse courses"><ArrowUpRight size={14} /></Link></div>
          <div className={styles.sideUser}><span className={styles.avatar}>{initials(user.name)}</span><span className={styles.sideUserName}><b>{user.name}</b><small>{roleInfo[user.role].label}</small></span><button onClick={handleLogout} title="Sign out" aria-label="Sign out"><LogOut size={15} /></button></div>
        </div>
      </aside>
      <section className={styles.mainPanel}>
        <header className={styles.topbar}><div><span className={styles.breadcrumb}>Learning Admin</span><span className={styles.breadcrumbSlash}>/</span><b>{navigation.find((item) => item.id === tab)?.label}</b></div><div className={styles.topActions}><span className={styles.online}><i /> API connected</span><button className={styles.refreshButton} aria-label="Refresh current view" title="Refresh data" onClick={() => setRefreshKey((value) => value + 1)}><RefreshCw size={15} /></button><Link href="/" className={styles.viewSite}><ArrowUpRight size={14} /> View site</Link></div></header>
        <div className={styles.mainContent}>
          <div className={styles.pageHeading}><div><span className={styles.kicker}><span className={styles.headingLive} /> PRIVATE LEARNING ADMIN · {roleInfo[user.role].label.toUpperCase()}</span><h1>{tab === "overview" ? `Good to see you, ${user.name.split(" ")[0]}.` : navigation.find((item) => item.id === tab)?.label}</h1><p>{tab === "overview" ? "A focused view of published learning courses and workspace activity." : roleInfo[user.role].description}</p></div><div className={styles.headingDate}><span>LEARNING ADMIN</span><b>{new Intl.DateTimeFormat("en", { dateStyle: "full" }).format(new Date())}</b></div></div>
          {panelError && <div className={styles.panelError} role="alert"><span>{panelError}</span><button onClick={() => setPanelError("")} aria-label="Dismiss"><X size={14} /></button></div>}
          {panelLoading && <div className={styles.loadingBar}><span /></div>}
          {tab === "overview" && <OverviewPanel overview={overview} loading={panelLoading} role={user.role} onOpenMessages={() => setTab("messages")} onOpenContent={(collection) => { if (collection) setContentCollection(collection); setTab("content"); }} />}
          {tab === "content" && <ContentPanel collection={contentCollection} setCollection={setContentCollection} items={visibleContent} total={contentItems.length} query={search} setQuery={setSearch} canEdit={canEdit} onCreate={() => setEditor({ collection: contentCollection, key: null, values: toEditorValues(contentCollection) })} onEdit={(item) => setEditor({ collection: contentCollection, key: String(item.id || item.slug || ""), values: toEditorValues(contentCollection, item) })} onDelete={removeContent} />}
          {tab === "messages" && <MessagesPanel messages={messages} filter={messageFilter} setFilter={setMessageFilter} onStatus={changeMessageStatus} />}
          {tab === "team" && <TeamPanel members={members} currentUser={user} invite={invite} setInvite={setInvite} onInvite={createMember} busy={inviteBusy} onUpdate={updateMember} />}
          {tab === "activity" && <ActivityPanel events={auditEvents} />}
          <div className={styles.footerNote}><span><ShieldCheck size={13} /> Role checks are enforced by the API, not just the interface.</span><span>Data source: {overview ? "live workspace" : "server"}</span></div>
        </div>
      </section>
    </div>
    {editor && <ContentEditor editor={editor} setEditor={setEditor} onSubmit={saveContent} />}
  </main>;
}

function OverviewPanel({ overview, loading, role, onOpenMessages, onOpenContent }: { overview: Overview | null; loading: boolean; role: Role; onOpenMessages: () => void; onOpenContent: (collection?: Collection) => void }) {
  const canReadMessages = overview?.inboxAvailable ?? ["owner", "admin", "support"].includes(role);
  const canReadActivity = overview?.activityAvailable ?? ["owner", "admin", "support"].includes(role);
  const metrics = [
    { label: "Published courses", key: "courses", icon: BookOpen, tint: "cyan" },
    { label: "New messages", key: "unreadMessages", icon: Mail, tint: "green" },
  ].filter(({ key }) => key !== "unreadMessages" || canReadMessages);
  const values = overview?.dailyActivity.map((day) => day.count) || [];
  const maxValue = Math.max(1, ...values);
  const points = values.map((value, index) => `${values.length <= 1 ? 50 : 5 + index * (90 / (values.length - 1))},${78 - value / maxValue * 60}`).join(" ");
  return <div className={styles.overviewPanel}>
    <div className={styles.metricsGrid}>{metrics.map(({ label, key, icon: Icon, tint }) => <article className={styles.metricCard} key={key}><span className={`${styles.metricIcon} ${styles[`metric${tint[0].toUpperCase()}${tint.slice(1)}`]}`}><Icon size={17} /></span><span className={styles.metricLabel}>{label}</span><b>{overview?.counts[key] ?? (loading ? "—" : 0)}</b><small><span className={styles.metricPulse} /> Updated just now</small><span className={styles.metricSpark} /></article>)}</div>
    <div className={styles.overviewGrid}>
      {canReadActivity && <section className={styles.panelCard}>
        <div className={styles.cardHeading}><span><h2>Admin activity</h2><p>{canReadMessages && ["owner", "admin"].includes(role) ? "Messages and admin actions over the last seven days." : canReadMessages ? "Inbox activity over the last seven days." : "Admin actions over the last seven days."}</p></span><span className={styles.cardHeadingBadge}><Activity size={12} /> 7 DAYS</span></div>
        <div className={styles.chartWrap} role="img" aria-label={`Seven day activity chart, ${values.reduce((sum, value) => sum + value, 0)} total events`}>
          <svg viewBox="0 0 100 88" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="studio-chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#9c77ff" stopOpacity=".4" /><stop offset="1" stopColor="#9c77ff" stopOpacity="0" /></linearGradient></defs><path d={`M ${points || "5,78 95,78"} L 95,82 L 5,82 Z`} fill="url(#studio-chart-fill)" /><polyline points={points || "5,78 95,78"} fill="none" stroke="#b196ff" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />{values.map((value, index) => <circle key={index} cx={values.length <= 1 ? 50 : 5 + index * (90 / (values.length - 1))} cy={78 - value / maxValue * 60} r="1.6" fill="#f1eaff" stroke="#9c77ff" strokeWidth="1" />)}</svg>
          <div className={styles.chartLabels}>{overview?.dailyActivity.map((day) => <span key={day.date}>{day.label}</span>)}</div>
        </div>
      </section>}
      {canReadMessages && <section className={styles.panelCard}>
        <div className={styles.cardHeading}><span><h2>Inbox at a glance</h2><p>A few recent conversations.</p></span><button className={styles.textAction} onClick={onOpenMessages}>Open inbox <ArrowRight size={13} /></button></div>
        <div className={styles.previewMessages}>{overview?.recentMessages.length ? overview.recentMessages.slice(0, 4).map((item) => <div key={item.id} className={styles.previewMessage}><span className={styles.avatarSmall}>{initials(item.name)}</span><span><b>{item.subject}</b><small>{item.name} · {timeAgo(item.createdAt)}</small></span><span className={`${styles.messageDot} ${item.status === "new" ? styles.messageDotUnread : ""}`} /></div>) : <div className={styles.emptyMini}><Mail size={17} /><span>No messages yet. Your next conversation will appear here.</span></div>}</div>
      </section>}
    </div>
    <section className={styles.panelCard}>
      <div className={styles.cardHeading}><span><h2>Your course catalog</h2><p>One focused course catalog.</p></span><button className={styles.textAction} onClick={() => onOpenContent()}>Manage courses <ArrowRight size={13} /></button></div>
      <div className={styles.collectionStats}>{collections.map(({ id, label, icon: Icon }, index) => <button key={id} onClick={() => onOpenContent(id)} className={styles.collectionStat}><span className={`${styles.collectionIcon} ${styles[`collectionTone${index}`]}`}><Icon size={15} /></span><span><b>{overview?.counts[id] ?? 0}</b><small>{label}</small></span><ArrowUpRight size={13} /></button>)}</div>
    </section>
    <div className={styles.overviewBottom}><div><span><ShieldCheck size={16} /></span><div><b>Access is role-aware</b><small>Your account is signed in as <strong>{roleInfo[role].label}</strong>. Sensitive actions require explicit API permissions.</small></div></div><div><span><KeyRound size={16} /></span><div><b>Protected session</b><small>HttpOnly cookie · secure transport in production · 8-hour expiry</small></div></div></div>
  </div>;
}

function ContentPanel({ collection, setCollection, items, total, query, setQuery, canEdit, onCreate, onEdit, onDelete }: {
  collection: Collection; setCollection: (value: Collection) => void; items: ContentItem[]; total: number; query: string; setQuery: (value: string) => void; canEdit: boolean;
  onCreate: () => void; onEdit: (item: ContentItem) => void; onDelete: (item: ContentItem) => void;
}) {
  return <div className={styles.contentPanel}>
    <div className={styles.contentToolbar}><div className={styles.collectionTabs} role="tablist" aria-label="Course catalog">{collections.map(({ id, label }) => <button key={id} role="tab" aria-selected={collection === id} className={collection === id ? styles.collectionTabActive : ""} onClick={() => setCollection(id)}>{label}</button>)}</div><button className={styles.primaryButtonCompact} disabled={!canEdit} onClick={onCreate}><Plus size={14} /> New {collection.slice(0, -1)}</button></div>
    <section className={styles.panelCard}>
      <div className={styles.listHeader}><span><h2>{collections.find((item) => item.id === collection)?.label} library</h2><p>{total} entries · published courses appear in the learner catalog.</p></span><label className={styles.searchBox}><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search courses…" /><kbd>/</kbd></label></div>
      <div className={styles.tableScroller}><table className={styles.contentTable}><thead><tr><th>Entry</th><th>Category</th><th>URL slug</th><th>Updated</th>{canEdit && <th>Actions</th>}</tr></thead><tbody>{items.map((item) => <tr key={String(item.id || item.slug)}><td><span className={styles.entryTitle}><i>{initials(itemTitle(item))}</i><span><b>{itemTitle(item)}</b><small>{String(item.description || item.excerpt || item.quote || "No description provided.").slice(0, 86)}</small></span></span></td><td><span className={styles.categoryPill}>{String(item.category || item.role || "General")}</span></td><td><code>/{String(item.slug || "—")}</code></td><td>{timeAgo(String(item.updatedAt || item.createdAt || ""))}</td>{canEdit && <td><span className={styles.rowActions}><button title="Edit entry" onClick={() => onEdit(item)}><Settings2 size={14} /></button><button title="Delete entry" className={styles.deleteIcon} onClick={() => onDelete(item)}><Archive size={14} /></button></span></td>}</tr>)}</tbody></table></div>
      {!items.length && <div className={styles.emptyState}><span><Search size={19} /></span><b>{query ? "No matching content" : "No courses published yet"}</b><small>{query ? "Try another search term." : "Publish a course only after adding its complete authored curriculum."}</small>{canEdit && !query && <button className={styles.textAction} onClick={onCreate}>Create the first entry <ArrowRight size={13} /></button>}</div>}
    </section>
  </div>;
}

function MessagesPanel({ messages, filter, setFilter, onStatus }: { messages: ContactMessage[]; filter: string; setFilter: (value: string) => void; onStatus: (id: string, status: ContactMessage["status"]) => void }) {
  const filters = ["all", "new", "read", "replied", "archived"];
  return <div className={styles.messagesPanel}>
    <div className={styles.inboxToolbar}><div><span className={styles.inboxBigIcon}><Mail size={18} /></span><span><b>{messages.length} conversations</b><small>Contact messages are only visible to inbox roles.</small></span></div><label className={styles.statusSelect}><Filter size={13} /><select value={filter} onChange={(event) => setFilter(event.target.value)}>{filters.map((value) => <option key={value} value={value}>{value === "all" ? "All messages" : value[0].toUpperCase() + value.slice(1)}</option>)}</select><ChevronDown size={13} /></label></div>
    {messages.length ? <div className={styles.messageList}>{messages.map((item) => <article className={`${styles.messageCard} ${item.status === "new" ? styles.messageCardUnread : ""}`} key={item.id}><div className={styles.messageCardTop}><span className={styles.avatar}>{initials(item.name)}</span><span className={styles.sender}><b>{item.name}</b><a href={`mailto:${item.email}`}>{item.email}</a></span><span className={styles.messageDate}><Clock3 size={12} />{timeAgo(item.createdAt)}</span><label className={styles.messageStatus}><select value={item.status} onChange={(event) => onStatus(item.id, event.target.value as ContactMessage["status"])} aria-label={`Change status for ${item.subject}`}><option value="new">New</option><option value="read">Read</option><option value="replied">Replied</option><option value="archived">Archived</option></select><ChevronDown size={12} /></label></div><h3>{item.subject}</h3><p>{item.message}</p><div className={styles.messageActions}><a href={`mailto:${item.email}?subject=${encodeURIComponent(`Re: ${item.subject}`)}`}><Mail size={13} /> Reply by email <ArrowUpRight size={12} /></a><span className={`${styles.statusBadge} ${styles[`status${item.status[0].toUpperCase()}${item.status.slice(1)}`]}`}><i />{item.status}</span></div></article>)}</div> : <div className={styles.emptyState}><span><MessageSquareText size={19} /></span><b>All quiet in the inbox</b><small>Try another status filter, or check back when a new note arrives.</small></div>}
  </div>;
}

function TeamPanel({ members, currentUser, invite, setInvite, onInvite, busy, onUpdate }: {
  members: AdminUser[]; currentUser: AdminUser; invite: { name: string; email: string; password: string; role: Role }; setInvite: (value: { name: string; email: string; password: string; role: Role }) => void;
  onInvite: (event: FormEvent<HTMLFormElement>) => void; busy: boolean; onUpdate: (member: AdminUser, changes: Partial<Pick<AdminUser, "role" | "active">>) => void;
}) {
  return <div className={styles.teamPanel}>
    <section className={styles.panelCard}><div className={styles.cardHeading}><span><h2>People with access</h2><p>Give teammates only the permissions they need.</p></span><span className={styles.cardHeadingBadge}><Users size={12} /> {members.length} MEMBERS</span></div>
      <div className={styles.roleLegend}>{(Object.entries(roleInfo) as Array<[Role, typeof roleInfo[Role]]>).map(([role, info]) => <div key={role}><span className={`${styles.roleTag} ${styles[`role${role[0].toUpperCase()}${role.slice(1)}`]}`}>{info.label}</span><small>{info.description}</small></div>)}</div>
      <div className={styles.memberList}>{members.map((member) => <article className={styles.memberCard} key={member.id}><span className={styles.avatar}>{initials(member.name)}</span><span className={styles.memberIdentity}><b>{member.name}{member.id === currentUser.id && <i>YOU</i>}</b><small>{member.email}</small><small>Last sign-in · {timeAgo(member.lastLoginAt, "No sign-in recorded")}</small></span><span className={`${styles.roleTag} ${styles[`role${member.role[0].toUpperCase()}${member.role.slice(1)}`]}`}>{roleInfo[member.role].label}{member.createdBy === "environment" && <LockKeyhole size={10} />}</span><label className={styles.memberSelect}><span>Role</span><select disabled={member.createdBy === "environment" || member.id === currentUser.id} value={member.role} onChange={(event) => onUpdate(member, { role: event.target.value as Role })} aria-label={`Change role for ${member.name}`}>{Object.keys(roleInfo).map((role) => <option key={role} value={role}>{roleInfo[role as Role].label}</option>)}</select><ChevronDown size={12} /></label><button className={`${styles.memberToggle} ${member.active ? styles.memberToggleActive : ""}`} disabled={member.createdBy === "environment" || member.id === currentUser.id} onClick={() => onUpdate(member, { active: !member.active })} aria-label={`${member.active ? "Deactivate" : "Reactivate"} ${member.name}`}><span /></button></article>)}</div>
    </section>
    <section className={styles.inviteCard}><span className={styles.inviteIcon}><UserPlus size={18} /></span><div className={styles.inviteHeading}><h2>Invite a teammate</h2><p>Create an account with a clear role. Share the temporary password securely.</p></div><form onSubmit={onInvite} className={styles.inviteForm}><label>Full name<input required minLength={2} maxLength={80} value={invite.name} onChange={(event) => setInvite({ ...invite, name: event.target.value })} placeholder="Alex Morgan" /></label><label>Email address<input type="email" required value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} placeholder="alex@example.com" /></label><label>Temporary password<input type="password" required minLength={12} value={invite.password} onChange={(event) => setInvite({ ...invite, password: event.target.value })} placeholder="At least 12 characters" /></label><label>Workspace role<span className={styles.selectWrap}><select value={invite.role} onChange={(event) => setInvite({ ...invite, role: event.target.value as Role })}>{Object.entries(roleInfo).filter(([role]) => role !== "owner").map(([role, info]) => <option value={role} key={role}>{info.label} — {info.description}</option>)}</select><ChevronDown size={13} /></span></label><button className={styles.primaryButtonCompact} disabled={busy}><UserPlus size={14} />{busy ? "Creating account…" : "Create teammate account"}</button><small>Passwords are hashed with scrypt and never returned to the browser.</small></form></section>
  </div>;
}

function ActivityPanel({ events }: { events: AuditEvent[] }) {
  return <section className={styles.panelCard}><div className={styles.cardHeading}><span><h2>Workspace audit trail</h2><p>Recent sign-ins and changes made by the team.</p></span><span className={styles.cardHeadingBadge}><ShieldCheck size={12} /> {events.length} EVENTS</span></div>
    {events.length ? <div className={styles.auditList}>{events.map((event) => <article key={event.id} className={styles.auditRow}><span className={styles.auditIcon}>{event.action === "login" ? <KeyRound size={14} /> : event.entity === "message" ? <Mail size={14} /> : event.action === "delete" ? <Archive size={14} /> : <Activity size={14} />}</span><span className={styles.auditText}><b>{event.summary}</b><small>{event.actorEmail} · {event.entity} · {timeAgo(event.createdAt)}</small></span><span className={styles.auditAction}>{event.action.replaceAll("-", " ")}</span></article>)}</div> : <div className={styles.emptyState}><span><Activity size={19} /></span><b>No recorded changes yet</b><small>Important admin actions and sign-ins will appear here.</small></div>}
  </section>;
}

function ContentEditor({ editor, setEditor, onSubmit }: { editor: EditorState; setEditor: (value: EditorState | null) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const mainKey = editor.collection === "projects" || editor.collection === "testimonials" ? "name" : "title";
  const primaryLabel = collections.find((item) => item.id === editor.collection)?.label || "content";
  function updateField(key: string, value: string | boolean) {
    setEditor({
      ...editor,
      values: {
        ...editor.values,
        [key]: value,
        ...(key === mainKey && !editor.key ? { slug: slugify(String(value)) } : {}),
      },
    });
  }
  return <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditor(null); }}>
    <section className={styles.editorModal} role="dialog" aria-modal="true" aria-labelledby="editor-title"><header className={styles.modalHeader}><span className={styles.modalIcon}><Layers3 size={16} /></span><span><small>{editor.key ? "EDIT EXISTING ENTRY" : "ADD SOMETHING NEW"}</small><h2 id="editor-title">{editor.key ? "Update" : "Create"} {primaryLabel.slice(0, -1)}</h2></span><button onClick={() => setEditor(null)} aria-label="Close editor"><X size={17} /></button></header>
      <form onSubmit={onSubmit}><div className={styles.editorFields}>{fields[editor.collection].map((field) => <label className={`${styles.editorField} ${field.kind === "textarea" ? styles.editorFieldWide : ""}`} key={field.key}><span>{field.label}</span>{field.kind === "textarea" ? <textarea required={!editor.key && ["description", "excerpt", "quote", "body", "curriculum"].includes(field.key)} rows={field.key === "curriculum" ? 16 : field.key === "body" ? 8 : 4} maxLength={field.key === "curriculum" ? 1500000 : field.key === "body" ? 12000 : field.key === "quote" ? 1200 : field.key === "excerpt" ? 500 : 3000} value={String(editor.values[field.key] ?? "")} onChange={(event) => updateField(field.key, event.target.value)} /> : field.kind === "checkbox" ? <span className={styles.checkboxField}><input type="checkbox" checked={Boolean(editor.values[field.key])} onChange={(event) => updateField(field.key, event.target.checked)} /><i>Show this project in featured work</i></span> : <input type={field.kind === "number" ? "number" : "text"} min={field.key === "lessons" ? "1" : field.kind === "number" ? "0" : undefined} max={field.key === "lessons" ? "120" : undefined} required={!editor.key && ["name", "title", "slug", "category", "code", "lessons"].includes(field.key)} value={String(editor.values[field.key] ?? "")} onChange={(event) => updateField(field.key, event.target.value)} />}{field.hint && <small>{field.hint}</small>}</label>)}</div><footer className={styles.modalFooter}><span><ShieldCheck size={12} /> Saved to the learning catalog</span><button className={styles.primaryButtonCompact} type="submit"><Check size={14} /> Save entry</button></footer></form>
    </section>
  </div>;
}
