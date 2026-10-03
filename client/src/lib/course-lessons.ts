import type { Course, CourseLesson } from "@/lib/data";

export function buildCourseLessons(course: Pick<Course, "curriculum">): CourseLesson[] {
  return Array.isArray(course.curriculum)
    ? course.curriculum.filter((lesson) => lesson && typeof lesson.title === "string" && typeof lesson.content === "string")
    : [];
}
