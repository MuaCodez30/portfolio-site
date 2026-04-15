export type ProjectKind = "featured" | "course" | "side" | "archive";

export type ProjectLinks = {
  repo?: string;
  demo?: string;
  writeup?: string;
};

export type ProjectEntry = {
  name: string;
  date: string;
  bullets: string[];
  kind: ProjectKind;
  /** Optional card badge override (e.g., "Community") */
  badge_label?: string;
  /** Manual sort within the same kind (lower first) */
  order?: number;
  context?: string;
  lede?: string;
  stack?: string[];
  links?: ProjectLinks;
  /** @deprecated prefer `kind: "archive"` */
  archive?: boolean;
};

export type LanguageEntry = {
  name: string;
  level: string;
};

export type ActivityEntry = {
  title: string;
  detail?: string;
};

export type SkillGroup = {
  name: string;
  items: string[];
};

export type EducationEntry = {
  institution: string;
  degree?: string;
  location: string;
  expected?: string;
  end?: string;
  highlights?: string[];
  /** Short portfolio paragraph */
  summary?: string;
  /** One line, e.g. focus area */
  focus?: string;
};

export type ExperienceEntry = {
  company: string;
  title: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
  summary?: string;
  stack?: string[];
};

export type HeroConfig = {
  tagline: string;
  subtagline: string;
  /** First-person intro under the headline */
  intro?: string;
};

export type SocialConfig = {
  linkedin: string;
  github?: string;
};

export type MentorshipConfig = {
  title: string;
  summary: string;
  bullets: string[];
};

export type SiteData = {
  name: string;
  location: {
    street: string;
    city: string;
    country: string;
    postal: string;
  };
  contact: {
    phone: string;
    email: string;
    linkedin_label: string;
  };
  hero: HeroConfig;
  social: SocialConfig;
  about: {
    paragraphs: string[];
  };
  education: EducationEntry[];
  experience: ExperienceEntry[];
  /** All projects, normalized with `kind` (includes merged archive entries) */
  projects: ProjectEntry[];
  mentorship?: MentorshipConfig;
  activities: ActivityEntry[];
  languages: LanguageEntry[];
  skill_groups: SkillGroup[];
  /** Preserved when present in YAML; optional after `skill_groups` migration */
  technical_skills_line?: string;
};
