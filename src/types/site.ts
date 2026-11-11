export type Experience = {
  company: string;
  title: string;
  location?: string;
  start: string;
  end: string;
  url?: string;
  url_label?: string;
  website?: string;
  metric?: string;
  note?: string;
  summary: string;
  bullets?: string[];
  tags: string[];
  quote?: { text: string; author: string; role: string; url?: string };
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
  area?: string;
  date?: string;
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
  updated: string;
  contact: { email: string; linkedin: string; github: string };
  experience: Experience[];
  publications: Publication[];
  featured: Project[];
  projects: Project[];
  education: { institution: string; degree: string; date: string }[];
  skills: { group: string; items: string[] }[];
  languages: { name: string; level: string }[];
};
