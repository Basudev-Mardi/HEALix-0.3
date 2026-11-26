'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Clock,
  Stethoscope,
  CheckCircle2,
  CalendarCheck,
  Siren,
  UserCheck,
  RefreshCw,
  Search,
  AlertCircle,
  Activity,
  CircleDot,
  Radio,
  Layers,
  TrendingUp,
  UserPlus,
  CreditCard,
  Languages,
  ExternalLink,
  ShieldAlert,
  Tv,
  Menu,
  ChevronRight,
  ShieldCheck,
  Ticket,
  History,
  BarChart3,
  Settings,
  Lock,
} from 'lucide-react';
import { getStaffSession, type StaffUser } from '@/lib/staff-auth';
import ReceptionistSidebar, { type ReceptionViewKey } from './ReceptionistSidebar';
import PatientRegistrationForm from './PatientRegistrationForm';
import PatientSearchLookup from './PatientSearchLookup';
import PatientProfileModal from './PatientProfileModal';
import LiveQueueManager from './LiveQueueManager';
import AppointmentManager from './AppointmentManager';
import BillingDeskManager from './BillingDeskManager';
import EmergencyIntakeModal from './EmergencyIntakeModal';
import {
  DoctorAvailabilityView,
  VisitHistoryView,
  ReceptionReportsView,
  ReceptionSettingsView,
} from './ReceptionistExtraViews';

export type DashboardLanguage = 'en' | 'es' | 'hi' | 'fr';

const I18N = {
  en: {
    liveFrontDesk: 'Live Front Desk',
    title: 'Hospital Management System',
    sectionName: 'Reception Operations & Queue Control',
    subtitle: 'Real-time patient intake, doctor cabin availability, and live queue status.',
    autoSync: 'Auto-sync',
    paused: 'Auto-sync Paused',
    refresh: 'Refresh',
    refreshing: 'Refreshing...',
    emergencyIntake: 'Emergency Intake & Alert',
    launchTV: 'Digital Queue TV',
    queueOverview: 'Live Queue & Overview',
    appointmentsDesk: 'Appointments Desk',
    billingDesk: 'Billing & Payments',
    searchDirectory: 'Patient Search & Directory',
    newRegistration: '+ Register New Patient',
    activeStation: 'Active Station',
    databaseStream: 'Database Real-time Stream Online',
    smsGateway: 'SMS Gateway',
    whatsappGateway: 'WhatsApp API',
    unconfigured: 'Unconfigured (Live dispatch blocked per policy)',
    configured: 'Configured & Online',
    activeAlertBanner: 'ACTIVE CLINICAL ALERT',
  },
  es: {
    liveFrontDesk: 'Mesa de Recepción en Vivo',
    title: 'Hospital Management System',
    sectionName: 'Operaciones de Recepción y Control de Colas',
    subtitle: 'Admisión de pacientes en tiempo real, disponibilidad de consultorios y estado de la cola.',
    autoSync: 'Auto-sincronización',
    paused: 'Sincronización Pausada',
    refresh: 'Actualizar',
    refreshing: 'Actualizando...',
    emergencyIntake: 'Admisión de Emergencia y Alerta',
    launchTV: 'Pantalla de TV de Colas',
    queueOverview: 'Cola en Vivo y Resumen',
    appointmentsDesk: 'Gestión de Citas',
    billingDesk: 'Facturación y Pagos',
    searchDirectory: 'Búsqueda de Pacientes',
    newRegistration: '+ Registrar Nuevo Paciente',
    activeStation: 'Puesto Activo',
    databaseStream: 'Transmisión de Base de Datos en Línea',
    smsGateway: 'Pasarela SMS',
    whatsappGateway: 'API de WhatsApp',
    unconfigured: 'No Configurado (Envíos bloqueados por política)',
    configured: 'Configurado y en Línea',
    activeAlertBanner: 'ALERTA CLÍNICA ACTIVA',
  },
  hi: {
    liveFrontDesk: 'लाइव फ्रंट डेस्क',
    title: 'Hospital Management System',
    sectionName: 'रिसेप्शन संचालन एवं कतार नियंत्रण',
    subtitle: 'वास्तविक समय में रोगी पंजीकरण, डॉक्टर उपलब्धता और कतार की स्थिति।',
    autoSync: 'स्वतः सिंक',
    paused: 'सिंक रोक दिया गया',
    refresh: 'रिफ्रेश करें',
    refreshing: 'लोड हो रहा है...',
    emergencyIntake: 'आपातकालीन प्रवेश एवं अलर्ट',
    launchTV: 'डिजिटल कतार टीवी स्क्रीन',
    queueOverview: 'लाइव कतार एवं विवरण',
    appointmentsDesk: 'अपॉइंटमेंट डेस्क',
    billingDesk: 'बिलिंग एवं भुगतान',
    searchDirectory: 'मरीज़ खोजें',
    newRegistration: '+ नया मरीज़ पंजीकृत करें',
    activeStation: 'सक्रिय डेस्क',
    databaseStream: 'डेटाबेस रियल-टाइम स्ट्रीम ऑनलाइन',
    smsGateway: 'एसएमएस गेटवे',
    whatsappGateway: 'व्हाट्सएप एपीआई',
    unconfigured: 'असंबद्ध (डिलीवरी नीति अनुसार रोकी गई)',
    configured: 'सक्रिय एवं कनेक्टेड',
    activeAlertBanner: 'सक्रिय आपातकालीन अलर्ट',
  },
  fr: {
    liveFrontDesk: 'Accueil en Direct',
    title: 'Hospital Management System',
    sectionName: 'Opérations de Réception & Contrôle de File',
    subtitle: 'Enregistrement en temps réel, disponibilité des cabinets et suivi de file.',
    autoSync: 'Auto-sync',
    paused: 'Auto-sync en pause',
    refresh: 'Actualiser',
    refreshing: 'Actualisation...',
    emergencyIntake: 'Admission Urgences & Alerte',
    launchTV: 'Écran TV d’Attente',
    queueOverview: 'File d’Attente en Direct',
    appointmentsDesk: 'Gestion des Rendez-vous',
    billingDesk: 'Facturación & Paiements',
    searchDirectory: 'Recherche de Patients',
    newRegistration: '+ Nouveau Patient',
    activeStation: 'Poste Actif',
    databaseStream: 'Flux de Données en Direct Connecté',
    smsGateway: 'Passerelle SMS',
    whatsappGateway: 'API WhatsApp',
    unconfigured: 'Non configuré (Envois bloqués selon la politique)',
    configured: 'Configuré et en ligne',
    activeAlertBanner: 'ALERTE CLINIQUE ACTIVE',
  },
};

interface DashboardStats {
  patientsRegisteredToday: number;
  patientsCurrentlyWaiting: number;
  patientsCurrentlyConsulting: number;
  completedConsultations: number;
  upcomingAppointments: number;
  emergencyPatients: number;
  availableDoctors: number;
  totalDoctors: number;
}

interface DepartmentQueue {
  departmentId: number;
  departmentName: string;
  departmentSlug: string;
  waitingCount: number;
  currentToken: number | null;
  servingTokenId?: string | null;
  doctorName?: string | null;
  patientName?: string | null;
  servingStatus?: string | null;
  avgWaitMins: number;
}

interface ActiveServingToken {
  tokenId: string;
  tokenNumber: number;
  status: string;
  patientId: string;
  patientName: string;
  mobile: string;
  gender: string;
  bloodGroup: string;
  doctorId: number;
  doctorName: string;
  roomOrCabin: string;
  departmentId: number;
  departmentName: string;
  visitType: string;
  createdAt: string;
}

interface UpcomingQueueEntry {
  tokenId: string;
  tokenNumber: number;
  status: string;
  patientId: string;
  patientName: string;
  mobile: string;
  bloodGroup: string;
  doctorId: number;
  doctorName: string;
  departmentId: number;
  departmentName: string;
  visitType: string;
  checkInTime: string;
}

interface HourlyProgression {
  hour: string;
  registered: number;
  waiting: number;
  completed: number;
}

interface ReceptionDashboardData {
  stats: DashboardStats;
  departmentQueues: DepartmentQueue[];
  activeServing: ActiveServingToken[];
  upcomingQueue: UpcomingQueueEntry[];
  hourlyProgression: HourlyProgression[];
  timestamp: string;
}

const AUTO_REFRESH_INTERVAL_SECONDS = 20;

export default function ReceptionistDashboard() {
  const [session, setSession] = useState<StaffUser | null>(null);
  const [data, setData] = useState<ReceptionDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(AUTO_REFRESH_INTERVAL_SECONDS);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Navigation View State (10 Portal Views)
  const [activeView, setActiveView] = useState<ReceptionViewKey>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const [selectedQueuePatientId, setSelectedQueuePatientId] = useState<string | null>(null);

  // Multilingual State
  const [currentLang, setCurrentLang] = useState<DashboardLanguage>('en');
  const t = I18N[currentLang];

  // Emergency Intake Modal & Live Alert state
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [activeAlert, setActiveAlert] = useState<{
    alert_type: string;
    location: string;
    severity: string;
    triggered_at: string;
  } | null>(null);

  // Integrations state (SMS / WhatsApp)
  const [integrationsStatus, setIntegrationsStatus] = useState<{
    twilio_sms: { configured: boolean; message: string };
    whatsapp: { configured: boolean; message: string };
  } | null>(null);

  // Load session & URL sync
  useEffect(() => {
    setSession(getStaffSession());

    // Check query params for direct deep links e.g. ?view=appointments
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlView = params.get('view') as ReceptionViewKey | null;
      const validViews: ReceptionViewKey[] = [
        'dashboard',
        'registration',
        'directory',
        'tokens',
        'appointments',
        'doctors',
        'billing',
        'history',
        'reports',
        'settings',
      ];
      if (urlView && validViews.includes(urlView)) {
        setActiveView(urlView);
      }
    }
  }, []);

  // Sync active view to URL without full page reload
  const handleSelectView = (view: ReceptionViewKey) => {
    setActiveView(view);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', view);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Live Clock updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Dashboard Data from Backend
  const fetchDashboardData = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setRefreshing(true);
    }
    setError(null);

    try {
      let res: Response;
      try {
        res = await fetch('/api/v1/reception/dashboard', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
      } catch {
        res = await fetch('http://localhost:5000/api/v1/reception/dashboard', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
      }

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (json && json.stats) {
        setData(json);
      } else {
        throw new Error('Unexpected response format from reception API');
      }

      // Concurrently fetch active emergency alerts
      try {
        let alertRes = await fetch('/api/v1/reception/emergency/alerts');
        if (!alertRes.ok) {
          alertRes = await fetch('http://localhost:5000/api/v1/reception/emergency/alerts');
        }
        if (alertRes.ok) {
          const alertJson = await alertRes.json();
          if (alertJson.has_active_emergency && alertJson.active_alerts?.length > 0) {
            setActiveAlert(alertJson.active_alerts[0]);
          } else {
            setActiveAlert(null);
          }
        }
      } catch {
        // Silently skip
      }

      // Concurrently fetch integrations configuration status
      try {
        let intRes = await fetch('/api/v1/reception/integrations/status');
        if (!intRes.ok) {
          intRes = await fetch('http://localhost:5000/api/v1/reception/integrations/status');
        }
        if (intRes.ok) {
          const intJson = await intRes.json();
          setIntegrationsStatus(intJson.integrations);
        }
      } catch {
        // Non-blocking
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to Reception API';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(AUTO_REFRESH_INTERVAL_SECONDS);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  // Auto-refresh countdown interval
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchDashboardData(true);
          return AUTO_REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled, fetchDashboardData]);

  // User permission check
  const isAuthorized =
    !session || session.role === 'receptionist' || session.role === 'administrator';

  // Navigation Title Mapping for Breadcrumbs
  const viewTitles: Record<ReceptionViewKey, string> = {
    dashboard: 'Live Reception Dashboard',
    registration: 'New Patient Registration',
    directory: 'Patient Directory',
    tokens: 'OPD Token Management',
    appointments: 'Appointments Desk',
    doctors: 'Doctor Availability & Workload',
    billing: 'Billing & Cashier Desk',
    history: 'Consultation Visit History',
    reports: 'Operational Analytics & Reports',
    settings: 'Reception Portal Settings',
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col lg:flex-row font-sans text-[#1F2421]">
      {/* ========================================================
          1. RECEPTION PORTAL SIDEBAR
      ======================================================== */}
      <ReceptionistSidebar
        activeView={activeView}
        onSelectView={handleSelectView}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        staffUser={session}
        stats={{
          waitingCount: data?.stats?.patientsCurrentlyWaiting,
          upcomingAppointments: data?.stats?.upcomingAppointments,
          emergencyWaiting: data?.stats?.emergencyPatients,
        }}
      />

      {/* ========================================================
          2. MAIN PORTAL WORKSPACE
      ======================================================== */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Operational Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-[#E5E8E6] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-[#E5E8E6] text-[#77817C] hover:text-[#1F2421] hover:bg-[#FAFAF7] cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb Header */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#77817C] uppercase tracking-wider">
                <span>Hospital Management System</span>
                <ChevronRight className="h-3 w-3 text-[#77817C]/60" />
                <span className="text-[#174C40] font-semibold">Reception</span>
              </div>
              <h1 className="text-lg sm:text-xl font-serif font-bold text-[#1F2421] tracking-tight">
                {viewTitles[activeView]}
              </h1>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
            {/* Multilingual Selector */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] text-xs font-medium text-[#1F2421]">
              <Languages className="h-3.5 w-3.5 text-[#174C40]" />
              <select
                value={currentLang}
                onChange={(e) => setCurrentLang(e.target.value as DashboardLanguage)}
                className="bg-transparent border-none text-xs font-medium text-[#1F2421] focus:outline-hidden cursor-pointer"
                title="Select language"
              >
                <option value="en">English (US)</option>
                <option value="es">Español (ES)</option>
                <option value="hi">हिन्दी (IN)</option>
                <option value="fr">Français (FR)</option>
              </select>
            </div>

            {/* Launch Digital Queue TV */}
            <a
              href="/display/opd-queue"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FAFAF7] hover:bg-[#F0F2F0] border border-[#E5E8E6] text-xs font-semibold text-[#174C40] shadow-2xs transition-colors cursor-pointer"
              title="Launch digital waiting TV screen"
            >
              <Tv className="h-3.5 w-3.5 text-[#174C40]" />
              <span>TV Display</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>

            {/* Emergency Intake Button */}
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Admit trauma arrival or raise hospital emergency alert"
            >
              <Siren className="h-3.5 w-3.5 animate-bounce" />
              <span className="hidden sm:inline">Emergency Intake</span>
              <span className="sm:hidden">Emergency</span>
            </button>

            {/* Live Clock */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] text-xs font-mono text-[#1F2421]">
              <Clock className="h-3.5 w-3.5 text-[#174C40]" />
              <span className="font-semibold">{currentTime || '--:--:--'}</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchDashboardData(false)}
              disabled={refreshing}
              className="p-2 rounded-2xl bg-[#174C40] hover:bg-[#123B32] text-white shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
              title="Refresh telemetry"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Active Emergency Alert Banner */}
          {activeAlert && (
            <div className="rounded-2xl border-2 border-red-500 bg-red-600 text-white p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-3">
                <Siren className="h-6 w-6 text-white shrink-0 animate-bounce" />
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest font-bold">
                    {t.activeAlertBanner}: {activeAlert.alert_type}
                  </div>
                  <div className="text-sm font-semibold">
                    Location: {activeAlert.location} • Severity: {activeAlert.severity}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowEmergencyModal(true)}
                className="px-4 py-1.5 rounded-xl bg-white text-red-700 font-bold text-xs shadow-xs hover:bg-red-50 transition-colors cursor-pointer self-start sm:self-auto"
              >
                Respond to Code
              </button>
            </div>
          )}

          {/* User Permission Restriction Notice if not receptionist or admin */}
          {!isAuthorized ? (
            <div className="p-8 rounded-3xl border border-rose-200 bg-rose-50 text-center space-y-3">
              <ShieldAlert className="h-12 w-12 text-rose-600 mx-auto" />
              <h2 className="text-lg font-serif font-bold text-rose-900">
                Access Restricted per Hospital Security Governance
              </h2>
              <p className="text-xs text-rose-700 max-w-md mx-auto">
                You are currently signed in under the role <strong>{session?.roleName || session?.role}</strong>. The Reception Operations Portal requires verified Front Desk Receptionist or Administrator authorization credentials.
              </p>
            </div>
          ) : (
            <>
              {/* ========================================================
                  VIEW 1: DASHBOARD (LIVE OVERVIEW & TELEMETRY)
              ======================================================== */}
              {activeView === 'dashboard' && (
                <div className="space-y-6">
                  {/* Top Stats Cards (7 Core Statistics) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* 1. Patients Registered Today */}
                    <div className="p-5 rounded-3xl border border-[#E5E8E6] bg-white shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-[#77817C]">
                        <span className="text-[10px] font-mono uppercase tracking-wider">Registered Today</span>
                        <UserPlus className="h-4 w-4 text-[#174C40]" />
                      </div>
                      <div className="text-3xl font-mono font-bold text-[#1F2421]">
                        {data?.stats?.patientsRegisteredToday || 0}
                      </div>
                      <span className="text-[10px] text-emerald-700 block">Intake completed</span>
                    </div>

                    {/* 2. Currently Waiting */}
                    <div className="p-5 rounded-3xl border border-[#E5E8E6] bg-white shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-[#77817C]">
                        <span className="text-[10px] font-mono uppercase tracking-wider">Currently Waiting</span>
                        <Clock className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="text-3xl font-mono font-bold text-amber-700">
                        {data?.stats?.patientsCurrentlyWaiting || 0}
                      </div>
                      <span className="text-[10px] text-amber-800 block">In OPD waiting lounges</span>
                    </div>

                    {/* 3. Currently Consulting */}
                    <div className="p-5 rounded-3xl border border-[#E5E8E6] bg-white shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-[#77817C]">
                        <span className="text-[10px] font-mono uppercase tracking-wider">In Consultation</span>
                        <Stethoscope className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-3xl font-mono font-bold text-blue-700">
                        {data?.stats?.patientsCurrentlyConsulting || 0}
                      </div>
                      <span className="text-[10px] text-blue-800 block">Inside doctor cabins</span>
                    </div>

                    {/* 4. Completed Consultations */}
                    <div className="p-5 rounded-3xl border border-[#E5E8E6] bg-white shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-[#77817C]">
                        <span className="text-[10px] font-mono uppercase tracking-wider">Completed Today</span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="text-3xl font-mono font-bold text-emerald-700">
                        {data?.stats?.completedConsultations || 0}
                      </div>
                      <span className="text-[10px] text-emerald-800 block">Consultations concluded</span>
                    </div>

                    {/* 5. Upcoming Appointments */}
                    <div className="p-5 rounded-3xl border border-[#E5E8E6] bg-white shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-[#77817C]">
                        <span className="text-[10px] font-mono uppercase tracking-wider">Upcoming Bookings</span>
                        <CalendarCheck className="h-4 w-4 text-[#174C40]" />
                      </div>
                      <div className="text-3xl font-mono font-bold text-[#1F2421]">
                        {data?.stats?.upcomingAppointments || 0}
                      </div>
                      <span className="text-[10px] text-[#77817C] block">Future &amp; today slots</span>
                    </div>

                    {/* 6. Emergency Patients */}
                    <div className="p-5 rounded-3xl border border-red-200 bg-red-50/50 shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-red-700">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Emergency Cases</span>
                        <Siren className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="text-3xl font-mono font-bold text-red-700">
                        {data?.stats?.emergencyPatients || 0}
                      </div>
                      <span className="text-[10px] text-red-800 block">Trauma &amp; priority admissions</span>
                    </div>

                    {/* 7. Available Doctors */}
                    <div className="p-5 rounded-3xl border border-[#E5E8E6] bg-white shadow-xs space-y-1 col-span-2 sm:col-span-1">
                      <div className="flex items-center justify-between text-[#77817C]">
                        <span className="text-[10px] font-mono uppercase tracking-wider">Available Doctors</span>
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="text-3xl font-mono font-bold text-emerald-700">
                        {data?.stats?.availableDoctors || 0}
                        <span className="text-sm font-normal text-[#77817C] ml-1.5">
                          / {data?.stats?.totalDoctors || 0}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-800 block">On-duty physicians</span>
                    </div>
                  </div>

                  {/* Quick Action Navigation Strip */}
                  <div className="rounded-3xl border border-[#E5E8E6] bg-white p-5 shadow-xs space-y-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#77817C] block">
                      Rapid Front Desk Shortcuts
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <button
                        onClick={() => handleSelectView('registration')}
                        className="p-3.5 rounded-2xl border border-[#E5E8E6] hover:border-[#174C40] hover:bg-[#FAFAF7] text-left transition-all cursor-pointer flex items-center gap-3"
                      >
                        <UserPlus className="h-5 w-5 text-[#174C40]" />
                        <div>
                          <div className="font-semibold text-xs text-[#1F2421]">Register Patient</div>
                          <div className="text-[10px] text-[#77817C]">Walk-in Intake Form</div>
                        </div>
                      </button>

                      <button
                        onClick={() => handleSelectView('tokens')}
                        className="p-3.5 rounded-2xl border border-[#E5E8E6] hover:border-[#174C40] hover:bg-[#FAFAF7] text-left transition-all cursor-pointer flex items-center gap-3"
                      >
                        <Ticket className="h-5 w-5 text-[#174C40]" />
                        <div>
                          <div className="font-semibold text-xs text-[#1F2421]">Token Manager</div>
                          <div className="text-[10px] text-[#77817C]">OPD Queue Control</div>
                        </div>
                      </button>

                      <button
                        onClick={() => handleSelectView('appointments')}
                        className="p-3.5 rounded-2xl border border-[#E5E8E6] hover:border-[#174C40] hover:bg-[#FAFAF7] text-left transition-all cursor-pointer flex items-center gap-3"
                      >
                        <CalendarCheck className="h-5 w-5 text-[#174C40]" />
                        <div>
                          <div className="font-semibold text-xs text-[#1F2421]">Appointments</div>
                          <div className="text-[10px] text-[#77817C]">Check-in &amp; Booking</div>
                        </div>
                      </button>

                      <button
                        onClick={() => handleSelectView('billing')}
                        className="p-3.5 rounded-2xl border border-[#E5E8E6] hover:border-[#174C40] hover:bg-[#FAFAF7] text-left transition-all cursor-pointer flex items-center gap-3"
                      >
                        <CreditCard className="h-5 w-5 text-[#174C40]" />
                        <div>
                          <div className="font-semibold text-xs text-[#1F2421]">Billing Desk</div>
                          <div className="text-[10px] text-[#77817C]">Payment Invoices</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Department Queues Summary Table */}
                  <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-bold text-base text-[#1F2421]">
                        Live Department Queue Overview
                      </h3>
                      <button
                        onClick={() => handleSelectView('tokens')}
                        className="text-xs font-semibold text-[#174C40] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open Live Queue Manager</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#E5E8E6] text-[#77817C] font-mono uppercase text-[10px]">
                            <th className="pb-3 font-semibold">Department</th>
                            <th className="pb-3 font-semibold">Serving Token</th>
                            <th className="pb-3 font-semibold">Attending Doctor</th>
                            <th className="pb-3 font-semibold">Patients Waiting</th>
                            <th className="pb-3 font-semibold">Est. Wait Time</th>
                            <th className="pb-3 font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F2F0]">
                          {data?.departmentQueues?.map((dept) => (
                            <tr key={dept.departmentId} className="hover:bg-[#FAFAF7]">
                              <td className="py-3 font-semibold text-[#1F2421]">
                                {dept.departmentName}
                              </td>
                              <td className="py-3 font-mono font-bold text-[#174C40]">
                                {dept.currentToken ? `#${dept.currentToken}` : 'None Calling'}
                              </td>
                              <td className="py-3 text-[#4A5350]">
                                {dept.doctorName || 'Cabin Staff On Call'}
                              </td>
                              <td className="py-3 font-mono">
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                                  {dept.waitingCount} Waiting
                                </span>
                              </td>
                              <td className="py-3 font-mono text-[#77817C]">
                                ~{dept.avgWaitMins || 10} mins
                              </td>
                              <td className="py-3">
                                <button
                                  type="button"
                                  onClick={() => handleSelectView('tokens')}
                                  className="text-xs font-semibold text-[#174C40] hover:underline cursor-pointer"
                                >
                                  Manage Queue →
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: NEW PATIENT REGISTRATION */}
              {activeView === 'registration' && (
                <PatientRegistrationForm
                  onCancel={() => handleSelectView('dashboard')}
                  onSuccess={() => {
                    fetchDashboardData(true);
                    handleSelectView('tokens');
                  }}
                />
              )}

              {/* VIEW 3: PATIENT DIRECTORY */}
              {activeView === 'directory' && (
                <PatientSearchLookup
                  onNavigateRegister={() => handleSelectView('registration')}
                  onVisitCreated={() => {
                    fetchDashboardData(true);
                    handleSelectView('tokens');
                  }}
                />
              )}

              {/* VIEW 4: TOKEN MANAGEMENT */}
              {activeView === 'tokens' && <LiveQueueManager />}

              {/* VIEW 5: APPOINTMENTS */}
              {activeView === 'appointments' && <AppointmentManager />}

              {/* VIEW 6: DOCTOR AVAILABILITY */}
              {activeView === 'doctors' && (
                <DoctorAvailabilityView session={session} />
              )}

              {/* VIEW 7: BILLING & PAYMENTS */}
              {activeView === 'billing' && <BillingDeskManager />}

              {/* VIEW 8: VISIT HISTORY */}
              {activeView === 'history' && (
                <VisitHistoryView
                  onOpenPatientProfile={(id) => setSelectedQueuePatientId(id)}
                />
              )}

              {/* VIEW 9: REPORTS */}
              {activeView === 'reports' && (
                <ReceptionReportsView data={data} session={session} />
              )}

              {/* VIEW 10: SETTINGS */}
              {activeView === 'settings' && (
                <ReceptionSettingsView
                  session={session}
                  currentLang={currentLang}
                  onChangeLang={setCurrentLang}
                  integrationsStatus={integrationsStatus}
                  autoRefreshEnabled={autoRefreshEnabled}
                  onToggleAutoRefresh={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  countdown={countdown}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Patient Profile Modal */}
      {selectedQueuePatientId && (
        <PatientProfileModal
          patientId={selectedQueuePatientId}
          onClose={() => setSelectedQueuePatientId(null)}
        />
      )}

      {/* Emergency Department Intake & Alert Modal */}
      {showEmergencyModal && (
        <EmergencyIntakeModal
          onClose={() => setShowEmergencyModal(false)}
          onSuccess={() => {
            fetchDashboardData(true);
          }}
        />
      )}
    </div>
  );
}
