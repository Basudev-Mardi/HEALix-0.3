'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  User,
  Phone,
  Calendar,
  MapPin,
  Droplet,
  ShieldAlert,
  PlusCircle,
  FileText,
  AlertCircle,
  CheckCircle2,
  Users,
  Clock,
  ArrowRight,
  Filter,
  Activity,
} from 'lucide-react';
import PatientProfileModal, { type PatientProfileData } from './PatientProfileModal';
import CreateVisitModal from './CreateVisitModal';

interface PatientSearchResult extends PatientProfileData {}

interface PatientSearchLookupProps {
  onVisitCreated?: (visit: any) => void;
  onNavigateRegister?: () => void;
}

export default function PatientSearchLookup({
  onVisitCreated,
  onNavigateRegister,
}: PatientSearchLookupProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchType, setSearchType] = useState<'all' | 'id' | 'mobile' | 'name'>('all');
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedVisitPatient, setSelectedVisitPatient] = useState<PatientProfileData | null>(null);

  // Perform search
  const handleSearch = useCallback(
    async (q = searchQuery, type = searchType) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const url = `/api/v1/reception/patients/search?q=${encodeURIComponent(trimmed)}&type=${type}`;
        let res = await fetch(url);
        if (!res.ok) {
          res = await fetch(`http://localhost:5000${url}`);
        }

        if (!res.ok) {
          throw new Error(`Search failed (HTTP ${res.status})`);
        }

        const json = await res.json();
        if (json.success && Array.isArray(json.patients)) {
          setResults(json.patients);
        } else {
          setResults([]);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Search error');
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, searchType]
  );

  // Debounced auto-search when user types 3+ characters
  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      const timer = setTimeout(() => {
        handleSearch(searchQuery, searchType);
      }, 400);
      return () => clearTimeout(timer);
    } else if (searchQuery.trim().length === 0 && hasSearched) {
      setResults([]);
      setHasSearched(false);
    }
  }, [searchQuery, searchType, handleSearch, hasSearched]);

  return (
    <div className="w-full space-y-6">
      {/* Search Header Card */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-[#174C40]/10 text-[#174C40] border border-[#174C40]/20">
              Returning Patients Directory
            </span>
            <span className="text-xs font-mono text-[#77817C]">• Search &amp; Check-In</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#1F2421] mt-1 tracking-tight">
            Patient Lookup &amp; Fast Check-in
          </h1>
          <p className="text-xs text-[#77817C] mt-0.5">
            Search returning patients by ID, Mobile Number, or Full Name. Never force an existing patient to re-register.
          </p>
        </div>

        {/* Search Controls Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="space-y-3"
        >
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77817C]" />
              <input
                type="text"
                placeholder="Search by Patient ID (e.g. HX-PT-...), Mobile Number, or Full Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E5E8E6] text-xs text-[#1F2421] bg-[#FAFAF7] focus:bg-white focus:outline-none focus:border-[#174C40] transition-colors"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-2xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Search className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Searching...' : 'Search Patient'}</span>
            </button>
          </div>

          {/* Search Type Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-[11px] font-mono text-[#77817C] mr-1">Search In:</span>
            {[
              { id: 'all', label: 'All Fields' },
              { id: 'id', label: 'Patient ID / MRN' },
              { id: 'mobile', label: 'Mobile Number' },
              { id: 'name', label: 'Patient Name' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSearchType(tab.id as any);
                  if (searchQuery.trim()) {
                    handleSearch(searchQuery, tab.id as any);
                  }
                }}
                className={`px-3 py-1 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                  searchType === tab.id
                    ? 'border-[#174C40] bg-[#174C40] text-white'
                    : 'border-[#E5E8E6] bg-white text-[#4A5350] hover:bg-[#FAFAF7]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 flex items-center gap-3 text-xs">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Section */}
      {loading ? (
        <div className="rounded-3xl border border-[#E5E8E6] bg-white p-12 text-center space-y-3">
          <div className="h-8 w-8 border-2 border-[#174C40] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-[#77817C]">Searching hospital master patient index...</p>
        </div>
      ) : hasSearched ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#77817C] px-1">
            <span>
              Found <strong className="text-[#1F2421]">{results.length}</strong> matching record{results.length === 1 ? '' : 's'}
            </span>
            <span className="font-mono text-[11px]">
              Query: &ldquo;{searchQuery}&rdquo; ({searchType})
            </span>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {results.map((patient) => (
                <div
                  key={patient.id || patient.patient_id}
                  className="rounded-2xl border border-[#E5E8E6] bg-white p-5 sm:p-6 shadow-xs hover:border-[#174C40]/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Left: Demographics */}
                  <div className="flex items-start gap-4">
                    {patient.photo ? (
                      <img
                        src={patient.photo}
                        alt={patient.full_name}
                        className="h-14 w-14 rounded-2xl object-cover border border-[#E5E8E6] shrink-0"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-2xl bg-[#174C40]/10 text-[#174C40] flex items-center justify-center font-serif text-xl font-bold shrink-0">
                        {patient.full_name.charAt(0)}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-serif font-bold text-[#1F2421]">
                          {patient.full_name}
                        </h3>
                        <span className="font-mono text-xs font-bold text-[#174C40] bg-[#174C40]/10 px-2.5 py-0.5 rounded-md">
                          {patient.patient_id}
                        </span>
                        {patient.blood_group && (
                          <span className="text-[11px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            {patient.blood_group}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#4A5350]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-[#77817C]" />
                          {patient.age?.formatted || 'DOB on file'} • {patient.gender}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="h-3.5 w-3.5 text-[#77817C]" />
                          {patient.mobile}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 truncate max-w-xs">
                          <MapPin className="h-3.5 w-3.5 text-[#77817C]" />
                          {patient.address}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#77817C] font-mono pt-1">
                        <span>MRN: {patient.patient_number}</span>
                        <span>•</span>
                        <span>Total Encounters: <strong className="text-[#174C40]">{patient.totalVisits || 0}</strong></span>
                        {patient.allergies && (
                          <>
                            <span>•</span>
                            <span className="text-amber-800">Allergies: {patient.allergies}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedProfileId(patient.patient_id || patient.id)}
                      className="px-4 py-2 rounded-xl border border-[#E5E8E6] bg-[#FAFAF7] hover:bg-white text-xs font-medium text-[#1F2421] transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <FileText className="h-3.5 w-3.5 text-[#174C40]" />
                      <span>View Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedVisitPatient(patient)}
                      className="px-4 py-2 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>Create New Visit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-[#E5E8E6] bg-white p-12 text-center space-y-4">
              <Users className="h-10 w-10 text-[#A3ABA7] stroke-1 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-serif font-bold text-[#1F2421]">
                  No Matching Patients Found
                </h3>
                <p className="text-xs text-[#77817C] max-w-md mx-auto">
                  No records matched your search query &ldquo;{searchQuery}&rdquo;. If this is a first-time patient, you can proceed with new patient registration.
                </p>
              </div>

              {onNavigateRegister && (
                <button
                  type="button"
                  onClick={onNavigateRegister}
                  className="px-5 py-2.5 rounded-xl bg-[#174C40] text-white text-xs font-semibold hover:bg-[#123B32] transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Register as New Patient</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Empty Prompt State */
        <div className="rounded-3xl border border-[#E5E8E6] bg-[#FAFAF7]/60 p-10 text-center space-y-3">
          <Search className="h-8 w-8 text-[#A3ABA7] stroke-1 mx-auto" />
          <h3 className="text-sm font-semibold text-[#1F2421]">
            Search by Patient ID, Phone or Name
          </h3>
          <p className="text-xs text-[#77817C] max-w-sm mx-auto">
            Quickly locate returning patients to check them into OPD clinics without having to register their information again.
          </p>
        </div>
      )}

      {/* Patient Profile Modal */}
      {selectedProfileId && (
        <PatientProfileModal
          patientId={selectedProfileId}
          onClose={() => setSelectedProfileId(null)}
          onCreateVisit={(pat) => {
            setSelectedProfileId(null);
            setSelectedVisitPatient(pat);
          }}
        />
      )}

      {/* Create Visit Modal */}
      {selectedVisitPatient && (
        <CreateVisitModal
          patient={selectedVisitPatient}
          onClose={() => setSelectedVisitPatient(null)}
          onVisitCreated={(visit) => {
            if (onVisitCreated) {
              onVisitCreated(visit);
            }
          }}
        />
      )}
    </div>
  );
}
