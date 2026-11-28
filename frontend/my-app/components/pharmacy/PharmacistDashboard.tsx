'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  Pill,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  Plus,
  FileText,
  LogOut,
  Shield,
  Sparkles,
  Barcode,
  Check,
  X,
  Sliders,
  Filter,
  UserCheck,
  Building,
  PackageCheck,
  PackagePlus,
  History,
  AlertCircle,
  FileCheck,
  Send,
  Boxes,
  Truck
} from 'lucide-react';
import { type StaffUser, clearStaffSession } from '@/lib/staff-auth';

interface PharmacistDashboardProps {
  pharmacist?: StaffUser | null;
  onLogout?: () => void;
}

interface PharmacyStats {
  pending_prescriptions: number;
  dispensed_today: number;
  total_medicines: number;
  low_stock_items: number;
  expiring_soon_batches: number;
}

interface PrescriptionItem {
  medicine_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
  batch_id?: string;
  batch_number?: string;
}

interface PrescriptionRecord {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_name: string;
  items: PrescriptionItem[] | string;
  status: 'pending' | 'dispensed' | 'cancelled';
  validated_by: string | null;
  validated_at: string | null;
  prescribed_at: string;
  updated_at: string;
}

interface BatchInfo {
  batch_id: string;
  batch_number: string;
  remaining_qty: number;
  expiry_date: string;
  status: string;
}

interface MedicineInventoryItem {
  id: string;
  medicine_code: string;
  medicine_name: string;
  generic_name: string;
  brand: string;
  category: string;
  strength: string;
  dosage_form: string;
  manufacturer: string;
  unit_price: string;
  min_stock_threshold: number;
  total_stock: number;
  active_batches: BatchInfo[] | null;
}

interface DispensingRecord {
  id: string;
  prescription_id: string;
  patient_id: string;
  patient_name: string;
  medicine_id: string;
  medicine_name: string;
  batch_id: string;
  batch_number: string;
  expiry_date: string;
  quantity_dispensed: number;
  dosage_instructions: string;
  dispensed_by: string;
  dispensed_at: string;
}

export default function PharmacistDashboard({ pharmacist, onLogout }: PharmacistDashboardProps) {
  const [, startTransition] = useTransition();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'inventory' | 'stockin' | 'history'>('prescriptions');

  // Filter States
  const [rxStatusFilter, setRxStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Data States
  const [stats, setStats] = useState<PharmacyStats | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [inventory, setInventory] = useState<MedicineInventoryItem[]>([]);
  const [dispensings, setDispensings] = useState<DispensingRecord[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<Array<{ id: string; medicine_code: string; medicine_name: string; min_stock_threshold: number; current_stock: number }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modal States
  const [selectedRx, setSelectedRx] = useState<PrescriptionRecord | null>(null);
  const [showDispenseModal, setShowDispenseModal] = useState<boolean>(false);
  const [dispenseItems, setDispenseItems] = useState<PrescriptionItem[]>([]);
  const [counselingNotes, setCounselingNotes] = useState<string>('Patient counseled on adherence, timing, and hydration.');

  // Quick Stock-In Modal / Form States
  const [showStockInModal, setShowStockInModal] = useState<boolean>(false);
  const [stockInMedId, setStockInMedId] = useState<string>('');
  const [stockInBatchNum, setStockInBatchNum] = useState<string>('');
  const [stockInManufacturer, setStockInManufacturer] = useState<string>('Healix Certified Pharma');
  const [stockInQty, setStockInQty] = useState<number>(100);
  const [stockInCost, setStockInCost] = useState<number>(0.65);
  const [stockInExpiry, setStockInExpiry] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().split('T')[0];
  });

  // Fetch all dashboard data
  const loadPharmacyData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [dashRes, rxRes, invRes, dispRes] = await Promise.all([
        fetch('http://localhost:5000/api/v1/pharmacy/dashboard'),
        fetch('http://localhost:5000/api/v1/pharmacy/prescriptions'),
        fetch('http://localhost:5000/api/v1/pharmacy/inventory'),
        fetch('http://localhost:5000/api/v1/pharmacy/dispensings')
      ]);

      if (dashRes.ok) {
        const dData = await dashRes.json();
        setStats(dData.stats || null);
        setLowStockAlerts(dData.low_stock_alerts || []);
      }

      if (rxRes.ok) {
        const rData = await rxRes.json();
        setPrescriptions(rData.data || []);
      }

      if (invRes.ok) {
        const iData = await invRes.json();
        setInventory(iData.data || []);
      }

      if (dispRes.ok) {
        const dpData = await dispRes.json();
        setDispensings(dpData.data || []);
      }
    } catch (err) {
      console.error('Failed to load pharmacy data:', err);
      setActionError('Could not sync with central pharmacy database gateway.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPharmacyData();
  }, [loadPharmacyData]);

  // Toast timeouts
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  useEffect(() => {
    if (actionError) {
      const timer = setTimeout(() => setActionError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [actionError]);

  // Open Dispense Verification Modal
  const openDispenseModal = (rx: PrescriptionRecord) => {
    setSelectedRx(rx);
    let parsedItems: PrescriptionItem[] = [];
    try {
      parsedItems = typeof rx.items === 'string' ? JSON.parse(rx.items) : rx.items;
    } catch {
      parsedItems = [];
    }
    setDispenseItems(parsedItems || []);
    setCounselingNotes('Medications checked for drug-drug interactions and verified against patient allergies.');
    setShowDispenseModal(true);
  };

  // Submit Dispensation
  const handleDispenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRx) return;

    try {
      const res = await fetch('http://localhost:5000/api/v1/pharmacy/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescription_id: selectedRx.id,
          patient_id: selectedRx.patient_id,
          patient_name: selectedRx.patient_name,
          items: dispenseItems,
          pharmacist_name: pharmacist?.name || 'Priya Sharma, PharmD',
          counseling_notes: counselingNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Dispensation failed');

      setActionSuccess(data.message || 'Prescription successfully verified and dispensed.');
      setShowDispenseModal(false);
      loadPharmacyData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing dispensation';
      setActionError(msg);
    }
  };

  // Submit Stock In
  const handleStockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInMedId) {
      setActionError('Please select a medication to receive stock for.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/v1/pharmacy/inventory/stock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicine_id: stockInMedId,
          batch_number: stockInBatchNum || `BCH-${Date.now().toString().slice(-5)}`,
          manufacturer: stockInManufacturer,
          initial_qty: stockInQty,
          unit_cost: stockInCost,
          expiry_date: stockInExpiry,
          performed_by: pharmacist?.name || 'Priya Sharma, PharmD',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Stock receipt failed');

      setActionSuccess(data.message || 'New batch successfully accessioned into stock inventory.');
      setShowStockInModal(false);
      setStockInBatchNum('');
      loadPharmacyData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing stock-in';
      setActionError(msg);
    }
  };

  // Filtered prescriptions
  const filteredPrescriptions = prescriptions.filter(rx => {
    if (rxStatusFilter !== 'all' && rx.status !== rxStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = rx.patient_name.toLowerCase().includes(q);
      const matchId = rx.id.toLowerCase().includes(q);
      const matchDoc = rx.doctor_name.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchDoc) return false;
    }
    return true;
  });

  // Filtered inventory
  const filteredInventory = inventory.filter(med => {
    if (categoryFilter !== 'all' && med.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = med.medicine_name.toLowerCase().includes(q);
      const matchGen = med.generic_name.toLowerCase().includes(q);
      const matchCode = med.medicine_code.toLowerCase().includes(q);
      if (!matchName && !matchGen && !matchCode) return false;
    }
    return true;
  });

  // Available categories
  const categories = Array.from(new Set(inventory.map(m => m.category))).filter(Boolean);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header & Identity Strip */}
      <header className="rounded-3xl border border-[#174C40]/20 bg-[#174C40] text-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="h-14 w-14 rounded-2xl bg-white/10 text-emerald-300 flex items-center justify-center shrink-0 border border-white/10 backdrop-blur-xs">
            <Pill className="h-7 w-7 text-emerald-300" />
          </span>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-serif tracking-tight font-medium text-white">
                {pharmacist?.name || 'Priya Sharma, PharmD'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                PharmD • Clinical Pharmacy & Dispensary
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-emerald-100/80 mt-1 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-emerald-300" />
                Central Inpatient & OPD Pharmacy (Level 1, East Wing)
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-emerald-300" />
                Station: Electronic Prescription Verification & FEFO Inventory Control
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
          <button
            onClick={() => {
              startTransition(() => {
                loadPharmacyData();
              });
            }}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-colors flex items-center gap-1.5"
            title="Refresh pharmacy stock & orders"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync Stock</span>
          </button>

          <button
            onClick={() => {
              setStockInMedId(inventory[0]?.id || '');
              setShowStockInModal(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 border border-emerald-400/30 transition-colors flex items-center gap-1.5"
          >
            <PackagePlus className="h-3.5 w-3.5 text-emerald-300" />
            <span>Goods Receipt (Stock-In)</span>
          </button>

          <button
            onClick={() => {
              clearStaffSession();
              onLogout?.();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-rose-600/20 text-rose-200 hover:bg-rose-600/30 border border-rose-500/30 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* 2. Notification Banners */}
      {actionSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 text-emerald-900 p-4 text-xs font-mono flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-50 text-rose-900 p-4 text-xs font-mono flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 3. Low Stock Alert Banner (if any) */}
      {lowStockAlerts.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 shadow-xs">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div>
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Formulary Stock Replenishment Warning ({lowStockAlerts.length} items below minimum safety threshold)
                </span>
                <div className="flex items-center gap-2 text-xs text-amber-800 font-mono mt-0.5 flex-wrap">
                  {lowStockAlerts.map(item => (
                    <span key={item.id} className="bg-white/80 px-2 py-0.5 rounded-lg border border-amber-200">
                      <strong>{item.medicine_name}</strong>: {item.current_stock} left (Min: {item.min_stock_threshold})
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (lowStockAlerts[0]) setStockInMedId(lowStockAlerts[0].id);
                setShowStockInModal(true);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs"
            >
              Replenish Batch Now
            </button>
          </div>
        </div>
      )}

      {/* 4. KPI Telemetry Summary Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77817C] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Awaiting Dispense</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-semibold text-[#1F2421]">
            {stats?.pending_prescriptions ?? 0}
          </div>
          <p className="text-[10px] font-mono text-[#77817C] mt-1">Pending pharmacist review</p>
        </div>

        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77817C] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Dispensed Today</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-semibold text-emerald-700">
            {stats?.dispensed_today ?? 0}
          </div>
          <p className="text-[10px] font-mono text-[#77817C] mt-1">Orders certified & fulfilled</p>
        </div>

        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77817C] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Active Formulary</span>
            <Boxes className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-serif font-semibold text-[#1F2421]">
            {stats?.total_medicines ?? 0}
          </div>
          <p className="text-[10px] font-mono text-[#77817C] mt-1">Hospital approved drugs</p>
        </div>

        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77817C] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Low Stock Items</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className={`text-2xl font-serif font-semibold ${(stats?.low_stock_items ?? 0) > 0 ? 'text-rose-600' : 'text-[#1F2421]'}`}>
            {stats?.low_stock_items ?? 0}
          </div>
          <p className="text-[10px] font-mono text-[#77817C] mt-1">Below safety reorder level</p>
        </div>

        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77817C] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Expiring in 60d</span>
            <PackageCheck className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-semibold text-[#1F2421]">
            {stats?.expiring_soon_batches ?? 0}
          </div>
          <p className="text-[10px] font-mono text-[#77817C] mt-1">Priority FEFO rotation</p>
        </div>
      </section>

      {/* 5. Navigation Tabs */}
      <div className="border-b border-[#E5E8E6] flex items-center justify-between gap-4 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveTab('prescriptions'); setSearchQuery(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium font-mono transition-all flex items-center gap-2 ${
              activeTab === 'prescriptions'
                ? 'bg-[#174C40] text-white shadow-xs'
                : 'text-[#4A5350] hover:bg-[#F0F2F1]'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Prescription Queue</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
              {filteredPrescriptions.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('inventory'); setSearchQuery(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium font-mono transition-all flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'bg-[#174C40] text-white shadow-xs'
                : 'text-[#4A5350] hover:bg-[#F0F2F1]'
            }`}
          >
            <Boxes className="h-3.5 w-3.5" />
            <span>Formulary & Stock Inventory</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
              {filteredInventory.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('stockin')}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium font-mono transition-all flex items-center gap-2 ${
              activeTab === 'stockin'
                ? 'bg-[#174C40] text-white shadow-xs'
                : 'text-[#4A5350] hover:bg-[#F0F2F1]'
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Goods Receipt & Batch Accession</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium font-mono transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-[#174C40] text-white shadow-xs'
                : 'text-[#4A5350] hover:bg-[#F0F2F1]'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Dispensing Audit Trail ({dispensings.length})</span>
          </button>
        </div>
      </div>

      {/* 6. TAB CONTENT */}

      {/* TAB 1: Prescription Queue & Dispensing */}
      {activeTab === 'prescriptions' && (
        <section className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-[#E5E8E6] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#77817C]" />
              <input
                type="text"
                placeholder="Search patient, doctor, or Rx number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#D5D9D7] focus:outline-none focus:ring-1 focus:ring-[#174C40] font-mono bg-[#FAFAF7]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#77817C] font-mono">Status:</span>
              <select
                value={rxStatusFilter}
                onChange={(e) => setRxStatusFilter(e.target.value)}
                className="text-xs font-mono rounded-xl border border-[#D5D9D7] px-3 py-1.5 bg-[#FAFAF7] focus:outline-none focus:ring-1 focus:ring-[#174C40]"
              >
                <option value="all">All Prescriptions</option>
                <option value="pending">Awaiting Dispense (Pending)</option>
                <option value="dispensed">Dispensed & Fulfilled</option>
              </select>
            </div>
          </div>

          {/* Prescriptions List */}
          {loading ? (
            <div className="rounded-2xl border border-[#E5E8E6] bg-white p-12 text-center text-xs font-mono text-[#77817C] animate-pulse">
              Querying Electronic Prescribing System (e-Rx) database...
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D5D9D7] bg-white p-12 text-center text-xs font-mono text-[#77817C]">
              No electronic prescriptions matched the current criteria.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPrescriptions.map(rx => {
                const isPending = rx.status === 'pending';
                let itemsList: PrescriptionItem[] = [];
                try {
                  itemsList = typeof rx.items === 'string' ? JSON.parse(rx.items) : rx.items;
                } catch {
                  itemsList = [];
                }

                return (
                  <div
                    key={rx.id}
                    className={`rounded-2xl border bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-[#174C40]/40 ${
                      isPending ? 'border-amber-300 bg-amber-50/15' : 'border-[#E5E8E6]'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Patient & Doctor Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif font-semibold text-sm sm:text-base text-[#1F2421]">
                            {rx.patient_name}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#E5E8E6] text-[#4A5350]">
                            Patient ID: {rx.patient_id}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#174C40]/10 text-[#174C40] font-semibold">
                            Rx: {rx.id}
                          </span>

                          {isPending ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Awaiting Dispense
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Dispensed & Verified
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-[#77817C] font-mono flex items-center gap-4 flex-wrap">
                          <span>Prescriber: <strong className="text-[#1F2421]">{rx.doctor_name}</strong></span>
                          <span>Prescribed: {new Date(rx.prescribed_at).toLocaleString()}</span>
                          {rx.validated_by && (
                            <span>Dispensed by: <strong className="text-emerald-700">{rx.validated_by}</strong></span>
                          )}
                        </div>

                        {/* Prescribed Medications */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-mono text-[#77817C] uppercase block">
                            Prescribed Medications ({itemsList.length}):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {itemsList.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-[#FAFAF7] border border-[#E5E8E6] rounded-xl p-2.5 text-xs font-mono"
                              >
                                <div className="font-semibold text-[#1F2421] flex items-center justify-between">
                                  <span>{item.medicine_name}</span>
                                  <span className="text-emerald-700 font-bold">Qty: {item.quantity}</span>
                                </div>
                                <div className="text-[#4A5350] text-[11px] mt-0.5">
                                  {item.dosage} • {item.frequency} • {item.duration}
                                </div>
                                {item.instructions && (
                                  <div className="text-[10px] text-[#77817C] italic mt-0.5">
                                    Instructions: &quot;{item.instructions}&quot;
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Operational Actions */}
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {isPending && (
                          <button
                            onClick={() => openDispenseModal(rx)}
                            className="px-4 py-2 rounded-xl text-xs font-mono font-medium bg-[#174C40] hover:bg-[#123830] text-white transition-colors flex items-center gap-2 shadow-xs"
                          >
                            <PackageCheck className="h-3.5 w-3.5 text-emerald-300" />
                            <span>Verify & Dispense</span>
                          </button>
                        )}

                        {!isPending && (
                          <div className="px-3 py-1.5 rounded-xl text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Stock Deducted</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: Formulary & Real-Time Stock Inventory */}
      {activeTab === 'inventory' && (
        <section className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E8E6] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#77817C]" />
              <input
                type="text"
                placeholder="Search by drug name, generic, or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#D5D9D7] focus:outline-none focus:ring-1 focus:ring-[#174C40] font-mono bg-[#FAFAF7]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#77817C] font-mono">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs font-mono rounded-xl border border-[#D5D9D7] px-3 py-1.5 bg-[#FAFAF7] focus:outline-none focus:ring-1 focus:ring-[#174C40]"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border border-[#E5E8E6] rounded-2xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F0F2F1] border-b border-[#E5E8E6] font-mono text-[11px] text-[#4A5350]">
                  <th className="p-3">Medication Name / Generic</th>
                  <th className="p-3 w-28">Code</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 w-28">Strength / Form</th>
                  <th className="p-3 w-28">Unit Price</th>
                  <th className="p-3 w-32">Available Stock</th>
                  <th className="p-3">Active Batches (FEFO)</th>
                  <th className="p-3 w-28 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E8E6]">
                {filteredInventory.map(med => {
                  const isLow = med.total_stock <= med.min_stock_threshold;

                  return (
                    <tr key={med.id} className="hover:bg-[#FAFAF7]">
                      <td className="p-3">
                        <div className="font-semibold text-[#1F2421]">{med.medicine_name}</div>
                        <div className="text-[11px] text-[#77817C] font-mono">{med.generic_name} • {med.manufacturer}</div>
                      </td>
                      <td className="p-3 font-mono text-[#4A5350]">{med.medicine_code}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-emerald-50 text-[#174C40] border border-emerald-200">
                          {med.category}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[#4A5350]">{med.strength} ({med.dosage_form})</td>
                      <td className="p-3 font-mono text-[#1F2421]">${Number(med.unit_price).toFixed(2)}</td>
                      <td className="p-3">
                        <div className={`font-mono font-bold text-sm ${isLow ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {med.total_stock} units
                        </div>
                        <div className="text-[10px] text-[#77817C] font-mono">
                          Min: {med.min_stock_threshold} units
                        </div>
                      </td>
                      <td className="p-3">
                        {med.active_batches && med.active_batches.length > 0 ? (
                          <div className="space-y-1">
                            {med.active_batches.map(b => (
                              <div key={b.batch_id} className="text-[10px] font-mono text-[#4A5350]">
                                <span className="font-semibold">{b.batch_number}</span>: {b.remaining_qty} pcs (Exp: {new Date(b.expiry_date).toLocaleDateString()})
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-rose-600">No active batches</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setStockInMedId(med.id);
                            setShowStockInModal(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono bg-[#FAFAF7] hover:bg-[#E5E8E6] text-[#174C40] border border-[#D5D9D7] transition-colors"
                        >
                          + Receive
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: Goods Receipt & Batch Accession */}
      {activeTab === 'stockin' && (
        <section className="bg-white rounded-3xl border border-[#E5E8E6] p-6 shadow-xs space-y-6">
          <div className="border-b border-[#E5E8E6] pb-4">
            <h2 className="text-base sm:text-lg font-serif font-semibold text-[#1F2421] flex items-center gap-2">
              <Truck className="h-5 w-5 text-[#174C40]" />
              Goods Receipt Note (GRN) & Inventory Batch Accession
            </h2>
            <p className="text-xs text-[#77817C] font-mono mt-1">
              Log incoming pharmaceutical deliveries, verify barcode batch numbers, record cold-chain stability, and add inventory.
            </p>
          </div>

          <form onSubmit={handleStockInSubmit} className="max-w-2xl space-y-4 text-xs font-mono">
            <div>
              <label className="block text-[#4A5350] mb-1 font-semibold">Select Medication</label>
              <select
                value={stockInMedId}
                onChange={(e) => setStockInMedId(e.target.value)}
                required
                className="w-full text-xs font-mono rounded-xl border border-[#D5D9D7] p-2.5 bg-[#FAFAF7]"
              >
                <option value="">-- Choose Medication from Formulary --</option>
                {inventory.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.medicine_name} ({m.medicine_code}) - Current Stock: {m.total_stock}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#4A5350] mb-1">Batch Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BCH-26A"
                  value={stockInBatchNum}
                  onChange={(e) => setStockInBatchNum(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                />
              </div>

              <div>
                <label className="block text-[#4A5350] mb-1">Manufacturer / Supplier</label>
                <input
                  type="text"
                  required
                  value={stockInManufacturer}
                  onChange={(e) => setStockInManufacturer(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[#4A5350] mb-1">Quantity Received</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={stockInQty}
                  onChange={(e) => setStockInQty(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                />
              </div>

              <div>
                <label className="block text-[#4A5350] mb-1">Unit Purchase Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={stockInCost}
                  onChange={(e) => setStockInCost(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                />
              </div>

              <div>
                <label className="block text-[#4A5350] mb-1">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={stockInExpiry}
                  onChange={(e) => setStockInExpiry(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-mono font-medium bg-[#174C40] hover:bg-[#123830] text-white transition-colors flex items-center gap-2 shadow-xs"
              >
                <PackagePlus className="h-4 w-4 text-emerald-300" />
                <span>Confirm Goods Receipt & Update Inventory</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* TAB 4: Dispensing Audit Trail */}
      {activeTab === 'history' && (
        <section className="bg-white rounded-3xl border border-[#E5E8E6] p-6 shadow-xs space-y-4">
          <div className="border-b border-[#E5E8E6] pb-3">
            <h2 className="text-base font-serif font-semibold text-[#1F2421] flex items-center gap-2">
              <History className="h-4 w-4 text-[#174C40]" />
              Dispensation History & Audit Log
            </h2>
            <p className="text-xs text-[#77817C] font-mono mt-0.5">
              Immutable digital record of fulfilled patient prescriptions, allocated batches, and counseling timestamps.
            </p>
          </div>

          <div className="border border-[#E5E8E6] rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F0F2F1] border-b border-[#E5E8E6] font-mono text-[11px] text-[#4A5350]">
                  <th className="p-3">Dispense ID / Time</th>
                  <th className="p-3">Prescription & Patient</th>
                  <th className="p-3">Medication Name</th>
                  <th className="p-3">Batch & Expiry</th>
                  <th className="p-3 w-20">Quantity</th>
                  <th className="p-3">Dispensed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E8E6]">
                {dispensings.map(d => (
                  <tr key={d.id} className="hover:bg-[#FAFAF7]">
                    <td className="p-3 font-mono">
                      <div className="font-semibold text-[#1F2421]">{d.id}</div>
                      <div className="text-[10px] text-[#77817C]">{new Date(d.dispensed_at).toLocaleString()}</div>
                    </td>
                    <td className="p-3 font-mono">
                      <div className="font-semibold text-[#1F2421]">{d.patient_name}</div>
                      <div className="text-[10px] text-[#77817C]">Rx: {d.prescription_id}</div>
                    </td>
                    <td className="p-3 font-semibold text-[#1F2421]">{d.medicine_name}</td>
                    <td className="p-3 font-mono text-[#4A5350]">
                      <div>{d.batch_number}</div>
                      <div className="text-[10px] text-[#77817C]">Exp: {new Date(d.expiry_date).toLocaleDateString()}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-700">{d.quantity_dispensed} pcs</td>
                    <td className="p-3 font-mono text-[#4A5350]">{d.dispensed_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 7. MODALS */}

      {/* Dispense Verification Modal */}
      {showDispenseModal && selectedRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#E5E8E6] p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5E8E6] pb-3">
              <h3 className="font-serif font-semibold text-base text-[#1F2421] flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-[#174C40]" />
                Dispense Verification: {selectedRx.patient_name}
              </h3>
              <button onClick={() => setShowDispenseModal(false)} className="text-[#77817C] hover:text-[#1F2421]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleDispenseSubmit} className="space-y-4 text-xs font-mono">
              <div className="bg-[#FAFAF7] p-3 rounded-xl border border-[#E5E8E6] grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-[#77817C] uppercase block">Prescription ID</span>
                  <strong className="text-[#1F2421]">{selectedRx.id}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#77817C] uppercase block">Prescribing Physician</span>
                  <strong className="text-[#1F2421]">{selectedRx.doctor_name}</strong>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#4A5350] block">
                  Items to Fulfill & Deduct:
                </span>
                {dispenseItems.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-[#E5E8E6] bg-white space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm text-[#1F2421]">{item.medicine_name}</strong>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#77817C]">
                      Dosing: {item.dosage} • {item.frequency} • {item.duration}
                    </div>
                    {item.instructions && (
                      <div className="text-[10px] text-[#4A5350] italic">
                        Directions: {item.instructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[#4A5350] mb-1 font-semibold">
                  Pharmacist Patient Counseling & Verification Notes
                </label>
                <textarea
                  rows={2}
                  value={counselingNotes}
                  onChange={(e) => setCounselingNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDispenseModal(false)}
                  className="px-4 py-2 rounded-xl text-[#77817C] hover:bg-[#E5E8E6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#174C40] text-white hover:bg-[#123830] font-medium shadow-xs"
                >
                  Confirm Dispense & Deduct Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock In Quick Modal */}
      {showStockInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#E5E8E6] p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E8E6] pb-3">
              <h3 className="font-serif font-semibold text-base text-[#1F2421] flex items-center gap-2">
                <PackagePlus className="h-4 w-4 text-[#174C40]" />
                Receive Stock / Add Batch
              </h3>
              <button onClick={() => setShowStockInModal(false)} className="text-[#77817C] hover:text-[#1F2421]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleStockInSubmit} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-[#4A5350] mb-1">Medication</label>
                <select
                  value={stockInMedId}
                  onChange={(e) => setStockInMedId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                >
                  <option value="">-- Select Medication --</option>
                  {inventory.map(m => (
                    <option key={m.id} value={m.id}>{m.medicine_name} ({m.medicine_code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4A5350] mb-1">Batch Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BCH-26A"
                    value={stockInBatchNum}
                    onChange={(e) => setStockInBatchNum(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                  />
                </div>
                <div>
                  <label className="block text-[#4A5350] mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockInQty}
                    onChange={(e) => setStockInQty(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4A5350] mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={stockInCost}
                    onChange={(e) => setStockInCost(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                  />
                </div>
                <div>
                  <label className="block text-[#4A5350] mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={stockInExpiry}
                    onChange={(e) => setStockInExpiry(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStockInModal(false)}
                  className="px-4 py-2 rounded-xl text-[#77817C] hover:bg-[#E5E8E6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#174C40] text-white hover:bg-[#123830]"
                >
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
