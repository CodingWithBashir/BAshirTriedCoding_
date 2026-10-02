export type Project = {
  name: string;
  slug: string;
  category: string;
  label: string;
  summary: string;
  description: string;
  stack: string[];
  color: string;
  variant: string;
  liveUrl?: string;
};

export const projects: Project[] = [
  {
    name: "AgabonabanyeFree",
    slug: "agabonabanyefree",
    category: "Web App",
    label: "Learning platform",
    summary: "A home for free learning, useful conversations, and the next wave of curious minds.",
    description: "I built a welcoming community platform where learners can discover free educational videos, join conversations, and find their next lesson. The focus was a calm, accessible reading experience with a flexible content system that makes publishing easy.",
    stack: ["Next.js", "TypeScript", "MongoDB", "Tailwind CSS"],
    color: "cyan",
    variant: "classroom",
  },
  {
    name: "Evara AI",
    slug: "evara-ai",
    category: "AI / Media",
    label: "AI video studio",
    summary: "An intelligent video workspace that makes thoughtful editing feel effortless.",
    description: "A concept-to-product experiment that brings AI-assisted editing, clips, and a simple publishing workflow into one focused studio. The experience is designed to help independent creators spend less time navigating tools and more time telling stories.",
    stack: ["React", "Node.js", "OpenAI", "Cloudinary"],
    color: "amber",
    variant: "studio",
  },
  {
    name: "CodeOwl",
    slug: "codeowl",
    category: "EdTech",
    label: "Coding companion",
    summary: "Friendly, interactive coding paths that turn first steps into real momentum.",
    description: "CodeOwl pairs short, approachable lessons with hands-on practice and progress tracking. I shaped the experience around small wins: learn a concept, try it in a safe environment, and leave with a project you can share.",
    stack: ["Next.js", "React", "PostgreSQL", "Prisma"],
    color: "violet",
    variant: "owl",
  },
  {
    name: "BwengeAI",
    slug: "bwenge-ai",
    category: "AI / ML",
    label: "AI learning assistant",
    summary: "A multilingual AI companion for learning, built with local voices in mind.",
    description: "An exploratory assistant that helps turn difficult topics into simple explanations, useful questions, and practical learning plans. The product concept centres access, clear language, and education that feels closer to home.",
    stack: ["Python", "FastAPI", "React", "Gemini"],
    color: "blue",
    variant: "assistant",
  },
  {
    name: "WhatsApp Clone",
    slug: "whatsapp-clone",
    category: "Web App",
    label: "Realtime messaging",
    summary: "A fast, realtime chat interface designed around the details of everyday conversation.",
    description: "A full-stack messaging practice project featuring realtime rooms, presence, and a responsive chat layout. Built to deepen my understanding of websockets, server events, and the little interaction details that make an interface feel alive.",
    stack: ["React", "Node.js", "Socket.io", "MongoDB"],
    color: "green",
    variant: "chat",
  },
  {
    name: "Velo Editor",
    slug: "velo-editor",
    category: "Creative tools",
    label: "Video editor",
    summary: "A browser-based editing canvas for turning raw clips into shareable stories.",
    description: "A web video editor concept with an approachable clip timeline, lightweight effects, and clear export settings. The project taught me how much craft lives in making dense creative workflows feel simple.",
    stack: ["TypeScript", "React", "FFmpeg", "AWS S3"],
    color: "pink",
    variant: "timeline",
  },
];

export type Course = {
  title: string;
  slug: string;
  category: string;
  level: string;
  lessons: number;
  duration: string;
  description: string;
  icon: string;
  color: string;
  progress?: number;
};

export const courses: Course[] = [
  { title: "HTML & CSS", slug: "html-css", category: "Web Dev", level: "Beginner", lessons: 18, duration: "3h 20m", description: "Build and style beautiful, responsive websites from the ground up.", icon: "Code2", color: "orange", progress: 68 },
  { title: "JavaScript Essentials", slug: "javascript", category: "Programming", level: "Beginner", lessons: 24, duration: "5h 10m", description: "The building blocks of the modern, interactive web.", icon: "Braces", color: "yellow", progress: 32 },
  { title: "React & Next.js", slug: "react-nextjs", category: "Web Dev", level: "Intermediate", lessons: 30, duration: "7h 45m", description: "Create polished, fast and fully interactive web applications.", icon: "Atom", color: "cyan", progress: 0 },
  { title: "Node.js & Express", slug: "node-express", category: "Backend", level: "Intermediate", lessons: 26, duration: "6h 30m", description: "Design clean APIs and server-side applications that scale.", icon: "Leaf", color: "green", progress: 0 },
  { title: "Python for Everyone", slug: "python", category: "Programming", level: "Beginner", lessons: 22, duration: "4h 25m", description: "Start solving real problems with clear, practical Python.", icon: "Webhook", color: "blue", progress: 0 },
  { title: "Django REST APIs", slug: "django-rest", category: "Backend", level: "Advanced", lessons: 20, duration: "5h 50m", description: "Build secure REST APIs with Django and thoughtful architecture.", icon: "Blocks", color: "emerald", progress: 0 },
  { title: "Game Development", slug: "game-development", category: "Creative tech", level: "Beginner", lessons: 16, duration: "3h 55m", description: "Turn playful ideas into small games you can share.", icon: "Gamepad2", color: "pink", progress: 0 },
  { title: "Machine Learning", slug: "machine-learning", category: "AI / ML", level: "Intermediate", lessons: 27, duration: "8h 15m", description: "Explore intelligent systems through simple, useful examples.", icon: "BrainCircuit", color: "violet", progress: 0 },
];

export type Certificate = {
  title: string;
  slug: string;
  category: string;
  issued: string;
  level: string;
  code: string;
  color: string;
  description: string;
};

export const certificates: Certificate[] = [
  { title: "Full-Stack Web Development", slug: "full-stack-web-development", category: "Course", issued: "May 20, 2025", level: "Advanced", code: "CWB-2025-001", color: "blue", description: "Built and shipped full-stack web applications using modern front-end and back-end tools." },
  { title: "Python Programming", slug: "python-programming", category: "Course", issued: "Apr 12, 2025", level: "Intermediate", code: "CWB-2025-002", color: "green", description: "Demonstrated a solid foundation in Python, problem solving, and working with data." },
  { title: "Version Control with Git & GitHub", slug: "git-github", category: "Course", issued: "Mar 28, 2025", level: "Beginner", code: "CWB-2025-003", color: "cyan", description: "Collaborated confidently with Git and GitHub and built a practical project workflow." },
  { title: "Game Development with Unity", slug: "game-development-unity", category: "Course", issued: "Feb 15, 2025", level: "Intermediate", code: "CWB-2025-004", color: "violet", description: "Created and shared a playable project using Unity and core game design patterns." },
  { title: "Web Design Fundamentals", slug: "web-design-fundamentals", category: "Course", issued: "Jan 10, 2025", level: "Beginner", code: "CWB-2025-005", color: "amber", description: "Applied modern, responsive UI and accessibility principles to a real web project." },
  { title: "Build Your First Project", slug: "first-project-challenge", category: "Challenge", issued: "Dec 20, 2024", level: "Beginner", code: "CWB-2024-006", color: "rose", description: "Completed the seven-day build challenge and published a first project from scratch." },
  { title: "JavaScript Essentials", slug: "javascript-essentials", category: "Course", issued: "Nov 18, 2024", level: "Intermediate", code: "CWB-2024-007", color: "indigo", description: "Used modern JavaScript to create helpful, interactive experiences." },
];

export type Article = {
  title: string;
  slug: string;
  category: string;
  date: string;
  readTime: string;
  excerpt: string;
  variant: string;
};

export const articles: Article[] = [
  { title: "Getting started with React", slug: "getting-started-with-react", category: "Tutorial", date: "May 12, 2025", readTime: "6 min read", excerpt: "A friendly first step into components, props, and building a UI that really works.", variant: "react" },
  { title: "Deploying a full-stack app on Render", slug: "deploying-full-stack-app-render", category: "Projects", date: "May 8, 2025", readTime: "8 min read", excerpt: "Take your idea from a local dev server to an app your friends can actually use.", variant: "deploy" },
  { title: "The best free tools for developers", slug: "free-tools-for-developers", category: "Tech news", date: "Apr 27, 2025", readTime: "5 min read", excerpt: "A practical kit of generous, free tools to make your next project a little easier.", variant: "tools" },
  { title: "Building responsive web apps", slug: "building-responsive-web-apps", category: "Engineering", date: "Apr 16, 2025", readTime: "7 min read", excerpt: "Small design decisions that make digital products feel right on every screen.", variant: "responsive" },
  { title: "Learning Python in 2025", slug: "learn-python-in-2025", category: "Tutorial", date: "Apr 8, 2025", readTime: "4 min read", excerpt: "A calm, practical learning plan for building your first tools with Python.", variant: "python" },
  { title: "My journey as a young developer", slug: "my-journey-young-developer", category: "Personal", date: "Mar 22, 2025", readTime: "6 min read", excerpt: "A few lessons from learning, building, and finding a community along the way.", variant: "journey" },
];

export const testimonials = [
  { name: "John Doe", role: "Course learner", quote: "Bashir is an exceptional developer! His work is clean, well-structured, and always delivered on time. Highly recommended!", initials: "JD", color: "blue" },
  { name: "Amina Uwimana", role: "Community member", quote: "The way he explains difficult ideas is so welcoming. I finally feel like I can build the things I imagine.", initials: "AU", color: "pink" },
  { name: "Emmanuel N.", role: "Community builder", quote: "A talented young developer with a bright future. Keep going, Bashir!", initials: "EN", color: "amber" },
  { name: "Mugisha Eric", role: "Project collaborator", quote: "He brings curiosity, good energy, and a real commitment to making the details work.", initials: "ME", color: "green" },
];

export const services = [
  { icon: "PanelsTopLeft", title: "Web Development", text: "Modern, fast and scalable web applications." },
  { icon: "Plug", title: "API Integration", text: "Connected systems and reliable, well-built APIs." },
  { icon: "BrainCircuit", title: "AI & Machine Learning", text: "Intelligent features designed around real-world problems." },
  { icon: "Layers3", title: "System Architecture", text: "Thoughtful foundations for products that grow." },
  { icon: "Palette", title: "UI/UX Design", text: "Clear, modern interfaces that feel effortless to use." },
  { icon: "Gamepad2", title: "Gaming & Interactive Apps", text: "Playful digital experiences with personality." },
];

export const skillGroups = [
  { name: "Frontend", skills: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS"] },
  { name: "Backend", skills: ["Node.js", "Express", "Python", "Django", "REST APIs", "Socket.io"] },
  { name: "Database", skills: ["MongoDB", "MySQL", "PostgreSQL", "Firebase"] },
  { name: "Tools & DevOps", skills: ["Git", "GitHub", "Docker", "Linux", "Vercel"] },
];

export const pageCategories = ["All", "Web Dev", "Programming", "Backend", "AI / ML", "Creative tech"];
