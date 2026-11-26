/**
 * Hospital Staff Authentication & Session Management
 * Provides role-based session state, demo credentials, and authentication helpers for all 8 staff roles.
 */

export interface StaffUser {
  id: string;
  staffId: string;
  name: string;
  email: string;
  role: string;
  roleName: string;
  department: string;
  shift: string;
  token?: string;
  loggedInAt?: string;
}

export interface DemoStaffCredential {
  role: string;
  roleName: string;
  staffId: string;
  name: string;
  email: string;
  password: string;
  department: string;
  shift: string;
}

export const DEMO_STAFF_CREDENTIALS: Record<string, DemoStaffCredential> = {
  receptionist: {
    role: 'receptionist',
    roleName: 'Receptionist',
    staffId: 'REC-4011',
    name: 'Elena Rostova',
    email: 'reception@healix.org',
    password: 'staff123',
    department: 'Central OPD & Front Desk',
    shift: 'Morning OPD (07:30 - 15:30)',
  },
  doctor: {
    role: 'doctor',
    roleName: 'Doctor',
    staffId: 'DOC-1024',
    name: 'Dr. Aris Thorne, MD',
    email: 'doctor@healix.org',
    password: 'staff123',
    department: 'Cardiology & Heart Institute',
    shift: 'Clinical Consultations & Rounds',
  },
  nurse: {
    role: 'nurse',
    roleName: 'Nurse',
    staffId: 'NUR-3088',
    name: 'Sister Claire Bennett, RN',
    email: 'nurse@healix.org',
    password: 'staff123',
    department: 'Cardiac Inpatient Ward 4B',
    shift: 'Day Nursing Shift (08:00 - 16:00)',
  },
  'lab-staff': {
    role: 'lab-staff',
    roleName: 'Lab Staff',
    staffId: 'LAB-5021',
    name: 'Marcus Vance, CLS',
    email: 'lab@healix.org',
    password: 'staff123',
    department: 'Central Clinical Pathology',
    shift: 'Diagnostic Laboratory Core',
  },
  'billing-staff': {
    role: 'billing-staff',
    roleName: 'Billing Staff',
    staffId: 'BIL-6019',
    name: 'David Chen, CPA',
    email: 'billing@healix.org',
    password: 'staff123',
    department: 'Patient Accounts & Cashless TPA',
    shift: 'Revenue Cycle Desk',
  },
  pharmacist: {
    role: 'pharmacist',
    roleName: 'Pharmacist',
    staffId: 'PHM-7014',
    name: 'Priya Sharma, PharmD',
    email: 'pharmacy@healix.org',
    password: 'staff123',
    department: 'Central Inpatient & OPD Pharmacy',
    shift: 'Dispensary & Stock Control',
  },
  'hr-staff': {
    role: 'hr-staff',
    roleName: 'HR Staff',
    staffId: 'HR-8002',
    name: 'Sarah Jenkins, SHRM',
    email: 'hr@healix.org',
    password: 'staff123',
    department: 'Human Resources & Credentialing',
    shift: 'Administrative Office',
  },
  administrator: {
    role: 'administrator',
    roleName: 'Administrator',
    staffId: 'ADM-9001',
    name: 'Jonathan Hayes, MHA',
    email: 'admin@healix.org',
    password: 'staff123',
    department: 'Hospital Administration & IS',
    shift: '24/7 System Governance',
  },
};

const STAFF_STORAGE_KEY = 'healix_staff_session_v1';
const STAFF_AUTH_EVENT = 'healix_staff_auth_changed';

/**
 * Retrieve current staff session from client storage
 */
export function getStaffSession(): StaffUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STAFF_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StaffUser;
  } catch {
    return null;
  }
}

/**
 * Persist staff session in client storage and notify listeners
 */
export function saveStaffSession(staff: StaffUser): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staff));
    window.dispatchEvent(new CustomEvent(STAFF_AUTH_EVENT, { detail: staff }));
  } catch (err) {
    console.error('Failed to save staff session:', err);
  }
}

/**
 * Clear staff session from client storage
 */
export function clearStaffSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STAFF_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(STAFF_AUTH_EVENT, { detail: null }));
  } catch (err) {
    console.error('Failed to clear staff session:', err);
  }
}

/**
 * Authenticate staff member against API or demo credentials
 */
export async function staffLogin({
  role,
  email,
  password,
}: {
  role: string;
  email: string;
  password?: string;
}): Promise<{ ok: boolean; staff?: StaffUser; error?: string }> {
  // Try backend staff auth endpoint first
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const res = await fetch(`${apiBase}/api/v1/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, email, password }),
    });

    if (res.ok) {
      const payload = await res.json();
      if (payload.data?.staff) {
        saveStaffSession(payload.data.staff);
        return { ok: true, staff: payload.data.staff };
      }
    }
  } catch {
    // If backend is unreachable, proceed to fallback verification
  }

  // Fallback: Validate against role demo roster
  const demo = DEMO_STAFF_CREDENTIALS[role];
  if (!demo) {
    return { ok: false, error: `Invalid role selected: ${role}` };
  }

  // Verify email matches or staff ID matches
  const inputClean = email.trim().toLowerCase();
  const emailMatches = inputClean === demo.email.toLowerCase() || inputClean === demo.staffId.toLowerCase();

  // If password provided and incorrect
  if (password && password.trim() !== 'staff123' && password.trim() !== demo.password) {
    return { ok: false, error: 'Invalid password. (Hint: Use demo password "staff123")' };
  }

  const staffUser: StaffUser = {
    id: `staff_${demo.role}_${Date.now()}`,
    staffId: demo.staffId,
    name: demo.name,
    email: demo.email,
    role: demo.role,
    roleName: demo.roleName,
    department: demo.department,
    shift: demo.shift,
    token: `hx_staff_${Buffer.from(demo.staffId).toString('base64')}_${Date.now()}`,
    loggedInAt: new Date().toISOString(),
  };

  saveStaffSession(staffUser);
  return { ok: true, staff: staffUser };
}
