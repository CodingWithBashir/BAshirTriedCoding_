import mongoose from "mongoose";

const { Schema } = mongoose;
const commonOptions = { timestamps: true, versionKey: false };
const adminRoles = ["owner", "admin", "editor", "support", "viewer"];

const ProjectSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 90 },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 120 },
  category: { type: String, required: true, trim: true, maxlength: 60 },
  label: { type: String, default: "Project", trim: true, maxlength: 60 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  stack: { type: [String], default: [] },
  color: { type: String, default: "violet", maxlength: 32 },
  variant: { type: String, default: "classroom", maxlength: 40 },
  featured: { type: Boolean, default: false },
}, commonOptions);

const CourseSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  slug: { type: String, required: true, unique: true, lowercase: true, maxlength: 120 },
  category: { type: String, trim: true, maxlength: 60 },
  level: { type: String, default: "Beginner", maxlength: 40 },
  lessons: { type: Number, default: 0, min: 0, max: 500 },
  duration: { type: String, maxlength: 60 },
  description: { type: String, maxlength: 3000 },
  icon: { type: String, maxlength: 50 },
  color: { type: String, maxlength: 32 },
  progress: { type: Number, default: 0, min: 0, max: 100 },
}, commonOptions);

const CertificateSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  slug: { type: String, required: true, unique: true, lowercase: true, maxlength: 120 },
  category: { type: String, default: "Course", maxlength: 60 },
  issued: { type: String, maxlength: 80 },
  level: { type: String, maxlength: 40 },
  code: { type: String, required: true, unique: true, sparse: true, trim: true, maxlength: 80 },
  color: { type: String, maxlength: 32 },
  description: { type: String, maxlength: 3000 },
}, commonOptions);

const ArticleSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, required: true, unique: true, lowercase: true, maxlength: 140 },
  category: { type: String, maxlength: 60 },
  date: { type: String, maxlength: 80 },
  readTime: { type: String, maxlength: 40 },
  excerpt: { type: String, maxlength: 500 },
  body: { type: String, maxlength: 12000 },
  variant: { type: String, maxlength: 40 },
}, commonOptions);

const TestimonialSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 90 },
  role: { type: String, maxlength: 100 },
  quote: { type: String, required: true, trim: true, maxlength: 1200 },
  initials: { type: String, maxlength: 8 },
  color: { type: String, maxlength: 32 },
}, commonOptions);

const ContactMessageSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 90 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
  subject: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ["new", "read", "replied", "archived"], default: "new" },
}, commonOptions);

const AdminUserSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 160 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: adminRoles, required: true, default: "viewer" },
  active: { type: Boolean, default: true },
  createdBy: { type: String, default: "environment" },
  lastLoginAt: { type: Date, default: null },
}, commonOptions);

const SiteSettingSchema = new Schema({
  key: { type: String, required: true, unique: true, maxlength: 100 },
  value: { type: Schema.Types.Mixed, default: null },
}, commonOptions);

const AdminAuditSchema = new Schema({
  actorId: { type: String, required: true },
  actorEmail: { type: String, required: true, lowercase: true },
  action: { type: String, required: true, maxlength: 80 },
  entity: { type: String, required: true, maxlength: 60 },
  entityId: { type: String, default: "", maxlength: 160 },
  summary: { type: String, required: true, maxlength: 240 },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, commonOptions);
AdminAuditSchema.index({ createdAt: -1 });

export const models = {
  projects: mongoose.models.Project || mongoose.model("Project", ProjectSchema),
  courses: mongoose.models.Course || mongoose.model("Course", CourseSchema),
  certificates: mongoose.models.Certificate || mongoose.model("Certificate", CertificateSchema),
  articles: mongoose.models.Article || mongoose.model("Article", ArticleSchema),
  testimonials: mongoose.models.Testimonial || mongoose.model("Testimonial", TestimonialSchema),
  messages: mongoose.models.ContactMessage || mongoose.model("ContactMessage", ContactMessageSchema),
  admins: mongoose.models.AdminUser || mongoose.model("AdminUser", AdminUserSchema),
  audit: mongoose.models.AdminAudit || mongoose.model("AdminAudit", AdminAuditSchema),
  settings: mongoose.models.SiteSetting || mongoose.model("SiteSetting", SiteSettingSchema),
};

export { adminRoles };
