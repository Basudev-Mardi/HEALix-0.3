import { Metadata } from 'next';
import InsuranceClient from '@/components/InsuranceClient';
import { getInsurancePartners } from '@/lib/support-api';

export const metadata: Metadata = {
  title: 'Insurance & TPA Cashless Network | Healix Hospital',
  description:
    'Comprehensive cashless health insurance, Third Party Administrators (TPA) empaneled network, pre-authorization protocols, and reimbursement support at Healix.',
};

export default async function InsurancePage() {
  const partners = await getInsurancePartners();
  return <InsuranceClient initialPartners={partners} />;
}
