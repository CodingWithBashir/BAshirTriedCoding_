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

export const projects: Project[] = [];

export type CourseLesson = { title: string; content: string };

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
  curriculum?: CourseLesson[];
};

export const courses: Course[] = [];

/* Removed demo courses: publish real authored curricula through Learning Admin. */
export type Article = {
  title: string;
  slug: string;
  category: string;
  date: string;
  readTime: string;
  excerpt: string;
  variant: string;
  body?: string;
};

export const articles: Article[] = [];
export type Testimonial = { name: string; role: string; quote: string; initials: string; color: string };
export const testimonials: Testimonial[] = [];
export type Service = { icon: string; title: string; text: string };
export const services: Service[] = [];
export type SkillGroup = { name: string; skills: string[] };
export const skillGroups: SkillGroup[] = [];

export const pageCategories = ["All"];
