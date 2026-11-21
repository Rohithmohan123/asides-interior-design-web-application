// Small, dependency-free validators. Each returns { value, errors }.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+\d][\d\s-]{6,18}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const str = (v) => (typeof v === 'string' ? v.trim() : '');

/** Local files under /images/ or photos on the Unsplash CDN; nothing else is accepted as a project image. */
export const isAllowedImage = (src) => src.startsWith('/images/') || src.startsWith('https://images.unsplash.com/photo-');

export const PROJECT_TYPES = ['Living room', 'Kitchen', 'Bedroom', 'Bathroom', 'Workspace', 'Commercial', 'Full home', 'Other'];
export const BUDGET_RANGES = ['Under ₹2 lakh', '₹2–5 lakh', '₹5–10 lakh', 'Above ₹10 lakh', 'Not sure yet'];

export function validateEnquiry(body = {}) {
  const errors = {};
  const value = {
    name: str(body.name),
    email: str(body.email).toLowerCase(),
    phone: str(body.phone),
    project_type: str(body.project_type),
    budget_range: str(body.budget_range),
    message: str(body.message),
    project_slug: str(body.project_slug)
  };
  if (value.name.length < 2 || value.name.length > 80) errors.name = 'Please enter your name (2–80 characters).';
  if (!EMAIL_RE.test(value.email) || value.email.length > 120) errors.email = 'Please enter a valid email address.';
  if (value.phone && !PHONE_RE.test(value.phone)) errors.phone = 'Please enter a valid phone number.';
  if (value.project_type && !PROJECT_TYPES.includes(value.project_type)) errors.project_type = 'Unknown project type.';
  if (value.budget_range && !BUDGET_RANGES.includes(value.budget_range)) errors.budget_range = 'Unknown budget range.';
  if (value.message.length < 10 || value.message.length > 2000) errors.message = 'Please describe your project (10–2000 characters).';
  if (value.project_slug && !SLUG_RE.test(value.project_slug)) errors.project_slug = 'Invalid project reference.';
  return { value, errors };
}

const strList = (v) => (Array.isArray(v) ? v.map(str).filter(Boolean).slice(0, 20) : []);
const intOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number.parseInt(v, 10));

export function validateProject(body = {}) {
  const errors = {};
  const value = {
    slug: str(body.slug),
    title: str(body.title),
    category_id: Number.parseInt(body.category_id, 10),
    location: str(body.location),
    area_sqft: intOrNull(body.area_sqft),
    year: intOrNull(body.year),
    style: str(body.style),
    summary: str(body.summary),
    description: str(body.description),
    highlights: strList(body.highlights),
    materials: strList(body.materials),
    cover_image: str(body.cover_image),
    gallery: strList(body.gallery),
    featured: body.featured ? 1 : 0,
    published: body.published === false || body.published === 0 ? 0 : 1
  };
  if (!SLUG_RE.test(value.slug) || value.slug.length > 80) errors.slug = 'Slug must be lowercase words joined by hyphens.';
  if (value.title.length < 3 || value.title.length > 120) errors.title = 'Title must be 3–120 characters.';
  if (!Number.isInteger(value.category_id)) errors.category_id = 'Choose a category.';
  if (value.area_sqft !== null && (!Number.isInteger(value.area_sqft) || value.area_sqft <= 0 || value.area_sqft > 100000)) errors.area_sqft = 'Area must be a positive whole number.';
  if (value.year !== null && (!Number.isInteger(value.year) || value.year < 1990 || value.year > 2100)) errors.year = 'Year looks invalid.';
  if (value.summary.length > 300) errors.summary = 'Summary must be 300 characters or fewer.';
  if (value.cover_image && !isAllowedImage(value.cover_image)) errors.cover_image = 'Images must be paths under /images/ or Unsplash CDN URLs.';
  if (value.gallery.some((g) => !isAllowedImage(g))) errors.gallery = 'Gallery images must be paths under /images/ or Unsplash CDN URLs.';
  return { value, errors };
}

export function validateCategory(body = {}) {
  const errors = {};
  const value = {
    slug: str(body.slug),
    name: str(body.name),
    description: str(body.description),
    sort_order: Number.parseInt(body.sort_order ?? 0, 10) || 0
  };
  if (!SLUG_RE.test(value.slug)) errors.slug = 'Slug must be lowercase words joined by hyphens.';
  if (value.name.length < 2 || value.name.length > 60) errors.name = 'Name must be 2–60 characters.';
  return { value, errors };
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
