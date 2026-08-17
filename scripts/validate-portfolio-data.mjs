import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  awards,
  certifications,
  credentialBadges,
  engineeringMetrics,
  experiences,
  featuredProjects,
  profile,
  publications,
  siteMeta,
} from "../src/data/portfolio.js";
import { caseStudies } from "../src/data/caseStudies.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function publicPathToFile(path) {
  assert(typeof path === "string" && path.startsWith("/"), `Expected public path, received: ${path}`);
  return join("public", path.replace(/^\//, ""));
}

function assertPublicAsset(path, label) {
  assert(path, `${label} path is required`);
  assert(existsSync(publicPathToFile(path)), `${label} is missing: ${path}`);
}

function assertUrl(value, label, { allowEmpty = false, internal = false } = {}) {
  if (allowEmpty && !value) return;
  assert(typeof value === "string" && value.trim(), `${label} must be a non-empty URL string`);
  if (internal) {
    assert(value.startsWith("/") || value.startsWith("#"), `${label} must be an internal path or anchor: ${value}`);
    return;
  }
  assert(/^https?:\/\//.test(value) || /^mailto:/.test(value), `${label} must be an absolute URL: ${value}`);
}

assert(profile.name, "Profile name is required");
assert(profile.email, "Profile email is required");
assertUrl(profile.linkedin, "LinkedIn URL");
assertUrl(profile.github, "GitHub URL");
assertPublicAsset(profile.resumePath, "Resume PDF");
assertPublicAsset(profile.photo, "Profile photo");
assert(profile.photoAlt, "Profile photo alt text is required");
assert(siteMeta.siteUrl && /^https?:\/\//.test(siteMeta.siteUrl), "siteMeta.siteUrl must be absolute");
assertPublicAsset(siteMeta.socialImage, "Social preview image");

const caseStudySlugs = new Set(caseStudies.map((study) => study.slug));
assert(caseStudySlugs.size === caseStudies.length, "Duplicate case study slug found");

const projectTitles = new Set();
for (const project of featuredProjects) {
  assert(project.title, "Featured project title is required");
  assert(!projectTitles.has(project.title), `Duplicate featured project title: ${project.title}`);
  projectTitles.add(project.title);
  assert(project.problem && project.solution, `${project.title} needs problem and solution copy`);
  assert(Array.isArray(project.tags) && project.tags.length, `${project.title} needs tags`);
  assert(Array.isArray(project.evidence) && project.evidence.length, `${project.title} needs evidence`);
  assertUrl(project.github, `${project.title} GitHub URL`);
  assertPublicAsset(project.screenshot, `${project.title} screenshot`);
  assert(project.screenshotAlt, `${project.title} screenshot alt text is required`);
  if (project.caseStudy) {
    assertUrl(project.caseStudy, `${project.title} case study path`, { internal: true });
    const slug = project.caseStudy.split("/").filter(Boolean).at(-1);
    assert(caseStudySlugs.has(slug), `${project.title} case study route has no matching case study data: ${project.caseStudy}`);
  }
  assertUrl(project.paper, `${project.title} paper URL`, { allowEmpty: true });
}

for (const study of caseStudies) {
  assert(study.slug && study.title, "Case study slug and title are required");
  assertUrl(study.repository, `${study.title} repository`);
  assertPublicAsset(study.image, `${study.title} image`);
  assert(study.imageAlt, `${study.title} image alt text is required`);
  for (const field of ["problem", "summary"]) assert(study[field], `${study.title} needs ${field}`);
  for (const field of ["objectives", "approach", "validation", "results", "technologies", "evidence"]) {
    assert(Array.isArray(study[field]) && study[field].length, `${study.title} needs ${field}`);
  }
}

for (const publication of publications) {
  assert(publication.title && publication.type && publication.year, "Publication title, type and year are required");
  assertUrl(publication.repository, `${publication.title} repository`);
  assertUrl(publication.doiUrl, `${publication.title} DOI URL`, { allowEmpty: true });
}

for (const metric of engineeringMetrics) {
  assert(metric.value && metric.label && metric.context, "Every engineering metric needs value, label and context");
  if (metric.sourceHref) assertUrl(metric.sourceHref, `${metric.label} evidence link`, { internal: true });
}

for (const experience of experiences) {
  assert(experience.company && experience.role && experience.dates, "Experience company, role and dates are required");
  assert(Array.isArray(experience.bullets) && experience.bullets.length, `${experience.company} needs bullets`);
}

for (const certification of certifications) {
  assert(certification.title && certification.issuer && certification.issued, "Certification title, issuer and issued date are required");
  assertPublicAsset(certification.image, `${certification.title} certificate image`);
  assert(certification.imageAlt, `${certification.title} image alt text is required`);
  assertUrl(certification.credentialUrl, `${certification.title} credential URL`, { allowEmpty: true });
}

for (const award of awards) {
  assert(award.title && award.issuer && award.issued, "Award title, issuer and issued date are required");
  assertUrl(award.verificationUrl, `${award.title} verification URL`, { allowEmpty: true });
}

const badgeIds = new Set();
for (const badge of credentialBadges) {
  assert(badge.id && badge.provider, "Credential badge id and provider are required");
  assert(!badgeIds.has(badge.id), `Duplicate credential badge id: ${badge.id}`);
  badgeIds.add(badge.id);
}

console.log(`Portfolio data validation passed. Projects: ${featuredProjects.length}, case studies: ${caseStudies.length}, certifications: ${certifications.length}`);
