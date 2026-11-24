import { Metadata } from 'next';
import FaqsClient from '@/components/FaqsClient';
import { getGeneralFaqs } from '@/lib/support-api';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQs) | Healix Hospital',
  description:
    'Answers to common patient inquiries regarding doctor appointments, cashless insurance, emergency admission, hospital visiting hours, and diagnostic lab reports.',
};

export default async function FaqsPage() {
  const faqs = await getGeneralFaqs();
  return <FaqsClient initialFaqs={faqs} />;
}
