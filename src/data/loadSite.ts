import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type {
  ActivityEntry,
  ExperienceEntry,
  LanguageEntry,
  ProjectEntry,
  ProjectKind,
  SiteData,
  SkillGroup,
} from "../types/site";

const DEFAULTS: Partial<SiteData> = {
  hero: {
    tagline: "Computer Science · Applied ML",
    subtagline: "Building data pipelines, experiments, and clear evaluations.",
  },
  social: {
    linkedin: "https://www.linkedin.com/in/your-handle",
    github: "https://github.com/your-handle",
  },
  about: {
    paragraphs: [
      "Placeholder bio — edit resume.yaml in the site root.",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    ],
  },
};

const KIND_ORDER: Record<ProjectKind, number> = {
  featured: 0,
  course: 1,
  side: 2,
  archive: 3,
};

function yamlPath(): string {
  const inSite = path.resolve(process.cwd(), "resume.yaml");
  if (fs.existsSync(inSite)) return inSite;
  const legacy = path.resolve(process.cwd(), "..", "resume.yaml");
  if (fs.existsSync(legacy)) return legacy;
  return inSite;
}

export function parseSkillsLine(line: string): string[] {
  return line
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeLanguages(input: unknown): LanguageEntry[] {
  if (Array.isArray(input)) {
    return (input as unknown[]).map((x) => {
      if (x && typeof x === "object" && "name" in (x as object)) {
        const o = x as { name: string; level?: string };
        return { name: o.name, level: o.level ?? "" };
      }
      return { name: String(x), level: "" };
    });
  }
  if (typeof input === "string" && input.trim()) {
    return input
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((part) => {
        const m = part.match(/^(.+?)\s*\(\s*([^)]+)\s*\)\s*$/);
        if (m) return { name: m[1].trim(), level: m[2].trim() };
        return { name: part, level: "" };
      });
  }
  return [];
}

function normalizeActivities(input: unknown): ActivityEntry[] {
  if (!Array.isArray(input)) return [];
  return (input as unknown[]).map((a) => {
    if (a && typeof a === "object" && "title" in (a as object)) {
      const o = a as { title: string; detail?: string };
      return { title: o.title, detail: o.detail };
    }
    return { title: String(a) };
  });
}

function normalizeSkillGroups(parsed: Record<string, unknown>): SkillGroup[] {
  const groups = parsed.skill_groups;
  if (Array.isArray(groups) && groups.length) {
    return (groups as SkillGroup[]).map((g) => ({
      name: g.name,
      items: Array.isArray(g.items) ? g.items.map(String) : [],
    }));
  }
  const line = parsed.technical_skills_line;
  if (typeof line === "string" && line.trim()) {
    return [{ name: "Tools & platforms", items: parseSkillsLine(line) }];
  }
  return [{ name: "Tools & platforms", items: [] }];
}

function coerceKind(k: unknown): ProjectKind {
  if (k === "featured" || k === "course" || k === "side" || k === "archive")
    return k;
  return "featured";
}

function normalizeOneProject(
  p: Record<string, unknown>,
  forceArchive: boolean,
): ProjectEntry {
  const name = String(p.name ?? "");
  const date = String(p.date ?? "");
  const bullets = Array.isArray(p.bullets)
    ? (p.bullets as unknown[]).map(String)
    : [];
  let kind = coerceKind(p.kind);
  if (forceArchive || p.archive === true) kind = "archive";
  else if (!p.kind && !p.archive) kind = "featured";

  const linksRaw = p.links as Record<string, unknown> | undefined;
  const links =
    linksRaw && typeof linksRaw === "object"
      ? {
          repo: linksRaw.repo ? String(linksRaw.repo) : undefined,
          demo: linksRaw.demo ? String(linksRaw.demo) : undefined,
          writeup: linksRaw.writeup ? String(linksRaw.writeup) : undefined,
        }
      : undefined;

  const stack = Array.isArray(p.stack)
    ? (p.stack as unknown[]).map(String)
    : undefined;

  return {
    name,
    date,
    bullets,
    kind,
    badge_label: p.badge_label ? String(p.badge_label) : undefined,
    order: typeof p.order === "number" ? p.order : undefined,
    context: p.context ? String(p.context) : undefined,
    lede: p.lede ? String(p.lede) : undefined,
    stack,
    links:
      links && (links.repo || links.demo || links.writeup) ? links : undefined,
  };
}

function normalizeProjects(parsed: Record<string, unknown>): ProjectEntry[] {
  const main = (Array.isArray(parsed.projects) ? parsed.projects : []) as Record<
    string,
    unknown
  >[];
  const archives = (
    Array.isArray(parsed.archive_projects) ? parsed.archive_projects : []
  ) as Record<string, unknown>[];

  const out: ProjectEntry[] = [];
  for (const p of main) {
    out.push(normalizeOneProject(p, false));
  }
  for (const p of archives) {
    out.push(normalizeOneProject(p, true));
  }

  out.sort((a, b) => {
    const kd = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    if (kd !== 0) return kd;
    const ao = a.order ?? 999;
    const bo = b.order ?? 999;
    if (ao !== bo) return ao - bo;
    return String(b.date).localeCompare(String(a.date));
  });

  return out;
}

function normalizeExperience(raw: unknown): ExperienceEntry[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Record<string, unknown>[]).map((job) => ({
    company: String(job.company ?? ""),
    title: String(job.title ?? ""),
    location: String(job.location ?? ""),
    start: String(job.start ?? ""),
    end: String(job.end ?? ""),
    bullets: Array.isArray(job.bullets)
      ? (job.bullets as unknown[]).map(String)
      : [],
    summary: job.summary ? String(job.summary) : undefined,
    stack: Array.isArray(job.stack)
      ? (job.stack as unknown[]).map(String)
      : undefined,
  }));
}

function normalizeEducation(raw: unknown): import("../types/site").EducationEntry[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Record<string, unknown>[]).map((e) => ({
    institution: String(e.institution ?? ""),
    degree: e.degree ? String(e.degree) : undefined,
    location: String(e.location ?? ""),
    expected: e.expected ? String(e.expected) : undefined,
    end: e.end ? String(e.end) : undefined,
    highlights: Array.isArray(e.highlights)
      ? (e.highlights as unknown[]).map(String)
      : undefined,
    summary: e.summary ? String(e.summary) : undefined,
    focus: e.focus ? String(e.focus) : undefined,
  }));
}

export function formatExperienceRange(start: string, end: string): string {
  return `${start} – ${end}`;
}

export function loadSite(): SiteData {
  const file = yamlPath();
  const raw = fs.readFileSync(file, "utf8");
  const parsed = yaml.load(raw) as Record<string, unknown>;

  const projects = normalizeProjects(parsed);
  if (!parsed.name || !projects.length) {
    throw new Error(`Invalid site data: missing name or projects (${file})`);
  }

  const heroRaw = (parsed.hero as Record<string, unknown>) || {};
  const hero = {
    ...DEFAULTS.hero,
    ...heroRaw,
    tagline: String(heroRaw.tagline ?? DEFAULTS.hero!.tagline),
    subtagline: String(heroRaw.subtagline ?? DEFAULTS.hero!.subtagline),
    intro: heroRaw.intro ? String(heroRaw.intro) : undefined,
  };

  const data: SiteData = {
    name: String(parsed.name),
    location: parsed.location as SiteData["location"],
    contact: parsed.contact as SiteData["contact"],
    hero,
    social: { ...DEFAULTS.social, ...(parsed.social as object) } as SiteData["social"],
    about: {
      paragraphs:
        (parsed.about as { paragraphs?: string[] })?.paragraphs ??
        DEFAULTS.about!.paragraphs,
    },
    education: normalizeEducation(parsed.education),
    experience: normalizeExperience(parsed.experience),
    projects,
    mentorship: parsed.mentorship as SiteData["mentorship"] | undefined,
    activities: normalizeActivities(parsed.activities),
    languages: normalizeLanguages(parsed.languages),
    skill_groups: normalizeSkillGroups(parsed),
    technical_skills_line:
      typeof parsed.technical_skills_line === "string"
        ? parsed.technical_skills_line
        : undefined,
  };

  return data;
}

export function kindLabel(kind: ProjectKind): string {
  switch (kind) {
    case "featured":
      return "Highlight";
    case "course":
      return "Coursework";
    case "side":
      return "Side project";
    case "archive":
      return "Earlier work";
    default:
      return "";
  }
}
