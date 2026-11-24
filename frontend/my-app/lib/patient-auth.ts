export interface PatientUser {
  id: number;
  mrn: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string | null;
  gender: string;
  blood_group: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  insurance_provider: string;
  insurance_policy_no: string;
  allergies: string[];
  notify_email: boolean;
  notify_sms: boolean;
  notify_lab_results: boolean;
  notify_reminders: boolean;
  two_factor_enabled: boolean;
}

export interface MedicalHistoryItem {
  id: number;
  record_type: string;
  title: string;
  recorded_date: string;
  doctor_name: string;
  department_name: string;
  status: string;
  summary: string;
}

export interface PrescriptionItem {
  id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribed_by: string;
  prescribed_date: string;
  status: string;
  refills_remaining: number;
  instructions: string;
}

export interface LabResultParameter {
  parameter: string;
  value: string;
  unit: string;
  reference: string;
  flag: string;
}

export interface LabReportItem {
  id: number;
  report_code: string;
  test_name: string;
  category: string;
  collected_date: string;
  ordered_by: string;
  status: string;
  summary: string;
  results_json: LabResultParameter[];
}

export interface RadiologyReportItem {
  id: number;
  study_code: string;
  modality: string;
  study_name: string;
  study_date: string;
  radiologist_name: string;
  status: string;
  findings: string;
  impression: string;
}

export interface BillingItem {
  id: number;
  invoice_number: string;
  service_description: string;
  department_name: string;
  billing_date: string;
  due_date: string;
  amount_total: number;
  insurance_covered: number;
  patient_responsibility: number;
  status: string;
  payment_method: string;
}

export interface NotificationItem {
  id: number;
  category: string;
  title: string;
  message: string;
  action_href: string;
  is_read: boolean;
  created_at: string;
}

const TOKEN_KEY = 'healix_patient_token';
const PATIENT_KEY = 'healix_patient_user';

export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
}

export function saveAuthSession(token: string, patient: PatientUser): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(PATIENT_KEY, JSON.stringify(patient));
  window.dispatchEvent(new Event('healix-auth-change'));
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredPatient(): PatientUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PATIENT_KEY);
    return raw ? (JSON.parse(raw) as PatientUser) : null;
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(PATIENT_KEY);
  window.dispatchEvent(new Event('healix-auth-change'));
}

export async function patientApiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const res = await fetch(`${getApiBase()}${path}`, {
      ...options,
      headers,
    });
    const json = (await res.json().catch(() => ({}))) as { data?: T; error?: string };
    if (res.status === 401) {
      clearAuthSession();
    }
    return { data: json.data, error: json.error, status: res.status };
  } catch {
    return {
      error: 'Unable to reach Healix API server. Please ensure the backend is running.',
      status: 0,
    };
  }
}
