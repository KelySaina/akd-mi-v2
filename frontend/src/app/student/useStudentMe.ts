'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export type StudentGrade = {
  id: string; enrollmentId: string; assessment: string;
  score: number; maxScore: number; comment: string | null; gradedAt: string;
};
export type StudentEnrollment = {
  id: string; studentId: string; courseId: string; teacherId: string | null;
  academicYear: string; semester: string | null; status: string;
  course: { id: string; code: string; title: string; credits: number };
  teacher: { id: string; user: { id: string; name: string; email: string; avatarUrl: string | null } } | null;
  grades: StudentGrade[];
};
export type StudentMe = {
  id: string;
  studentNumber: string;
  status: string;
  enrollmentYear: number | null;
  birthDate: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  user: { id: string; name: string; email: string; phone: string | null; avatarUrl: string | null; isActive: boolean };
  program: { id: string; name: string } | null;
  enrollments: StudentEnrollment[];
};

export function useStudentMe() {
  const [me, setMe] = useState<StudentMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setError(null);
    try { setMe(await api.get<StudentMe>('/students/me')); }
    catch (e: any) { setError(e.message); }
  }
  useEffect(() => { (async () => { setLoading(true); await reload(); setLoading(false); })(); }, []);
  return { me, loading, error, reload, setError };
}

export function computeAvg(grades: { score: number; maxScore: number }[]): number | null {
  if (!grades.length) return null;
  const pcts = grades.map((g) => (g.score / g.maxScore) * 100);
  return pcts.reduce((a, b) => a + b, 0) / pcts.length;
}
