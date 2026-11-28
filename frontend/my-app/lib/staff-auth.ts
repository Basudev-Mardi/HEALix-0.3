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
 * Authenticate staff member against API or demo credentials with strict role verification
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
  const inputClean = email.trim().toLowerCase();
  if (!inputClean) {
    return { ok: false, error: 'Staff ID or email address is required.' };
  }

  if (!password) {
    return { ok: false, error: 'Staff password is required.' };
  }

  // 1. Attempt backend API authentication first
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const res = await fetch(`${apiBase}/api/v1/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, email: inputClean, password }),
    });

    const payload = await res.json().catch(() => null);

    if (res.ok && payload?.data?.staff) {
      saveStaffSession(payload.data.staff);
      return { ok: true, staff: payload.data.staff };
    }

    // If server returned an explicit error (e.g. Role Mismatch or Invalid Credentials), respect it
    if (payload?.error) {
      return { ok: false, error: payload.error };
    }
  } catch {
    // If backend is offline or network fails, proceed to resilient client-side verification
  }

  // 2. Client-side Verification across ALL staff roles in directory
  const matchedStaff = Object.values(DEMO_STAFF_CREDENTIALS).find(
    (entry) =>
      entry.email.toLowerCase() === inputClean ||
      entry.staffId.toLowerCase() === inputClean
  );

  if (!matchedStaff) {
    return {
      ok: false,
      error: 'Invalid credentials: Staff ID or email not found in hospital directory.',
    };
  }

  // Verify password
  if (password.trim() !== 'staff123' && password.trim() !== matchedStaff.password) {
    return { ok: false, error: 'Invalid password. Access denied. (Hint: Use demo password "staff123")' };
  }

  // Verify selected role matches the user's actual assigned role
  const normalizeRoleKey = (r?: string) => {
    if (!r) return '';
    const clean = String(r).trim().toLowerCase().replace(/[\s_]+/g, '-');
    const aliases: Record<string, string> = {
      admin: 'hr-staff',
      'hr-staff': 'hr-staff',
      'human-resources': 'hr-staff',
      administrator: 'administrator',
      'hospital-administrator': 'administrator',
      'hospital-admin': 'administrator',
      receptionist: 'receptionist',
      reception: 'receptionist',
      doctor: 'doctor',
      physician: 'doctor',
      nurse: 'nurse',
      'lab-staff': 'lab-staff',
      lab: 'lab-staff',
      laboratory: 'lab-staff',
      'laboratory-staff': 'lab-staff',
      pathologist: 'lab-staff',
      'billing-staff': 'billing-staff',
      billing: 'billing-staff',
      pharmacist: 'pharmacist',
      pharmacy: 'pharmacist',
    };
    return aliases[clean] || clean;
  };

  const requestedRoleKey = normalizeRoleKey(role);
  const actualRoleKey = normalizeRoleKey(matchedStaff.role);

  if (actualRoleKey !== requestedRoleKey) {
    return {
      ok: false,
      error: `Access Denied: The provided credentials belong to a ${matchedStaff.roleName} account, not ${role}. Please select your authorized role.`,
    };
  }

  const staffUser: StaffUser = {
    id: `staff_${matchedStaff.staffId}`,
    staffId: matchedStaff.staffId,
    name: matchedStaff.name,
    email: matchedStaff.email,
    role: matchedStaff.role,
    roleName: matchedStaff.roleName,
    department: matchedStaff.department,
    shift: matchedStaff.shift,
    token: `hx_staff_${Buffer.from(matchedStaff.staffId).toString('base64')}_${Date.now()}`,
    loggedInAt: new Date().toISOString(),
  };

  saveStaffSession(staffUser);
  return { ok: true, staff: staffUser };
}
