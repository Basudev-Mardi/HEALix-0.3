export interface HospitalValue {
  title: string;
  description: string;
}

export interface HospitalInfo {
  id: number;
  name: string;
  tagline: string;
  founded_year: number;
  beds_count: number;
  doctors_count: number;
  specialties_count: number;
  patients_served: string;
  accreditation: string;
  phone: string;
  emergency_phone: string;
  ambulance_phone: string;
  email: string;
  address: string;
  about_summary: string;
  about_story: string;
  mission: string;
  vision: string;
  values_json: HospitalValue[];
  leadership_quote: string;
  leadership_name: string;
  leadership_title: string;
}

export interface Department {
  id?: number;
  slug: string;
  name: string;
  short_description: string;
  overview: string;
  icon: string;
  floor_location: string;
  head_doctor_name: string;
  beds_allocated: number;
  phone_ext: string;
  highlights: string[];
  conditions_treated: string[];
  equipment: string[];
  doctor_count?: number;
  service_count?: number;
  doctors?: Doctor[];
  services?: MedicalService[];
}

export interface Doctor {
  id?: number;
  slug: string;
  name: string;
  title: string;
  specialty: string;
  department_slug: string;
  department_name?: string;
  department_floor?: string;
  department_phone?: string;
  qualification: string;
  experience_years: number;
  languages: string[];
  bio: string;
  education: string[];
  awards: string[];
  consultation_days: string;
  consultation_hours: string;
  consultation_fee: string;
  avatar_initials: string;
  accent_tone: string;
  is_featured?: boolean;
  relatedDoctors?: Doctor[];
  departmentServices?: MedicalService[];
}

export interface MedicalService {
  id?: number;
  slug: string;
  name: string;
  category: string;
  department_slug: string;
  department_name?: string;
  department_floor?: string;
  department_phone?: string;
  short_description: string;
  overview: string;
  preparation_notes: string;
  duration_estimate: string;
  availability: string;
  key_features: string[];
  procedures: string[];
  is_featured?: boolean;
  specialists?: Doctor[];
  relatedServices?: MedicalService[];
}

export interface Facility {
  id: number;
  slug: string;
  name: string;
  category: string;
  floor_location: string;
  availability: string;
  description: string;
  highlights: string[];
  contact_phone?: string;
  contact_email?: string;
  capacity_or_specs?: string;
  visitor_policy?: string;
  guidelines?: string[];
  access_notes?: string;
}

export interface InfrastructureItem {
  id: number;
  title: string;
  category: string;
  metric_value: string;
  metric_label: string;
  description: string;
  specs: string[];
}

export interface GalleryItem {
  id: number;
  title: string;
  category: string;
  location: string;
  description: string;
  aspect_ratio: string;
  accent_palette: string;
}

export interface VisitingHour {
  id: number;
  unit_name: string;
  category: string;
  days: string;
  hours: string;
  max_visitors: string;
  guidelines: string;
}

export interface EmergencyProtocol {
  id: number;
  title: string;
  triage_level: string;
  response_time: string;
  phone: string;
  description: string;
  steps: string[];
}

export interface HomeData {
  hospital: HospitalInfo;
  departments: Department[];
  featuredDoctors: Doctor[];
  featuredServices: MedicalService[];
  infrastructureHighlights: InfrastructureItem[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AppointmentRecord {
  id?: number;
  booking_reference: string;
  doctor_slug: string;
  department_slug: string;
  appointment_date: string;
  time_slot: string;
  visit_type: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  patient_dob?: string | null;
  patient_gender?: string | null;
  reason_for_visit?: string | null;
  insurance_provider?: string | null;
  status: string;
  created_at?: string;
  doctor_name?: string;
  doctor_specialty?: string;
  doctor_qualification?: string;
  consultation_fee?: string;
  avatar_initials?: string;
  accent_tone?: string;
  department_name?: string;
  floor_location?: string;
  phone_ext?: string;
}

export interface AppointmentFaq {
  id: number;
  category: string;
  question: string;
  answer: string;
}


// Section D: Information and Support Interfaces

export interface ArticleSection {
  heading: string;
  paragraphs: string[];
}

export interface HealthArticle {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  author_name: string;
  author_title: string;
  author_doctor_slug?: string;
  published_date: string;
  read_minutes: number;
  tags: string[];
  key_takeaways: string[];
  body: ArticleSection[];
  is_featured?: boolean;
  related?: HealthArticle[];
}

export interface PackageTestGroup {
  group: string;
  items: string[];
}

export interface HealthPackage {
  slug: string;
  name: string;
  tier: string;
  category: string;
  price: number;
  original_price: number;
  ideal_for: string;
  short_description: string;
  overview: string;
  tests: PackageTestGroup[];
  preparation: string[];
  turnaround: string;
  duration: string;
  recommended_frequency: string;
  is_popular?: boolean;
  otherPackages?: HealthPackage[];
}

export interface InsurancePartner {
  name: string;
  partner_type: string;
  coverage_types: string[];
  cashless: boolean;
  helpline: string;
}

export interface GeneralFaq {
  category: string;
  question: string;
  answer: string;
}

export interface JobOpening {
  slug: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  experience: string;
  posted_date: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
}
