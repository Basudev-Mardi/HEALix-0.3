/**
 * Department image resolution helper.
 * Safe to invoke from both Server Components and Client Components.
 */

export function getDepartmentImage(slugOrName: string): string {
  const key = (slugOrName || '').toLowerCase();
  if (key.includes('cardio')) return '/Images/Cardiology%20&%20Heart%20Institute.png';
  if (key.includes('oncol')) return '/Images/Comprehensive%20Oncology.png';
  if (key.includes('neuro')) return '/Images/Neurology%20&%20Neurosciences.png';
  if (key.includes('ortho')) return '/Images/Orthopedics%20&%20Joint%20Reconstruction.png';
  if (key.includes('pediat') || key.includes('neonat')) return '/Images/Pediatrics%20&%20Neonatology.png';
  if (key.includes('emerg') || key.includes('critical') || key.includes('trauma')) return '/Images/Emergency%20&%20Critical%20Care.png';
  return '/Images/hospital-exterior.png';
}
