// Maps the institution's chosen landing template (music, agri, tech, etc.) to
// a brand mark (lucide icon) + marketing copy for the auth/login/register
// pages. The same `landingTemplate` value drives the public landing page in
// `frontend/src/components/landing/*Landing.tsx`, so the auth UI now visually
// matches whatever theme the admin picked under /admin/site.

import {
  GraduationCap, Layers, Circle, BookOpen, Sparkles, Briefcase, School,
  Cpu, Palette, ShoppingBag, Scissors, Smile, ChefHat, Trophy, Music,
  Languages, Stethoscope, Sprout,
  type LucideIcon,
} from 'lucide-react';
import { LANDING_TEMPLATES, type LandingTemplateId } from '@/components/landing/types';

export type TemplateBrand = {
  id: LandingTemplateId;
  /** Icon used in the auth pages' brand mark (top-left logo, hero badge). */
  icon: LucideIcon;
  /** Big tagline rendered on the auth artwork panel. */
  tagline: string;
  /** Supporting line below the tagline. */
  subTagline: string;
  /** Label for the "learners count" stat tile on the login art. */
  learnersLabel: string;
};

const BRANDS: Record<LandingTemplateId, TemplateBrand> = {
  classic:   { id: 'classic',   icon: GraduationCap, tagline: 'Run your institution from one elegant place.', subTagline: 'Track students, classes and grades. Configure modules. Hand over reports — fast.', learnersLabel: 'Students' },
  modern:    { id: 'modern',    icon: Layers,        tagline: 'Learning, redesigned for today.',               subTagline: 'A clean, modern workspace for your programs, your people and your data.', learnersLabel: 'Students' },
  minimal:   { id: 'minimal',   icon: Circle,        tagline: 'Less, but better.',                             subTagline: 'A quiet workspace — clear typography, generous space, zero clutter.', learnersLabel: 'Students' },
  editorial: { id: 'editorial', icon: BookOpen,      tagline: 'Stories worth telling, taught well.',           subTagline: 'A magazine-grade workspace for institutions that take their words seriously.', learnersLabel: 'Readers' },
  vibrant:   { id: 'vibrant',   icon: Sparkles,      tagline: 'Where energy meets learning.',                  subTagline: 'Bold, alive and built to move — for institutions that refuse to be quiet.', learnersLabel: 'Students' },
  corporate: { id: 'corporate', icon: Briefcase,     tagline: 'Professional learning, organised.',             subTagline: 'Cohorts, programs, reporting — the operations toolkit your team trusts.', learnersLabel: 'Learners' },
  academic:  { id: 'academic',  icon: School,        tagline: 'Excellence, honoured.',                          subTagline: 'A dignified workspace for the institutions that built the discipline.', learnersLabel: 'Scholars' },
  tech:      { id: 'tech',      icon: Cpu,           tagline: 'Build the next great thing.',                   subTagline: 'A workspace for bootcamps, dev schools and the curious minds inside them.', learnersLabel: 'Devs' },
  art:       { id: 'art',       icon: Palette,       tagline: 'Create without limits.',                        subTagline: 'A bold canvas for art, design and fashion schools that take craft seriously.', learnersLabel: 'Artists' },
  boutique:  { id: 'boutique',  icon: ShoppingBag,   tagline: 'Curated learning, beautifully shelved.',        subTagline: 'Programs that read like a catalog. For boutique academies and ateliers.', learnersLabel: 'Members' },
  salon:     { id: 'salon',     icon: Scissors,      tagline: 'Beauty, mastered.',                              subTagline: 'A warm, polished workspace for salons, spas and wellness schools.', learnersLabel: 'Students' },
  kids:      { id: 'kids',      icon: Smile,         tagline: 'Where every little story begins.',              subTagline: 'Care, learning and daily moments — kept close to families.', learnersLabel: 'Children' },
  culinary:  { id: 'culinary',  icon: ChefHat,       tagline: 'The kitchen is your classroom.',                subTagline: 'For culinary schools and pastry academies who teach with their hands.', learnersLabel: 'Cooks' },
  sports:    { id: 'sports',    icon: Trophy,        tagline: 'Train hard. Perform harder.',                   subTagline: 'A high-energy workspace for sports academies and fitness schools.', learnersLabel: 'Athletes' },
  music:     { id: 'music',     icon: Music,         tagline: 'Where every note begins.',                      subTagline: 'A concert-hall workspace for conservatories and music schools.', learnersLabel: 'Musicians' },
  language:  { id: 'language',  icon: Languages,     tagline: 'Speak the world.',                              subTagline: 'A multilingual workspace for language schools and translation institutes.', learnersLabel: 'Speakers' },
  medical:   { id: 'medical',   icon: Stethoscope,   tagline: 'Care, taught with confidence.',                 subTagline: 'A calm, clinical workspace for nursing and medical institutions.', learnersLabel: 'Students' },
  agri:      { id: 'agri',      icon: Sprout,        tagline: 'Cultivate. Learn. Grow.',                       subTagline: 'An earthy workspace for agriculture and sustainability schools.', learnersLabel: 'Apprentices' },
};

const VALID: ReadonlyArray<LandingTemplateId> = LANDING_TEMPLATES.map((t) => t.id);

export function isLandingTemplateId(v: unknown): v is LandingTemplateId {
  return typeof v === 'string' && (VALID as readonly string[]).includes(v);
}

export function templateBrand(id: string | undefined | null): TemplateBrand {
  if (isLandingTemplateId(id)) return BRANDS[id];
  return BRANDS.classic;
}
