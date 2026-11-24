import type {
  Department,
  Doctor,
  EmergencyProtocol,
  Facility,
  GalleryItem,
  HospitalInfo,
  InfrastructureItem,
  MedicalService,
  VisitingHour,
} from './types';

export const FALLBACK_HOSPITAL: HospitalInfo = {
  id: 1,
  name: 'Healix Medical Center',
  tagline: 'Precision clinical care, designed around calm and human clarity.',
  founded_year: 2004,
  beds_count: 420,
  doctors_count: 185,
  specialties_count: 24,
  patients_served: '1.4M+',
  accreditation: 'JCI & NABH Accredited',
  phone: '+1 (800) 432-5490',
  emergency_phone: '+1 (800) 911-4325',
  ambulance_phone: '+1 (800) 911-2628',
  email: 'care@healixmedical.org',
  address: '480 Meridian Avenue, Health Sciences District, Boston, MA 02115',
  about_summary:
    'Healix Medical Center is a 420-bed quaternary care hospital uniting evidence-based medicine, minimally invasive surgical technology, and restorative clinical environments.',
  about_story:
    'Founded in 2004 by a coalition of academic clinicians and biomedical engineers, Healix Medical Center was built on a simple conviction: clinical excellence and serene, unhurried patient experience belong together. Over two decades, we have grown into a regional referral center across 24 specialties, pairing sub-specialist physician teams with real-time diagnostic precision and transparent care pathways.',
  mission:
    'To deliver evidence-driven, compassionate clinical care with measurable outcomes, radical transparency, and deep respect for every patient and family we serve.',
  vision:
    'To set the global benchmark for calm, digitally connected, precision healthcare where preventive medicine and complex tertiary interventions work seamlessly as one.',
  values_json: [
    {
      title: 'Clinical Precision',
      description:
        'Every diagnosis and care pathway is grounded in peer-reviewed protocols and multidisciplinary tumor and case boards.',
    },
    {
      title: 'Unwavering Empathy',
      description:
        'We treat people, not charts—designing quiet rooms, clear communication, and unhurried consultations.',
    },
    {
      title: 'Radical Transparency',
      description:
        'Clear clinical explanations, upfront care plans, and open quality metrics for every department.',
    },
    {
      title: 'Continuous Innovation',
      description:
        'Investing in robotic surgery, AI-assisted imaging, and clinician-led research that improves recovery times.',
    },
  ],
  leadership_quote:
    'Medicine at its finest feels effortless to the patient—behind that calm is relentless preparation, multidisciplinary rigor, and teams who listen first.',
  leadership_name: 'Dr. Eleanor Vance, MD, FACS',
  leadership_title: 'Chief Medical Officer & President',
};

export const FALLBACK_DEPARTMENTS: Department[] = [
  {
    slug: 'cardiology',
    name: 'Cardiology & Heart Institute',
    short_description: 'Comprehensive interventional, structural, and preventive cardiovascular care.',
    overview:
      'Our Heart Institute brings together interventional cardiologists, electrophysiologists, and cardiothoracic surgeons in a dedicated wing with two hybrid catheterization suites and a 28-bed cardiac ICU.',
    icon: 'HeartPulse',
    floor_location: 'East Wing, Floors 4–5',
    head_doctor_name: 'Dr. Aris Thorne',
    beds_allocated: 64,
    phone_ext: 'Ext. 4100',
    highlights: [
      '24/7 Primary PCI & STEMI Protocol',
      'Hybrid Structural Heart Suite',
      'Dedicated Cardiac Rehabilitation',
    ],
    conditions_treated: [
      'Coronary Artery Disease',
      'Atrial Fibrillation & Arrhythmias',
      'Heart Failure & Cardiomyopathy',
      'Valvular Heart Disease',
      'Resistant Hypertension',
    ],
    equipment: [
      'Dual-Source 256-Slice Cardiac CT',
      '3D Electroanatomical Mapping System',
      'Biplane Hybrid Cath Lab',
      '4D Transesophageal Echocardiography',
    ],
    doctor_count: 2,
    service_count: 1,
  },
  {
    slug: 'neurology',
    name: 'Neurology & Neurosciences',
    short_description: 'Advanced stroke intervention, epilepsy monitoring, and minimally invasive neurosurgery.',
    overview:
      'Designated as a Comprehensive Stroke Center, our Neurosciences division provides rapid thrombectomy, continuous video-EEG monitoring, and precision cranial and spinal microsurgery.',
    icon: 'Brain',
    floor_location: 'North Tower, Floor 6',
    head_doctor_name: 'Dr. Mei-Ling Chen',
    beds_allocated: 52,
    phone_ext: 'Ext. 4200',
    highlights: [
      'Door-to-Needle Stroke Time < 24 mins',
      'Level 4 Epilepsy Monitoring Unit',
      'Intraoperative 3T MRI Navigation',
    ],
    conditions_treated: [
      'Acute Ischemic & Hemorrhagic Stroke',
      'Refractory Epilepsy',
      "Parkinson's & Movement Disorders",
      'Brain & Pituitary Tumors',
      'Complex Spine Degeneration',
    ],
    equipment: [
      '3 Tesla Functional MRI',
      'StealthStation Surgical Navigation',
      '64-Channel Video EEG Suite',
      'Robotic Stereotactic Radiosurgery',
    ],
    doctor_count: 2,
    service_count: 2,
  },
  {
    slug: 'orthopedics',
    name: 'Orthopedics & Joint Reconstruction',
    short_description: 'Robotic joint replacement, sports medicine, and complex trauma reconstruction.',
    overview:
      'Combining robotic-arm assisted arthroplasty with evidence-based physiotherapy, our Orthopedics team restores mobility with tissue-sparing techniques and rapid-recovery protocols.',
    icon: 'Bone',
    floor_location: 'West Pavilion, Floor 3',
    head_doctor_name: 'Dr. Marcus Sterling',
    beds_allocated: 48,
    phone_ext: 'Ext. 4300',
    highlights: [
      'Same-Day Mobility Joint Protocols',
      'Robotic Knee & Hip Arthroplasty',
      'Dedicated Sports Biomechanics Lab',
    ],
    conditions_treated: [
      'Osteoarthritis of Hip & Knee',
      'ACL & Meniscal Sports Injuries',
      'Rotator Cuff & Shoulder Instability',
      'Spinal Disc Herniation',
      'Complex Fracture Trauma',
    ],
    equipment: [
      'Mako Robotic-Arm Assisted System',
      'O-Arm Intraoperative 3D Imaging',
      'High-Definition Arthroscopy Towers',
      'Isokinetic Gait & Force Lab',
    ],
    doctor_count: 1,
    service_count: 1,
  },
  {
    slug: 'oncology',
    name: 'Comprehensive Oncology',
    short_description: 'Precision medical, surgical, and radiation oncology guided by molecular profiling.',
    overview:
      'Every oncology case at Healix is reviewed by a weekly multidisciplinary tumor board. We pair genomic sequencing with targeted immunotherapy and adaptive radiotherapy.',
    icon: 'ShieldPlus',
    floor_location: 'South Pavilion, Floors 2–3',
    head_doctor_name: 'Dr. Priya Natarajan',
    beds_allocated: 58,
    phone_ext: 'Ext. 4400',
    highlights: [
      'Next-Gen Genomic Tumor Profiling',
      'Private Daylight Infusion Suites',
      'Integrative Palliative & Survivorship Care',
    ],
    conditions_treated: [
      'Breast & Gynecologic Cancers',
      'Thoracic & Lung Malignancies',
      'Gastrointestinal Oncology',
      'Hematologic Malignancies',
      'Urologic Cancers',
    ],
    equipment: [
      'TrueBeam Adaptive Linear Accelerator',
      'PET-CT Digital Molecular Imaging',
      'Automated Sterile Chemotherapy Compounding',
      'Da Vinci Xi Surgical System',
    ],
    doctor_count: 1,
    service_count: 1,
  },
  {
    slug: 'pediatrics',
    name: 'Pediatrics & Neonatology',
    short_description: 'Family-centered child healthcare with a Level III Neonatal Intensive Care Unit.',
    overview:
      'Designed with natural acoustics and calming architecture, our Pediatrics department cares for newborns through adolescents with sub-specialists in pediatric cardiology, pulmonology, and developmental medicine.',
    icon: 'Baby',
    floor_location: 'East Wing, Floor 2',
    head_doctor_name: 'Dr. Hannah Lindqvist',
    beds_allocated: 44,
    phone_ext: 'Ext. 4500',
    highlights: [
      'Level III NICU with Family Pods',
      '24/7 Pediatric Emergency Triage',
      'Child Life & Developmental Specialists',
    ],
    conditions_treated: [
      'Premature & High-Risk Newborns',
      'Pediatric Asthma & Allergies',
      'Congenital Heart Conditions',
      'Childhood Infectious Diseases',
      'Growth & Endocrine Disorders',
    ],
    equipment: [
      'Giraffe OmniBed Carestations',
      'High-Frequency Neonatal Ventilators',
      'Low-Dose Pediatric Digital X-Ray',
      'Point-of-Care Pediatric Ultrasound',
    ],
    doctor_count: 1,
    service_count: 1,
  },
  {
    slug: 'emergency-critical-care',
    name: 'Emergency & Critical Care',
    short_description: 'Level I trauma readiness, rapid triage, and multidisciplinary intensive care.',
    overview:
      'Staffed around the clock by board-certified emergency physicians and intensivists, our 36-bay Emergency Department links directly to helipad transport, CT imaging, and dedicated trauma operating rooms.',
    icon: 'Siren',
    floor_location: 'Ground Floor, North Entrance',
    head_doctor_name: 'Dr. David Okafor',
    beds_allocated: 40,
    phone_ext: 'Ext. 4911',
    highlights: [
      'Dedicated Trauma & Resuscitation Bays',
      'In-Department 128-Slice CT Scanner',
      'Negative-Pressure Isolation Rooms',
    ],
    conditions_treated: [
      'Major Polytrauma',
      'Acute Coronary Syndromes',
      'Sepsis & Septic Shock',
      'Respiratory Failure',
      'Toxicology & Acute Poisoning',
    ],
    equipment: [
      'Point-of-Care Blood Gas & Troponin',
      'Bedside ECMO Readiness',
      'Automated Triage Telemetry',
      'Negative-Pressure Isolation Chambers',
    ],
    doctor_count: 1,
    service_count: 0,
  },
];

export const FALLBACK_DOCTORS: Doctor[] = [
  {
    slug: 'dr-aris-thorne',
    name: 'Dr. Aris Thorne',
    title: 'Chair, Cardiology & Heart Institute',
    specialty: 'Interventional Cardiology',
    department_slug: 'cardiology',
    department_name: 'Cardiology & Heart Institute',
    department_floor: 'East Wing, Floors 4–5',
    department_phone: 'Ext. 4100',
    qualification: 'MD, FACC, FSCAI',
    experience_years: 21,
    languages: ['English', 'Greek', 'French'],
    bio: "Dr. Aris Thorne specializes in complex coronary interventions and transcatheter valve therapies (TAVR). Having performed over 4,500 interventional procedures, he leads Healix's structural heart program and mentors fellows in radial-first techniques.",
    education: [
      'MD, Harvard Medical School',
      'Residency in Internal Medicine, Massachusetts General Hospital',
      'Fellowship in Interventional Cardiology, Cleveland Clinic',
    ],
    awards: [
      'American College of Cardiology Distinguished Fellow (2023)',
      'Top Clinical Innovator in Structural Heart Care (2024)',
    ],
    consultation_days: 'Mon, Tue, Thu, Fri',
    consultation_hours: '09:00 AM – 03:30 PM',
    consultation_fee: '$220',
    avatar_initials: 'AT',
    accent_tone: 'emerald',
    is_featured: true,
  },
  {
    slug: 'dr-mei-ling-chen',
    name: 'Dr. Mei-Ling Chen',
    title: 'Chief of Neurosciences',
    specialty: 'Cerebrovascular & Endovascular Neurology',
    department_slug: 'neurology',
    department_name: 'Neurology & Neurosciences',
    department_floor: 'North Tower, Floor 6',
    department_phone: 'Ext. 4200',
    qualification: 'MD, PhD, FAAN',
    experience_years: 18,
    languages: ['English', 'Mandarin'],
    bio: 'Dr. Mei-Ling Chen directs the Comprehensive Stroke Center at Healix. Her work integrates rapid neuro-imaging with minimally invasive clot retrieval and personalized post-stroke neurorehabilitation.',
    education: [
      'MD/PhD in Neuroscience, Johns Hopkins University',
      'Neurology Residency, UCSF Medical Center',
      'Endovascular Surgical Neuroradiology Fellowship, Mayo Clinic',
    ],
    awards: [
      'AHA Stroke Systems of Care Excellence Award (2024)',
      'Published 85+ peer-reviewed articles in Lancet Neurology & Stroke',
    ],
    consultation_days: 'Mon, Wed, Thu',
    consultation_hours: '10:00 AM – 04:00 PM',
    consultation_fee: '$240',
    avatar_initials: 'MC',
    accent_tone: 'slate',
    is_featured: true,
  },
  {
    slug: 'dr-marcus-sterling',
    name: 'Dr. Marcus Sterling',
    title: 'Director of Joint Reconstruction',
    specialty: 'Robotic Orthopedic Surgery',
    department_slug: 'orthopedics',
    department_name: 'Orthopedics & Joint Reconstruction',
    department_floor: 'West Pavilion, Floor 3',
    department_phone: 'Ext. 4300',
    qualification: 'MD, FAAOS',
    experience_years: 16,
    languages: ['English', 'Spanish'],
    bio: 'Dr. Marcus Sterling focuses on robotic-assisted hip and knee arthroplasty and kinematic alignment. His rapid-recovery protocols enable over 85% of joint replacement patients to walk within four hours of surgery.',
    education: [
      'MD, Stanford University School of Medicine',
      'Orthopedic Surgery Residency, Hospital for Special Surgery (NY)',
      'Adult Reconstruction Fellowship, Rothman Institute',
    ],
    awards: [
      'AAOS Achievement Award (2023)',
      'Patient Choice Gold Distinction (5 consecutive years)',
    ],
    consultation_days: 'Tue, Wed, Fri',
    consultation_hours: '08:30 AM – 02:30 PM',
    consultation_fee: '$200',
    avatar_initials: 'MS',
    accent_tone: 'stone',
    is_featured: true,
  },
  {
    slug: 'dr-priya-natarajan',
    name: 'Dr. Priya Natarajan',
    title: 'Director, Precision Oncology',
    specialty: 'Medical Oncology & Hematology',
    department_slug: 'oncology',
    department_name: 'Comprehensive Oncology',
    department_floor: 'South Pavilion, Floors 2–3',
    department_phone: 'Ext. 4400',
    qualification: 'MD, DM, FASCO',
    experience_years: 19,
    languages: ['English', 'Tamil', 'Hindi'],
    bio: 'Dr. Priya Natarajan leads genomic-guided cancer therapy and immunotherapy clinical trials at Healix. She is deeply committed to clear, compassionate communication that empowers patients at every stage of treatment.',
    education: [
      'MD, Yale School of Medicine',
      'Hematology-Oncology Fellowship, Memorial Sloan Kettering Cancer Center',
    ],
    awards: [
      'ASCO Merit Award & Clinical Research Leadership Honor',
      'Principal Investigator for 14 Phase II/III Immunotherapy Trials',
    ],
    consultation_days: 'Mon, Tue, Thu',
    consultation_hours: '09:30 AM – 04:30 PM',
    consultation_fee: '$230',
    avatar_initials: 'PN',
    accent_tone: 'teal',
    is_featured: true,
  },
  {
    slug: 'dr-hannah-lindqvist',
    name: 'Dr. Hannah Lindqvist',
    title: 'Chief of Pediatrics & NICU',
    specialty: 'Neonatology & Pediatric Medicine',
    department_slug: 'pediatrics',
    department_name: 'Pediatrics & Neonatology',
    department_floor: 'East Wing, Floor 2',
    department_phone: 'Ext. 4500',
    qualification: 'MD, FAAP',
    experience_years: 14,
    languages: ['English', 'Swedish', 'German'],
    bio: "Dr. Hannah Lindqvist champions family-integrated neonatal care and gentle, evidence-based pediatrics. Under her leadership, Healix's Level III NICU achieved top-decile survival and developmental outcomes.",
    education: [
      'MD, Karolinska Institutet',
      "Pediatrics Residency, Boston Children's Hospital",
      'Neonatal-Perinatal Medicine Fellowship, CHOP',
    ],
    awards: [
      'Family-Centered Care Pioneer Award (2024)',
      'Regional Excellence in Perinatal Safety (2023)',
    ],
    consultation_days: 'Mon, Tue, Wed, Fri',
    consultation_hours: '09:00 AM – 03:00 PM',
    consultation_fee: '$180',
    avatar_initials: 'HL',
    accent_tone: 'amber',
    is_featured: false,
  },
  {
    slug: 'dr-david-okafor',
    name: 'Dr. David Okafor',
    title: 'Chief of Emergency & Trauma',
    specialty: 'Emergency Medicine & Critical Care',
    department_slug: 'emergency-critical-care',
    department_name: 'Emergency & Critical Care',
    department_floor: 'Ground Floor, North Entrance',
    department_phone: 'Ext. 4911',
    qualification: 'MD, FACEP, FCCM',
    experience_years: 15,
    languages: ['English', 'Yoruba'],
    bio: "Dr. David Okafor oversees Healix's 24/7 Emergency Department and trauma resuscitation systems, specializing in ultrasound-guided resuscitation, sepsis bundles, and disaster preparedness.",
    education: [
      'MD, University of Pennsylvania Perelman School of Medicine',
      'Emergency Medicine Residency, Bellevue / NYU Langone',
      "Critical Care Fellowship, Brigham and Women's Hospital",
    ],
    awards: [
      'ACEP National Emergency Medicine Quality Award (2024)',
      'Trauma Systems Leadership Medal (2022)',
    ],
    consultation_days: 'Rotating 24/7 Command & Consults',
    consultation_hours: 'Emergency Triage Always Open',
    consultation_fee: 'Emergency Triage',
    avatar_initials: 'DO',
    accent_tone: 'rose',
    is_featured: false,
  },
  {
    slug: 'dr-claire-beaumont',
    name: 'Dr. Claire Beaumont',
    title: 'Senior Cardiac Electrophysiologist',
    specialty: 'Cardiac Electrophysiology',
    department_slug: 'cardiology',
    department_name: 'Cardiology & Heart Institute',
    department_floor: 'East Wing, Floors 4–5',
    department_phone: 'Ext. 4100',
    qualification: 'MD, FHRS',
    experience_years: 13,
    languages: ['English', 'French'],
    bio: 'Dr. Claire Beaumont treats complex atrial and ventricular arrhythmias using radiation-free 3D mapping and pulsed-field ablation, as well as leadless pacemaker implantation.',
    education: [
      'MD, Columbia University Vagelos College of Physicians and Surgeons',
      'Cardiology & EP Fellowship, Johns Hopkins Hospital',
    ],
    awards: [
      'Heart Rhythm Society Young Investigator Finalist',
      'Zero-Fluoroscopy Ablation Center Lead',
    ],
    consultation_days: 'Mon, Wed, Fri',
    consultation_hours: '10:00 AM – 04:00 PM',
    consultation_fee: '$210',
    avatar_initials: 'CB',
    accent_tone: 'emerald',
    is_featured: false,
  },
  {
    slug: 'dr-samuel-keller',
    name: 'Dr. Samuel Keller',
    title: 'Senior Spine & Cranial Neurosurgeon',
    specialty: 'Minimally Invasive Neurosurgery',
    department_slug: 'neurology',
    department_name: 'Neurology & Neurosciences',
    department_floor: 'North Tower, Floor 6',
    department_phone: 'Ext. 4200',
    qualification: 'MD, FAANS',
    experience_years: 17,
    languages: ['English', 'German'],
    bio: 'Dr. Samuel Keller specializes in endoscopic skull-base surgery and motion-preserving cervical and lumbar spine procedures designed to minimize hospital stay and post-operative pain.',
    education: [
      'MD, Duke University School of Medicine',
      'Neurosurgery Residency, Barrow Neurological Institute',
    ],
    awards: [
      'AANS Clinical Excellence Recognition (2023)',
      'Minimally Invasive Spine Innovation Grant',
    ],
    consultation_days: 'Tue, Thu',
    consultation_hours: '09:00 AM – 03:00 PM',
    consultation_fee: '$250',
    avatar_initials: 'SK',
    accent_tone: 'slate',
    is_featured: false,
  },
];

export const FALLBACK_SERVICES: MedicalService[] = [
  {
    slug: 'preventive-cardiac-screening',
    name: 'Executive & Preventive Cardiac Screening',
    category: 'Diagnostics & Prevention',
    department_slug: 'cardiology',
    department_name: 'Cardiology & Heart Institute',
    department_floor: 'East Wing, Floors 4–5',
    department_phone: 'Ext. 4100',
    short_description:
      'Comprehensive non-invasive cardiovascular risk assessment completed in a single morning visit.',
    overview:
      'Designed for early detection of silent coronary artery disease and rhythm abnormalities, this program combines advanced lipidomics, 256-slice calcium scoring, stress echocardiography, and an unhurried cardiologist review.',
    preparation_notes:
      'Fast for 10 hours prior to your morning blood panel. Avoid caffeine for 12 hours before stress testing and wear comfortable walking attire.',
    duration_estimate: '2.5 – 3 Hours',
    availability: 'Mon – Sat, 07:30 AM – 01:00 PM',
    key_features: [
      'Same-day cardiologist consultation',
      'Low-dose coronary calcium CT',
      'Personalized 10-year vascular roadmap',
    ],
    procedures: [
      '12-Lead Digital ECG',
      'Transthoracic Echocardiography',
      'Coronary Artery Calcium Scan',
      'Advanced ApoB & Lp(a) Panel',
      'Treadmill Stress Echo',
    ],
    is_featured: true,
  },
  {
    slug: 'robotic-joint-replacement',
    name: 'Robotic-Assisted Joint Replacement',
    category: 'Surgical Care',
    department_slug: 'orthopedics',
    department_name: 'Orthopedics & Joint Reconstruction',
    department_floor: 'West Pavilion, Floor 3',
    department_phone: 'Ext. 4300',
    short_description:
      'Sub-millimeter 3D-planned knee and hip arthroplasty for natural joint kinematics and faster recovery.',
    overview:
      "Using pre-operative 3D CT modeling and haptic robotic guidance, our orthopedic surgeons customize implant positioning to each patient's unique anatomy—preserving healthy bone and ligaments.",
    preparation_notes:
      'Attend our pre-surgical physiotherapy orientation 10 days prior. Bring a list of current medications for anesthesia clearance.',
    duration_estimate: '60 – 90 Min Procedure · 1–2 Day Stay',
    availability: 'Scheduled Mon – Fri',
    key_features: [
      'Patient-specific 3D CT surgical plan',
      'Walk within 4 hours post-op',
      'Dedicated 6-week physical therapy track',
    ],
    procedures: [
      'Total Knee Arthroplasty',
      'Partial Uni-Compartmental Knee Replacement',
      'Direct Anterior Total Hip Replacement',
      'Complex Revision Arthroplasty',
    ],
    is_featured: true,
  },
  {
    slug: 'comprehensive-stroke-intervention',
    name: '24/7 Acute Stroke & Neuro-Intervention',
    category: 'Critical & Interventional',
    department_slug: 'neurology',
    department_name: 'Neurology & Neurosciences',
    department_floor: 'North Tower, Floor 6',
    department_phone: 'Ext. 4200',
    short_description:
      'Rapid-response thrombolysis and mechanical thrombectomy backed by AI-assisted perfusion imaging.',
    overview:
      'Every minute counts in acute stroke. Our emergency triage triggers an instant stroke code, routing patients directly to CT perfusion and biplane neuro-angiography with dedicated neuro-ICU recovery.',
    preparation_notes:
      'Emergency service—no preparation required. Call our emergency line immediately if you observe facial drooping, arm weakness, or speech difficulty.',
    duration_estimate: 'Immediate Triage · < 24 Min Door-to-Needle',
    availability: '24 Hours / 7 Days',
    key_features: [
      'In-house neuro-interventional team 24/7',
      'AI rapid CT perfusion triage',
      'Dedicated 16-bed Neuro-ICU',
    ],
    procedures: [
      'IV Thrombolysis (tPA / Tenecteplase)',
      'Mechanical Thrombectomy',
      'Cerebral Aneurysm Coiling',
      'Carotid Artery Stenting',
    ],
    is_featured: true,
  },
  {
    slug: 'precision-oncology-infusion',
    name: 'Precision Oncology & Genomic Infusion',
    category: 'Specialty Therapeutics',
    department_slug: 'oncology',
    department_name: 'Comprehensive Oncology',
    department_floor: 'South Pavilion, Floors 2–3',
    department_phone: 'Ext. 4400',
    short_description:
      'Targeted immunotherapy, molecularly matched systemic therapy, and serene private infusion suites.',
    overview:
      'Our outpatient infusion pavilion replaces crowded bays with sunlit private suites, oncology-certified pharmacists, scalp-cooling options, and integrated symptom management.',
    preparation_notes:
      'Hydrate well the evening before infusion. Light snacks, warm blankets, and high-speed Wi-Fi are provided in every suite.',
    duration_estimate: '1 – 4 Hours per Session',
    availability: 'Mon – Sat, 08:00 AM – 06:00 PM',
    key_features: [
      'Private daylight-filled infusion rooms',
      'Molecular tumor board review',
      '24/7 oncology nurse triage hotline',
    ],
    procedures: [
      'Checkpoint Inhibitor Immunotherapy',
      'Targeted Monoclonal Antibodies',
      'Precision Chemotherapy',
      'Liquid Biopsy & Genomic Sequencing',
    ],
    is_featured: true,
  },
  {
    slug: 'advanced-diagnostic-imaging',
    name: '3T MRI & Ultra-Low-Dose CT Imaging',
    category: 'Diagnostics & Prevention',
    department_slug: 'neurology',
    department_name: 'Neurology & Neurosciences',
    department_floor: 'North Tower, Floor 6',
    department_phone: 'Ext. 4200',
    short_description:
      'Quiet, wide-bore 3 Tesla MRI and spectral CT imaging with sub-specialist radiologist reporting within 4 hours.',
    overview:
      'Our Radiology wing minimizes anxiety with wide-bore, ambient-lit scanners and acoustic reduction technology while delivering crisp diagnostic resolution for neurological, cardiac, and musculoskeletal studies.',
    preparation_notes:
      'Remove all metallic accessories before MRI. Inform our team of any pacemakers, implants, or contrast allergies when scheduling.',
    duration_estimate: '20 – 45 Minutes',
    availability: 'Mon – Sun, 07:00 AM – 09:00 PM (24/7 Emergency)',
    key_features: [
      'Wide-bore 70cm claustrophobia-friendly MRI',
      'Sub-specialist radiologist reads',
      'Instant digital image portal access',
    ],
    procedures: [
      '3T Brain & Spine MRI',
      '256-Slice Coronary CT Angiography',
      'Whole-Body PET-CT',
      'High-Resolution Musculoskeletal Ultrasound',
    ],
    is_featured: false,
  },
  {
    slug: 'neonatal-intensive-care',
    name: 'Level III Neonatal Intensive Care (NICU)',
    category: 'Maternal & Child Health',
    department_slug: 'pediatrics',
    department_name: 'Pediatrics & Neonatology',
    department_floor: 'East Wing, Floor 2',
    department_phone: 'Ext. 4500',
    short_description:
      'Round-the-clock sub-specialty care for premature and medically fragile newborns in private family pods.',
    overview:
      'Our Level III NICU pairs gentle, developmentally supportive lighting and acoustics with advanced respiratory support, lactation consultants, and 24/7 parent rooming-in.',
    preparation_notes:
      'Prenatal NICU tours are available by appointment for expectant parents managing high-risk pregnancies.',
    duration_estimate: 'Continuous Inpatient Care',
    availability: '24 Hours / 7 Days',
    key_features: [
      'Private single-family NICU rooms',
      'Board-certified neonatologists on-site 24/7',
      'Dedicated neonatal transport team',
    ],
    procedures: [
      'Non-Invasive Neonatal Ventilation',
      'Therapeutic Hypothermia',
      'Pediatric Echocardiography',
      'Developmental Follow-Up Clinic',
    ],
    is_featured: false,
  },
];

export const FALLBACK_FACILITIES: Facility[] = [
  {
    id: 1,
    name: '24/7 Clinical Pharmacy',
    category: 'Clinical Support',
    floor_location: 'Ground Floor, Main Atrium',
    availability: 'Open 24 Hours',
    description:
      'Full-service inpatient and outpatient pharmacy stocked with specialty biologics, pediatric compounding, and direct bedside discharge medication delivery.',
    highlights: [
      'Bedside discharge prescription delivery',
      'Clinical pharmacist interaction checks',
      'Cold-chain specialty biologics',
    ],
  },
  {
    id: 2,
    name: 'Automated Pathology & Molecular Lab',
    category: 'Diagnostics',
    floor_location: 'Lower Level 1, Central Core',
    availability: 'Open 24 Hours (Walk-in 06:30 AM – 08:00 PM)',
    description:
      'CAP-accredited laboratory utilizing robotic sample sorting and pneumatic tube delivery to return routine panels in under 45 minutes.',
    highlights: [
      'Under 45-minute routine turnaround',
      'PCR & molecular genetics wing',
      'Pain-minimized pediatric phlebotomy',
    ],
  },
  {
    id: 3,
    name: 'Modular Laminar-Flow Operating Suites',
    category: 'Surgical Infrastructure',
    floor_location: 'Floor 3, Surgical Core',
    availability: '24/7 Scheduled & Trauma Readiness',
    description:
      '14 integrated operating rooms equipped with HEPA laminar airflow, seamless antimicrobial glass walls, and 4K surgical tele-consultation.',
    highlights: [
      'ISO Class 5 sterile airflow',
      '2 Hybrid Catheterization & Vascular ORs',
      'Da Vinci Xi & Mako robotic integration',
    ],
  },
  {
    id: 4,
    name: 'Private Recovery & Inpatient Suites',
    category: 'Patient Comfort',
    floor_location: 'Floors 4–8, All Wings',
    availability: 'Inpatient Admissions',
    description:
      'Acoustic-insulated single-occupancy rooms featuring floor-to-ceiling natural daylight, circadian lighting, ergonomic sleeper sofas for family, and tablet-controlled room comfort.',
    highlights: [
      '100% single-patient private rooms',
      'Circadian daylight-tuned lighting',
      'Chef-curated clinical nutrition menu',
    ],
  },
  {
    id: 5,
    name: 'Blood Bank & Apheresis Center',
    category: 'Clinical Support',
    floor_location: 'Floor 1, North Wing',
    availability: 'Open 24 Hours',
    description:
      'AABB-compliant blood component center providing NAT-tested whole blood, single-donor platelets, and therapeutic apheresis.',
    highlights: [
      '100% Nucleic Acid Tested (NAT) units',
      'Rapid massive-transfusion protocol',
      'Calm donor lounge with refreshments',
    ],
  },
  {
    id: 6,
    name: 'Rehabilitation & Hydrotherapy Pavilion',
    category: 'Recovery & Wellness',
    floor_location: 'West Pavilion, Ground Floor',
    availability: 'Mon – Sat, 07:00 AM – 07:00 PM',
    description:
      'Dedicated physiotherapy gym, gait-analysis studio, and temperature-controlled hydrotherapy pool supporting post-surgical, cardiac, and neurological recovery.',
    highlights: [
      'Heated aquatic therapy pool',
      'Anti-gravity treadmill training',
      '1-on-1 licensed physical therapists',
    ],
  },
  {
    id: 7,
    name: 'Courtyard Café & Nutrition Kitchen',
    category: 'Visitor Amenities',
    floor_location: 'Ground Floor, South Courtyard',
    availability: 'Daily, 06:30 AM – 09:30 PM',
    description:
      'Calm, sunlit dining overlooking our healing garden, serving freshly prepared Mediterranean-inspired meals, specialty coffee, and dietician-approved options.',
    highlights: [
      'Allergen-labeled fresh menu',
      'Quiet family seating alcoves',
      '24-hour grab-and-go wellness pantry',
    ],
  },
  {
    id: 8,
    name: 'Concierge, Valet & Healing Garden',
    category: 'Visitor Amenities',
    floor_location: 'Main Entrance & Central Courtyard',
    availability: 'Daily, 06:00 AM – 10:00 PM',
    description:
      'Complimentary wheelchair assistance, multilingual interpreter desk, EV-equipped underground parking, and a serene landscaped courtyard open to patients and visitors.',
    highlights: [
      '24/7 multilingual medical interpreters',
      'Accessible covered valet & EV charging',
      'Interfaith meditation & quiet room',
    ],
  },
];

export const FALLBACK_INFRASTRUCTURE: InfrastructureItem[] = [
  {
    id: 1,
    title: 'Modular Surgical Pavilion',
    category: 'Surgical Excellence',
    metric_value: '14',
    metric_label: 'Integrated Operating Suites',
    description:
      'Purpose-built surgical floor with ISO Class 5 laminar air filtration, dedicated sterile supply elevators, and zero-cross-contamination corridors.',
    specs: [
      '2 Biplane Hybrid Cardiac & Neuro ORs',
      'Positive-pressure HEPA filtration (25 air changes/hr)',
      'Integrated 4K video routing & robotic booms',
    ],
  },
  {
    id: 2,
    title: 'Critical Care Command Units',
    category: 'Intensive Care',
    metric_value: '78',
    metric_label: 'Smart ICU & NICU Beds',
    description:
      'Segmented into Cardiac, Neuro, Medical-Surgical, and Level III Neonatal ICUs with continuous telemetry, decentralized nurse alcoves, and family rest zones.',
    specs: [
      '1:1 and 1:2 specialist nursing ratios',
      'Centralized predictive early-warning vitals',
      '12 negative-pressure airborne isolation suites',
    ],
  },
  {
    id: 3,
    title: 'Imaging & Molecular Diagnostics Core',
    category: 'Diagnostic Precision',
    metric_value: '3T / 256',
    metric_label: 'MRI & Dual-Source CT',
    description:
      'High-throughput radiology hub positioned directly adjacent to Emergency and Surgical units for rapid, low-radiation diagnostic clarity.',
    specs: [
      'Dual 3 Tesla wide-bore MRI scanners',
      '256-slice ultra-low-dose cardiac CT',
      'Digital PET-CT & interventional fluoroscopy',
    ],
  },
  {
    id: 4,
    title: 'Healing Architecture & Sustainability',
    category: 'Campus Design',
    metric_value: 'LEED Gold',
    metric_label: 'Certified Green Hospital',
    description:
      'Engineered for acoustic serenity and infection control—combining triple-glazed daylight facades, antimicrobial surfaces, and 100% redundant N+1 power and medical gas systems.',
    specs: [
      '72-hour autonomous backup microgrid',
      'Acoustic ceiling baffles (< 42 dB ward target)',
      'Centralized medical oxygen & vacuum plants',
    ],
  },
  {
    id: 5,
    title: 'Digital Health & Interoperable EHR',
    category: 'Clinical Technology',
    metric_value: '99.99%',
    metric_label: 'Clinical Network Uptime',
    description:
      'Unified fiber-optic clinical backbone connecting bedside monitors, automated pharmacy dispensing, PACS imaging, and real-time laboratory alerting.',
    specs: [
      'Zero-trust encrypted patient records',
      'Automated barcode medication verification',
      'Pneumatic tube sample network across 42 stations',
    ],
  },
  {
    id: 6,
    title: 'Rooftop Helipad & Trauma Access',
    category: 'Emergency Logistics',
    metric_value: '< 90 sec',
    metric_label: 'Helipad-to-Trauma Bay',
    description:
      'FAA-certified rooftop helipad linked via high-speed dedicated trauma elevator directly into our ground-floor resuscitation bays and imaging core.',
    specs: [
      'Supports heavy twin-engine air ambulances',
      'Heated all-weather landing deck',
      'Direct ambulance bay with 6 sheltered docks',
    ],
  },
];

export const FALLBACK_GALLERY: GalleryItem[] = [
  {
    id: 1,
    title: 'Main Glass Atrium & Welcome Concierge',
    category: 'Architecture',
    location: 'Ground Floor, Meridian Entrance',
    description:
      'A three-story travertine and oak-clad atrium flooded with northern daylight, designed to replace clinical stress with calm arrival.',
    aspect_ratio: 'wide',
    accent_palette: 'stone',
  },
  {
    id: 2,
    title: 'Hybrid Cardiovascular Catheterization Suite',
    category: 'Clinical Technology',
    location: 'East Wing, Floor 4',
    description:
      'Biplane imaging and surgical lighting integrated into a single sterile suite for complex structural heart interventions.',
    aspect_ratio: 'landscape',
    accent_palette: 'slate',
  },
  {
    id: 3,
    title: 'Private Daylight Recovery Suite',
    category: 'Patient Spaces',
    location: 'North Tower, Floor 7',
    description:
      'Single-occupancy inpatient room with acoustic timber paneling, circadian lighting, and dedicated family lounge seating.',
    aspect_ratio: 'portrait',
    accent_palette: 'warm',
  },
  {
    id: 4,
    title: '3 Tesla Wide-Bore MRI Pavilion',
    category: 'Diagnostics',
    location: 'Lower Level 1, Imaging Core',
    description:
      'Ambient-lit imaging suite engineered to reduce scan noise by 70% and ease claustrophobia during neurological studies.',
    aspect_ratio: 'landscape',
    accent_palette: 'cool',
  },
  {
    id: 5,
    title: 'Central Botanical Healing Courtyard',
    category: 'Campus & Gardens',
    location: 'Ground Floor, South Courtyard',
    description:
      'Landscaped bamboo, birch, and water-feature courtyard accessible directly from the inpatient elevators and café.',
    aspect_ratio: 'wide',
    accent_palette: 'sage',
  },
  {
    id: 6,
    title: 'Level III NICU Family Care Pod',
    category: 'Patient Spaces',
    location: 'East Wing, Floor 2',
    description:
      'Softly lit private neonatal room enabling parents to remain beside their newborn around the clock with full clinical monitoring.',
    aspect_ratio: 'landscape',
    accent_palette: 'amber',
  },
  {
    id: 7,
    title: 'Robotic Surgical Operating Room 04',
    category: 'Clinical Technology',
    location: 'Floor 3, Surgical Core',
    description:
      'Modular glass-walled operating theater configured for minimally invasive robotic orthopedic and oncologic surgery.',
    aspect_ratio: 'portrait',
    accent_palette: 'slate',
  },
  {
    id: 8,
    title: 'Rehabilitation & Hydrotherapy Studio',
    category: 'Recovery & Wellness',
    location: 'West Pavilion, Ground Floor',
    description:
      'Sunlit physiotherapy studio featuring natural maple flooring, gait-analysis cameras, and heated aquatic therapy.',
    aspect_ratio: 'landscape',
    accent_palette: 'sage',
  },
];

export const FALLBACK_VISITING_HOURS: VisitingHour[] = [
  {
    id: 1,
    unit_name: 'General Inpatient Wards',
    category: 'Inpatient Care',
    days: 'Monday – Sunday',
    hours: '09:00 AM – 08:30 PM',
    max_visitors: '2 visitors at bedside',
    guidelines:
      'Quiet hours begin at 08:30 PM. One designated adult care partner may stay overnight in private recovery suites.',
  },
  {
    id: 2,
    unit_name: 'Intensive Care Units (Cardiac, Neuro, Med-Surg ICU)',
    category: 'Critical Care',
    days: 'Monday – Sunday',
    hours: '11:00 AM – 01:00 PM & 05:00 PM – 07:30 PM',
    max_visitors: '2 immediate family members',
    guidelines:
      'Brief 20-minute visits recommended to prioritize patient rest. Please sanitize hands and check in at the ICU nurse desk.',
  },
  {
    id: 3,
    unit_name: 'Level III Neonatal ICU (NICU)',
    category: 'Maternal & Child',
    days: 'Monday – Sunday',
    hours: '24 Hours for Parents · 02:00 PM – 06:00 PM Extended Family',
    max_visitors: '2 adults (one must be a parent)',
    guidelines:
      'Parents have 24/7 badge access. Siblings over age 6 may visit briefly following a quick wellness screen.',
  },
  {
    id: 4,
    unit_name: 'Outpatient Specialty Clinics (OPD)',
    category: 'Outpatient Services',
    days: 'Monday – Saturday',
    hours: '08:00 AM – 06:00 PM',
    max_visitors: '1 accompanying companion',
    guidelines:
      'Arrive 15 minutes prior to your scheduled consultation. Closed Sundays except for urgent follow-up clinics.',
  },
  {
    id: 5,
    unit_name: 'Diagnostics, Radiology & Pathology Lab',
    category: 'Diagnostics',
    days: 'Monday – Sunday',
    hours: '06:30 AM – 08:00 PM (Emergency 24/7)',
    max_visitors: '1 accompanying companion',
    guidelines:
      'Fasting blood draws are prioritized between 06:30 AM and 10:00 AM. Digital reports release automatically upon sign-off.',
  },
  {
    id: 6,
    unit_name: 'Emergency Department & Trauma Center',
    category: 'Emergency',
    days: 'Monday – Sunday',
    hours: 'Open 24 Hours / 365 Days',
    max_visitors: '1 support person in triage bay',
    guidelines:
      'Patients are seen strictly by clinical acuity, not arrival order. Additional family may wait in the North Atrium Lounge.',
  },
  {
    id: 7,
    unit_name: 'Outpatient Pharmacy & Discharge Desk',
    category: 'Support Services',
    days: 'Monday – Sunday',
    hours: 'Open 24 Hours',
    max_visitors: 'Open public access',
    guidelines:
      'Valid prescription and photo ID required for controlled medications. Curbside pickup available at North Entrance.',
  },
];

export const FALLBACK_EMERGENCY_PROTOCOLS: EmergencyProtocol[] = [
  {
    id: 1,
    title: 'Cardiac Emergency & Chest Pain',
    triage_level: 'Level 1 — Immediate',
    response_time: '< 5 min ECG · < 60 min Cath Lab',
    phone: '+1 (800) 911-4325',
    description:
      'For crushing chest pressure, pain radiating to arm or jaw, sudden shortness of breath, or cold sweats. Do not drive yourself.',
    steps: [
      'Call Emergency Dispatch immediately or dial 911',
      'Sit upright and remain calm; loosen tight clothing',
      'Chew one 325mg uncoated aspirin if not allergic and advised by dispatch',
      'Alert triage immediately upon arrival for instant ECG',
    ],
  },
  {
    id: 2,
    title: 'Acute Stroke (BE-FAST Protocol)',
    triage_level: 'Level 1 — Immediate',
    response_time: '< 24 min Door-to-Needle',
    phone: '+1 (800) 911-4325',
    description:
      'Sudden balance loss, vision changes, facial droop, arm weakness, or slurred speech require immediate clot-busting or endovascular care.',
    steps: [
      'Note the exact time symptoms were last seen normal',
      'Call Ambulance Dispatch—our EMS pre-alerts the Stroke Team en route',
      'Do not give food, water, or oral medications',
      'Bring a list of any blood thinners currently taken',
    ],
  },
  {
    id: 3,
    title: 'Major Trauma & Accidents',
    triage_level: 'Level 1 — Immediate',
    response_time: 'Immediate Trauma Bay Activation',
    phone: '+1 (800) 911-2628',
    description:
      'Severe falls, vehicular collisions, heavy bleeding, head injuries, or suspected spinal trauma are routed directly to our Level I Trauma Bays.',
    steps: [
      'Ensure scene safety and do not move a person with suspected neck/spine injury',
      'Apply firm, continuous direct pressure to active bleeding with clean cloth',
      'Call Healix Advanced Life Support Ambulance for rapid extraction',
      'Proceed to North Entrance Ground Floor Trauma Ramp',
    ],
  },
  {
    id: 4,
    title: 'Pediatric & Respiratory Distress',
    triage_level: 'Level 2 — Urgent',
    response_time: '< 10 min Pediatric Triage',
    phone: '+1 (800) 911-4325',
    description:
      'Rapid breathing, bluish lips, persistent high fever with lethargy, severe allergic reactions (anaphylaxis), or febrile seizures in children.',
    steps: [
      'Administer prescribed epinephrine auto-injector immediately for anaphylaxis',
      'Keep child calm and upright if experiencing breathing difficulty',
      'Bring immunization records and current weight if available',
      'Dedicated Pediatric Emergency bays are staffed 24/7',
    ],
  },
];
