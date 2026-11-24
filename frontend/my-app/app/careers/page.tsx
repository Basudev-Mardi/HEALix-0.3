import { Metadata } from 'next';
import CareersClient from '@/components/CareersClient';
import { getJobOpenings } from '@/lib/support-api';

export const metadata: Metadata = {
  title: 'Clinical & Hospital Careers | Healix Hospital',
  description:
    'Join Healix Hospital. Explore clinical positions, nursing fellowships, laboratory technology, and administrative career opportunities.',
};

export default async function CareersPage() {
  const jobs = await getJobOpenings();
  return <CareersClient initialJobs={jobs} />;
}
