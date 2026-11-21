export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  sort_order: number;
  project_count?: number;
}

export interface Project {
  id: number;
  slug: string;
  title: string;
  category_id: number;
  category: { id: number; slug: string; name: string };
  location: string;
  area_sqft: number | null;
  year: number | null;
  style: string;
  summary: string;
  description: string;
  highlights: string[];
  materials: string[];
  cover_image: string;
  gallery: string[];
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectDetail extends Project {
  related: Project[];
}

export type ProjectInput = Omit<Project, 'id' | 'category' | 'created_at' | 'updated_at'>;

export interface Enquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  project_type: string;
  budget_range: string;
  message: string;
  project_slug: string;
  status: 'new' | 'contacted' | 'closed';
  created_at: string;
}

export type EnquiryInput = Pick<Enquiry, 'name' | 'email' | 'phone' | 'project_type' | 'budget_range' | 'message' | 'project_slug'> & { website?: string };

export interface Meta {
  projectTypes: string[];
  budgetRanges: string[];
}

export interface AdminStats {
  projects: number;
  published: number;
  categories: number;
  newEnquiries: number;
  enquiries: number;
}

/** Shape of validation errors returned by the API (HTTP 409/422). */
export interface ApiError {
  error: string;
  fields?: Record<string, string>;
}
