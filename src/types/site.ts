export type Experience = {
  company: string;
  title: string;
  location: string;
  start: string;
  end: string;
  url?: string;
  url_label?: string;
  metric?: string;
  note?: string;
  bullets: string[];
  tags: string[];
};

export type Publication = {
  title: string;
  venue: string;
  date: string;
  status: string;
  authors: string;
};

export type Project = {
  name: string;
  date: string;
  context?: string;
  metric?: string;
  lede: string;
  bullets?: string[];
  tags: string[];
  repo?: string;
  demo?: string;
  note?: string;
};

export type SiteData = {
  name: string;
  role: string;
  lede: string;
  status: string;
  location: string;
  updated: string;
  contact: { email: string; linkedin: string; github: string };
  about: string[];
  experience: Experience[];
  publications: Publication[];
  featured: Project[];
  projects: Project[];
  education: { institution: string; degree: string; date: string; detail?: string }[];
  skills: { group: string; items: string[] }[];
  languages: { name: string; level: string }[];
  activities: { title: string; detail: string }[];
};
