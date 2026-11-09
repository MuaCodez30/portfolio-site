import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { SiteData } from "../types/site";

const REQUIRED: (keyof SiteData)[] = [
  "name", "role", "lede", "contact", "about", "experience", "featured", "projects", "education", "skills",
];

export function loadSite(): SiteData {
  const file = path.resolve(process.cwd(), "resume.yaml");
  const data = yaml.load(fs.readFileSync(file, "utf8")) as SiteData;
  const missing = REQUIRED.filter((k) => !data?.[k]);
  if (missing.length) throw new Error(`resume.yaml is missing: ${missing.join(", ")}`);
  return data;
}
