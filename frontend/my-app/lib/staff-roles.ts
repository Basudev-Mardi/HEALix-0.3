/**
 * Hospital Staff Portal Role & Permission Architecture
 * Defines the 8 core hospital staff roles and their respective access boundaries.
 */

export interface StaffRolePermissions {
  menus: string[];
  modules: string[];
  actions: string[];
  data_access: string;
}

export interface StaffRole {
  id: string;
  name: string;
  slug: string;
  iconName:
    | 'ConciergeBell'
    | 'Stethoscope'
    | 'HeartPulse'
    | 'FlaskConical'
    | 'Receipt'
    | 'Pill'
    | 'Users'
    | 'ShieldCheck';
  dedicated_label: string;
  category: string;
  description: string;
  permissions: StaffRolePermissions;
}

export const STAFF_ROLES: StaffRole[] = [
  {
    id: 'receptionist',
    name: 'Receptionist',
    slug: 'receptionist',
    iconName: 'ConciergeBell',
    dedicated_label: 'Dedicated Dashboard',
    category: 'Front Desk & Triage',
    description: 'Patient check-in, OPD queue token issuance, doctor schedule consultation, and visitor pass management.',
    permissions: {
      menus: [
        'Patient Registration',
        'OPD Queue Board',
        'Doctor Schedules',
        'Appointment Booking',
        'Visitor Badges',
      ],
      modules: [
        'Patient Demographics',
        'Scheduling Engine',
        'OPD Token System',
        'General Enquiries Desk',
      ],
      actions: [
        'Register new patient MRN',
        'Book & reschedule appointments',
        'Issue OPD token',
        'Verify government/insurance ID',
        'Cancel appointment on request',
      ],
      data_access: 'Patient demographics, appointment timetables, and active OPD queue lists. Restricted from clinical histories and financial ledgers.',
    },
  },
  {
    id: 'doctor',
    name: 'Doctor',
    slug: 'doctor',
    iconName: 'Stethoscope',
    dedicated_label: 'Dedicated Dashboard',
    category: 'Clinical Care & Diagnostics',
    description: 'Consultation notes, electronic medical records review, e-prescriptions, and pathology/radiology test orders.',
    permissions: {
      menus: [
        'My Consultations',
        'Patient EHR / EMR',
        'Diagnostic Orders',
        'E-Prescription Desk',
        'Inpatient Rounds',
      ],
      modules: [
        'Electronic Health Records',
        'Diagnostic Test Ordering',
        'Digital Prescription Engine',
        'Clinical Decision Support',
      ],
      actions: [
        'Create clinical notes & diagnoses',
        'Prescribe medications & dosages',
        'Order lab and radiology tests',
        'Authorize discharge summaries',
        'Refer to secondary specialists',
      ],
      data_access: 'Full clinical and diagnostic records for all assigned, referred, and attending patients.',
    },
  },
  {
    id: 'nurse',
    name: 'Nurse',
    slug: 'nurse',
    iconName: 'HeartPulse',
    dedicated_label: 'Dedicated Dashboard',
    category: 'Inpatient & Triage Care',
    description: 'Bed board allocation, continuous vitals logging, Medication Administration Record (MAR), and shift handovers.',
    permissions: {
      menus: [
        'Ward Bed Board',
        'Vitals & Observations',
        'Medication MAR',
        'Nursing Shift Handovers',
        'Triage Queue',
      ],
      modules: [
        'Inpatient Ward Management',
        'Medication Administration (MAR)',
        'Vitals & Fluid Balance',
        'Emergency Triage Desk',
      ],
      actions: [
        'Record vitals & patient observations',
        'Sign off administered medication',
        'Update bed occupancy & sanitation state',
        'Log shift notes & handover summaries',
        'Trigger clinical alert / code call',
      ],
      data_access: 'Admitted ward patients, active treatment charts, doctor orders, and vital signs monitoring records.',
    },
  },
  {
    id: 'lab-staff',
    name: 'Lab Staff',
    slug: 'lab-staff',
    iconName: 'FlaskConical',
    dedicated_label: 'Dedicated Dashboard',
    category: 'Pathology & Diagnostics',
    description: 'Specimen barcoding, pathology test execution, structured result entry, and laboratory report authorization.',
    permissions: {
      menus: [
        'Specimen Intake & Barcodes',
        'Diagnostic Worklist',
        'Result Entry & Validation',
        'Report Authorization',
        'Equipment Calibration',
      ],
      modules: [
        'Laboratory Information System (LIS)',
        'Specimen Tracking',
        'Quality Control & Calibration',
        'Diagnostic Archive',
      ],
      actions: [
        'Acknowledge specimen receipt',
        'Enter quantitative & qualitative test values',
        'Attach automated analyzer outputs',
        'Validate and publish lab reports',
        'Flag critical/panic values to doctor',
      ],
      data_access: 'Assigned laboratory requisitions, sample metadata, analyzer outputs, and validated lab report records.',
    },
  },
  {
    id: 'billing-staff',
    name: 'Billing Staff',
    slug: 'billing-staff',
    iconName: 'Receipt',
    dedicated_label: 'Dedicated Dashboard',
    category: 'Revenue Cycle & Accounts',
    description: 'Patient invoicing, cashless insurance pre-authorization, TPA claims submission, payment receipts, and refunds.',
    permissions: {
      menus: [
        'Invoice Generator',
        'Cash & Card Counter',
        'Insurance & TPA Claims',
        'Discharge Financial Clearance',
        'Daily Revenue Ledger',
      ],
      modules: [
        'Billing & Invoicing Engine',
        'Insurance Pre-Auth Portal',
        'Payment Gateway Reconciliation',
        'Financial Audit Records',
      ],
      actions: [
        'Generate OPD & Inpatient itemized bills',
        'Collect card/cash/UPI payments',
        'Submit cashless insurance pre-auth',
        'Authorize discharge financial clearances',
        'Issue tax invoices & payment receipts',
      ],
      data_access: 'Invoices, insurance policies, payment transactions, and tariff masters. Strictly restricted from confidential clinical notes.',
    },
  },
  {
    id: 'pharmacist',
    name: 'Pharmacist',
    slug: 'pharmacist',
    iconName: 'Pill',
    dedicated_label: 'Dedicated Dashboard',
    category: 'Pharmacy & Formulary',
    description: 'E-prescription validation, medicine dispensing, batch & expiry monitoring, and stock inventory reorders.',
    permissions: {
      menus: [
        'Prescription Queue',
        'Dispense Medication',
        'Drug Inventory & Batches',
        'Expiry & Quarantine Alerts',
        'Purchase Requisitions',
      ],
      modules: [
        'Hospital Pharmacy Management',
        'Formulary Database',
        'Inventory & Batch Tracking',
        'Controlled Substance Log',
      ],
      actions: [
        'Verify doctor e-prescriptions',
        'Dispense drugs and print dosage labels',
        'Update physical inventory counts',
        'Quarantine expiring or recalled batches',
        'Raise purchase orders for depleted stock',
      ],
      data_access: 'Prescription orders, drug catalog, inventory stock levels, and controlled substance audit registers.',
    },
  },
  {
    id: 'hr-staff',
    name: 'HR Staff',
    slug: 'hr-staff',
    iconName: 'Users',
    dedicated_label: 'Dedicated Dashboard',
    category: 'Staffing & Credentials',
    description: 'Doctor and nursing duty rosters, clinical credentialing, medical license validation, and shift attendance.',
    permissions: {
      menus: [
        'Duty Rosters & Shifts',
        'Clinician Credentialing',
        'Staff Directory',
        'Attendance & Leave',
        'Compliance & Training',
      ],
      modules: [
        'Human Resources Management',
        'Clinical Privileging & Licenses',
        'Shift Scheduling System',
        'Attendance & Leave Tracking',
      ],
      actions: [
        'Create & publish monthly shift rosters',
        'Verify medical board licenses & diplomas',
        'Record staff onboarding & department assignments',
        'Approve shift swap requests',
        'Maintain emergency on-call contact lists',
      ],
      data_access: 'Hospital staff records, professional licenses, shift rosters, and attendance logs. Restricted from all patient data.',
    },
  },
  {
    id: 'administrator',
    name: 'Administrator',
    slug: 'administrator',
    iconName: 'ShieldCheck',
    dedicated_label: 'Dedicated Dashboard',
    category: 'System Governance & RBAC',
    description: 'Role-based access control, security audit logs, department configuration, database health, and hospital masters.',
    permissions: {
      menus: [
        'User & Role Permissions',
        'Hospital Master Configuration',
        'Security Audit Trail',
        'System Health & Backups',
        'Analytics & Compliance',
      ],
      modules: [
        'Role-Based Access Control (RBAC)',
        'Audit Logging & Security Center',
        'Hospital Master Data Management',
        'Database & Integration Monitor',
      ],
      actions: [
        'Provision & deactivate staff accounts',
        'Assign role permissions & departmental scopes',
        'Inspect immutable security access logs',
        'Trigger system database backups',
        'Configure external API integrations',
      ],
      data_access: 'Unrestricted administrative access across system configuration, user directories, audit logs, and institutional reporting.',
    },
  },
];
