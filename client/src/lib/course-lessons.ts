import type { Course } from "@/lib/data";

const sharedOutline = [
  "Start with the big picture",
  "Set up your learning workspace",
  "Learn the core building block",
  "Follow a guided example",
  "Practice with a small challenge",
  "Connect the pieces",
  "Build a useful mini-project",
  "Review, reflect, and keep going",
];

const outlines: Record<string, string[]> = {
  "html-css": ["How the web page comes together", "Write a clear HTML document", "Organize content with semantic HTML", "Style text, colour, and spacing", "Build layouts with Flexbox", "Create a responsive grid", "Make a page accessible", "Publish a polished mini-site"],
  javascript: ["Meet JavaScript in the browser", "Store useful values", "Make decisions with conditions", "Repeat work with loops", "Write reusable functions", "Work with arrays and objects", "Respond to user events", "Build a small interactive app"],
  "react-nextjs": ["Think in reusable components", "Pass information with props", "Render lists and conditions", "Manage state and events", "Build a shared layout", "Add routes and page metadata", "Connect to an API", "Ship a polished Next.js page"],
  "node-express": ["Run JavaScript on the server", "Create your first Express route", "Design useful JSON responses", "Validate incoming requests", "Connect to a database", "Handle errors safely", "Protect routes and secrets", "Build and test a small API"],
  python: ["Read and write your first Python", "Use variables and data types", "Make decisions with conditions", "Repeat tasks with loops", "Organize code with functions", "Work with lists and dictionaries", "Read and write a small file", "Build a helpful Python tool"],
  "django-rest": ["Understand the Django project", "Model data with Django", "Create serializers", "Build your first API view", "Route requests cleanly", "Validate and secure input", "Test API responses", "Deploy a small REST service"],
  "game-development": ["Plan a tiny playable idea", "Explore the game scene", "Move a character", "Respond to player input", "Add obstacles and rules", "Create feedback and sound", "Polish a playable level", "Share your first game"],
  "machine-learning": ["Ask a useful data question", "Prepare a small dataset", "Explore patterns in the data", "Understand features and labels", "Train a simple model", "Measure model performance", "Improve one weak result", "Share a responsible demo"],
};

export function buildCourseLessons(course: Pick<Course, "slug" | "title" | "lessons">): string[] {
  const requested = Number.isFinite(course.lessons) ? Math.floor(course.lessons) : 8;
  const count = Math.max(1, Math.min(120, requested || 8));
  const outline = [...(outlines[course.slug] ?? sharedOutline)];
  while (outline.length < count) {
    const module = String(outline.length + 1).padStart(2, "0");
    outline.push(`Practice lab ${module}: apply ${course.title} in a small build`);
  }
  return outline.slice(0, count);
}
