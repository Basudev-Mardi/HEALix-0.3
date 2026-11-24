import { cacheLife } from 'next/cache';
import {
  FALLBACK_DEPARTMENTS,
  FALLBACK_DOCTORS,
  FALLBACK_EMERGENCY_PROTOCOLS,
  FALLBACK_FACILITIES,
  FALLBACK_GALLERY,
  FALLBACK_HOSPITAL,
  FALLBACK_INFRASTRUCTURE,
  FALLBACK_SERVICES,
  FALLBACK_VISITING_HOURS,
} from './fallback-data';
import type {
  Department,
  Doctor,
  EmergencyProtocol,
  Facility,
  GalleryItem,
  HomeData,
  HospitalInfo,
  InfrastructureItem,
  MedicalService,
  VisitingHour,
} from './types';

const API_BASE =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchApi<T>(endpoint: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${API_BASE}${endpoint}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T };
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function getHomeData(): Promise<HomeData> {
  'use cache';
  cacheLife('minutes');
  const live = await fetchApi<HomeData>('/home');
  if (live && live.hospital) return live;
  return {
    hospital: FALLBACK_HOSPITAL,
    departments: FALLBACK_DEPARTMENTS,
    featuredDoctors: FALLBACK_DOCTORS.filter((d) => d.is_featured),
    featuredServices: FALLBACK_SERVICES.filter((s) => s.is_featured),
    infrastructureHighlights: FALLBACK_INFRASTRUCTURE.slice(0, 4),
  };
}

export async function getHospitalInfo(): Promise<HospitalInfo> {
  'use cache';
  cacheLife('minutes');
  const live = await fetchApi<HospitalInfo>('/hospital');
  return live ?? FALLBACK_HOSPITAL;
}

export async function getInfrastructure(): Promise<InfrastructureItem[]> {
  'use cache';
  cacheLife('minutes');
  const live = await fetchApi<InfrastructureItem[]>('/infrastructure');
  return live ?? FALLBACK_INFRASTRUCTURE;
}

export async function getGallery(): Promise<GalleryItem[]> {
  'use cache';
  cacheLife('minutes');
  const live = await fetchApi<GalleryItem[]>('/gallery');
  return live ?? FALLBACK_GALLERY;
}

export async function getDepartments(): Promise<Department[]> {
  'use cache';
  cacheLife('minutes');
  const live = await fetchApi<Department[]>('/departments');
  return live ?? FALLBACK_DEPARTMENTS;
}

export async function getDepartmentBySlug(slug: string): Promise<Department | null> {
  'use cache';
  cacheLife('minutes');
  const live = await fetchApi<Department>(`/departments/${encodeURIComponent(slug)}`);
  if (live) return live;
  const fallback = FALLBACK_DEPARTMENTS.find((d) => d.slug === slug);
  if (!fallback) return null;
  return {
    ...fallback,
    doctors: FALLBACK_DOCTORS.filter((doc) => doc.department_slug === slug),
    services: FALLBACK_SERVICES.filter((srv) => srv.department_slug === slug),
  };
}

export async function getDoctors(): Promise<Doctor[]> {
  'use cache';
  cacheLife('minutes');
  const live = await fetchApi<Doctor[]>('/doctors');
  return live ?? FALLBACK_DOCTORS;
}

export async function getDoctorBySlug(slug: string): Promise<Doctor | null> {
  'use cache';
  cacheLife('minutes');
  const live = await fetchApi<Doctor>(`/doctors/${encodeURIComponent(slug)}`);
  if (live) return live;
  const fallback = FALLBACK_DOCTORS.find((d) => d.slug === slug);
  if (!fallback) return null;
  return {
    ...fallback,
    relatedDoctors: FALLBACK_DOCTORS.filter(
      (d) => d.department_slug === fallback.department_slug && d.slug !== slug
    ).slice(0, 3),
    departmentServices: FALLBACK_SERVICES.filter(
      (s) => s.department_slug === fallback.department_slug
    ),
  };
}

export async function getServices(): Promise<MedicalService[]> {
  'use cache';
  cacheLife('minutes');
  const live = await fetchApi<MedicalService[]>('/services');
  return live ?? FALLBACK_SERVICES;
}

export async function getServiceBySlug(slug: string): Promise<MedicalService | null> {
  'use cache';
  cacheLife('minutes');
  const live = await fetchApi<MedicalService>(`/services/${encodeURIComponent(slug)}`);
  if (live) return live;
  const fallback = FALLBACK_SERVICES.find((s) => s.slug === slug);
  if (!fallback) return null;
  return {
    ...fallback,
    specialists: FALLBACK_DOCTORS.filter((d) => d.department_slug === fallback.department_slug),
    relatedServices: FALLBACK_SERVICES.filter((s) => s.slug !== slug).slice(0, 3),
  };
}

export async function getFacilities(): Promise<Facility[]> {
  'use cache';
  cacheLife('minutes');
  const live = await fetchApi<Facility[]>('/facilities');
  return live ?? FALLBACK_FACILITIES;
}

export async function getVisitingHours(): Promise<{
  schedules: VisitingHour[];
  contact: Pick<HospitalInfo, 'phone' | 'emergency_phone' | 'address' | 'email'>;
}> {
  'use cache';
  cacheLife('minutes');
  const live = await fetchApi<{
    schedules: VisitingHour[];
    contact: Pick<HospitalInfo, 'phone' | 'emergency_phone' | 'address' | 'email'>;
  }>('/visiting-hours');
  if (live) return live;
  return {
    schedules: FALLBACK_VISITING_HOURS,
    contact: {
      phone: FALLBACK_HOSPITAL.phone,
      emergency_phone: FALLBACK_HOSPITAL.emergency_phone,
      address: FALLBACK_HOSPITAL.address,
      email: FALLBACK_HOSPITAL.email,
    },
  };
}

export async function getEmergencyInfo(): Promise<{
  contact: Pick<HospitalInfo, 'name' | 'phone' | 'emergency_phone' | 'ambulance_phone' | 'address'>;
  department: Department | null;
  protocols: EmergencyProtocol[];
}> {
  'use cache';
  cacheLife('minutes');
  const live = await fetchApi<{
    contact: Pick<HospitalInfo, 'name' | 'phone' | 'emergency_phone' | 'ambulance_phone' | 'address'>;
    department: Department | null;
    protocols: EmergencyProtocol[];
  }>('/emergency');
  if (live) return live;
  return {
    contact: {
      name: FALLBACK_HOSPITAL.name,
      phone: FALLBACK_HOSPITAL.phone,
      emergency_phone: FALLBACK_HOSPITAL.emergency_phone,
      ambulance_phone: FALLBACK_HOSPITAL.ambulance_phone,
      address: FALLBACK_HOSPITAL.address,
    },
    department: FALLBACK_DEPARTMENTS.find((d) => d.slug === 'emergency-critical-care') ?? null,
    protocols: FALLBACK_EMERGENCY_PROTOCOLS,
  };
}
