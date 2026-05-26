// Per-category identity for the instance frontend.
// Color palettes are driven by CSS (see globals.css: [data-category="…"]).
// This module exposes the runtime category code plus icon + copy choices
// that components import directly.

import {
  GraduationCap, Library, BookOpen, Briefcase, Wrench, Baby, School, Building2,
  type LucideIcon,
} from 'lucide-react';

export type CategoryCode =
  | 'SCHOOL'
  | 'COLLEGE'
  | 'HIGH_SCHOOL'
  | 'UNIVERSITY'
  | 'TRAINING_CENTER'
  | 'VOCATIONAL'
  | 'KINDERGARTEN'
  | 'OTHER';

export const KNOWN_CATEGORIES: ReadonlyArray<CategoryCode> = [
  'SCHOOL', 'COLLEGE', 'HIGH_SCHOOL', 'UNIVERSITY',
  'TRAINING_CENTER', 'VOCATIONAL', 'KINDERGARTEN', 'OTHER',
];

export type CategoryTheme = {
  /** Stable identifier — matches `[data-category="…"]` in globals.css. */
  code: CategoryCode;
  /** Human label for UI badges/labels. */
  label: string;
  /** Icon shown in the top-left brand mark and login/register hero. */
  icon: LucideIcon;
  /** Short marketing line on the auth pages' artwork panel. */
  tagline: string;
  /** Secondary line. */
  subTagline: string;
  /** Generic noun used in body copy. e.g. "school", "campus", "training centre". */
  noun: string;
  /** Pluralized noun for stat tiles, e.g. "Students" or "Apprentices". */
  learnersLabel: string;
};

const THEMES: Record<CategoryCode, CategoryTheme> = {
  SCHOOL: {
    code: 'SCHOOL',
    label: 'School',
    icon: School,
    tagline: 'Run your school from one elegant place.',
    subTagline: 'Track students, classes and grades. Configure modules. Hand over reports — fast.',
    noun: 'school',
    learnersLabel: 'Students',
  },
  COLLEGE: {
    code: 'COLLEGE',
    label: 'College',
    icon: GraduationCap,
    tagline: 'Your college, beautifully orchestrated.',
    subTagline: 'Programs, faculty, enrolments and academic records — unified.',
    noun: 'college',
    learnersLabel: 'Students',
  },
  HIGH_SCHOOL: {
    code: 'HIGH_SCHOOL',
    label: 'High school',
    icon: BookOpen,
    tagline: 'Where your high school comes alive.',
    subTagline: 'Sections, subjects, attendance and report cards — all in sync.',
    noun: 'high school',
    learnersLabel: 'Pupils',
  },
  UNIVERSITY: {
    code: 'UNIVERSITY',
    label: 'University',
    icon: Library,
    tagline: 'Empower your campus.',
    subTagline: 'Faculties, departments, research and records — one platform, every term.',
    noun: 'campus',
    learnersLabel: 'Students',
  },
  TRAINING_CENTER: {
    code: 'TRAINING_CENTER',
    label: 'Training centre',
    icon: Briefcase,
    tagline: 'Train. Track. Certify.',
    subTagline: 'Run cohorts, manage attendance and ship certifications without friction.',
    noun: 'training centre',
    learnersLabel: 'Trainees',
  },
  VOCATIONAL: {
    code: 'VOCATIONAL',
    label: 'Vocational institute',
    icon: Wrench,
    tagline: 'Hands-on learning, organised.',
    subTagline: 'Workshops, modules and skill assessments — built for the trades.',
    noun: 'institute',
    learnersLabel: 'Apprentices',
  },
  KINDERGARTEN: {
    code: 'KINDERGARTEN',
    label: 'Kindergarten',
    icon: Baby,
    tagline: 'Where every little story begins.',
    subTagline: 'Care, learning and daily moments — kept close to families.',
    noun: 'kindergarten',
    learnersLabel: 'Children',
  },
  OTHER: {
    code: 'OTHER',
    label: 'Institution',
    icon: Building2,
    tagline: 'Manage your institution with confidence.',
    subTagline: 'One unified workspace for your people, programs and operations.',
    noun: 'institution',
    learnersLabel: 'Members',
  },
};

/** Normalise an unknown string into a known category code; fall back to SCHOOL. */
export function normalizeCategory(input: string | undefined | null): CategoryCode {
  if (!input) return 'SCHOOL';
  const up = input.toUpperCase();
  return (KNOWN_CATEGORIES as readonly string[]).includes(up) ? (up as CategoryCode) : 'SCHOOL';
}

/** Resolved category for *this* running instance (from build-time env). */
export const INSTANCE_CATEGORY: CategoryCode = normalizeCategory(
  process.env.NEXT_PUBLIC_INSTANCE_CATEGORY,
);

export function categoryTheme(code: CategoryCode = INSTANCE_CATEGORY): CategoryTheme {
  return THEMES[code];
}
