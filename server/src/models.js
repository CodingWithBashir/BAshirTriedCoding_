import mongoose from "mongoose";

const { Schema } = mongoose;
const commonOptions = { timestamps: true, versionKey: false };

const ProjectSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  category: { type: String, required: true },
  label: { type: String, default: "Project" },
  description: { type: String, required: true },
  stack: { type: [String], default: [] },
  color: { type: String, default: "violet" },
  variant: { type: String, default: "classroom" },
  featured: { type: Boolean, default: false },
}, commonOptions);

const CourseSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  category: String,
  level: { type: String, default: "Beginner" },
  lessons: { type: Number, default: 0 },
  duration: String,
  description: String,
  icon: String,
  color: String,
  progress: { type: Number, default: 0 },
}, commonOptions);

const CertificateSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  category: { type: String, default: "Course" },
  issued: String,
  level: String,
  code: { type: String, unique: true },
  color: String,
  description: String,
}, commonOptions);

const ArticleSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  category: String,
  date: String,
  readTime: String,
  excerpt: String,
  variant: String,
}, commonOptions);

const TestimonialSchema = new Schema({
  name: { type: String, required: true },
  role: String,
  quote: { type: String, required: true },
  initials: String,
  color: String,
}, commonOptions);

const ContactMessageSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 90 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
  subject: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ["new", "read", "replied"], default: "new" },
}, commonOptions);

export const models = {
  projects: mongoose.models.Project || mongoose.model("Project", ProjectSchema),
  courses: mongoose.models.Course || mongoose.model("Course", CourseSchema),
  certificates: mongoose.models.Certificate || mongoose.model("Certificate", CertificateSchema),
  articles: mongoose.models.Article || mongoose.model("Article", ArticleSchema),
  testimonials: mongoose.models.Testimonial || mongoose.model("Testimonial", TestimonialSchema),
  messages: mongoose.models.ContactMessage || mongoose.model("ContactMessage", ContactMessageSchema),
};
