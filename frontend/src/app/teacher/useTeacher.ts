'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

export type TeacherEnrollment = {
  id: string;
  studentId: string;
  courseId: string;
  teacherId: string | null;
  academicYear: string;
  semester: string | null;
  status: string;
  course: { id: string; code: string; title: string; credits: number };
  student: { id: string; studentNumber: string; user: { id: string; name: string; email: string; avatarUrl: string | null } };
  teacher: { id: string; user: { id: string; name: string } } | null;
};

export type TeacherMe = {
  id: string;
  staffNumber: string | null;
  title: string | null;
  bio: string | null;
  specialties: string[];
  user: { id: string; name: string; email: string; phone: string | null; avatarUrl: string | null; isActive: boolean };
};

export function useTeacherEnrollments() {
  const [data, setData] = useState<TeacherEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setError(null);
    try { setData(await api.get<TeacherEnrollment[]>('/enrollments')); }
    catch (e: any) { setError(e.message); }
  }
  useEffect(() => { (async () => { setLoading(true); await reload(); setLoading(false); })(); }, []);
  return { data, loading, error, reload, setError };
}

export function useTeacherMe() {
  const [me, setMe] = useState<TeacherMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try { setMe(await api.get<TeacherMe>('/teachers/me')); }
      catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, []);
  return { me, loading, error };
}

// Group enrollments by course
export function useCoursesFromEnrollments(enrollments: TeacherEnrollment[]) {
  return useMemo(() => {
    const map = new Map<string, { course: TeacherEnrollment['course']; enrollments: TeacherEnrollment[]; years: Set<string> }>();
    for (const e of enrollments) {
      const slot = map.get(e.courseId) ?? { course: e.course, enrollments: [], years: new Set<string>() };
      slot.enrollments.push(e);
      slot.years.add(e.academicYear);
      map.set(e.courseId, slot);
    }
    return Array.from(map.values()).sort((a, b) => a.course.code.localeCompare(b.course.code));
  }, [enrollments]);
}
