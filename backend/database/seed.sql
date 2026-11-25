-- Healix Hospital Management System — Seed Data (Idempotent)

TRUNCATE TABLE
  hospital_statistics,
  hospital_gallery,
  hospital_branches,
  hospital_settings,
  appointment_faqs,
  appointments,
  emergency_protocols,
  visiting_hours,
  gallery_items,
  infrastructure_items,
  facilities,
  services,
  doctors,
  departments,
  hospital_info
RESTART IDENTITY CASCADE;

-- 1. hospital_settings
INSERT INTO hospital_settings (
  id, name, address, contact, timings
) VALUES (
  1,
  'Healix Medical Center',
  '480 Meridian Avenue, Health Sciences District, Boston, MA 02115',
  '{
    "phone": "+1 (800) 432-5490",
    "emergency": "+1 (800) 911-4325",
    "ambulance": "+1 (800) 911-2628",
    "email": "care@healixmedical.org"
  }'::jsonb,
  '{
    "opd": "Mon - Sat: 08:00 AM - 08:00 PM",
    "emergency": "24/7 Level I Trauma & Resuscitation",
    "visiting_hours": "General: 10:00 AM - 08:00 PM | ICU: 11:00 AM - 01:00 PM & 05:00 PM - 07:00 PM",
    "pharmacy": "24/7 In-House Clinical Dispensary"
  }'::jsonb
);

-- 2. hospital_branches
INSERT INTO hospital_branches (
  name, address, contact, is_main_campus, status
) VALUES
(
  'Healix Main Quaternary Campus',
  '480 Meridian Avenue, Health Sciences District, Boston, MA 02115',
  '{"phone": "+1 (800) 432-5490", "emergency": "+1 (800) 911-4325", "email": "main@healixmedical.org"}'::jsonb,
  TRUE,
  'active'
),
(
  'Healix West Suburban Ambulatory Center',
  '120 Route 9 West, Natick, MA 01760',
  '{"phone": "+1 (508) 555-4100", "emergency": "+1 (508) 555-9111", "email": "west@healixmedical.org"}'::jsonb,
  FALSE,
  'active'
),
(
  'Healix Seaport Preventive & Executive Health Suite',
  '250 Northern Avenue, Boston Seaport, MA 02210',
  '{"phone": "+1 (617) 555-7200", "emergency": "+1 (800) 911-4325", "email": "seaport@healixmedical.org"}'::jsonb,
  FALSE,
  'active'
);

-- 3. hospital_gallery
INSERT INTO hospital_gallery (
  image_url, caption, category, display_order
) VALUES
('/images/hospital-exterior.png', 'Healix Quaternary Hospital Exterior & Campus Gardens', 'Architecture', 1),
('/images/robotic-operating-suite.png', 'Sub-millimeter Hybrid Robotic Operating Suite', 'Surgical Theatres', 2),
('/images/inpatient-recovery-suite.png', 'Daylight-driven Acoustic Inpatient Recovery Suite', 'Inpatient Rooms', 3),
('/images/mri-imaging-suite.png', 'Diagnostic Imaging & 3T Wide-Bore MRI Core', 'Diagnostic Wings', 4),
('/images/emergency-trauma-bay.png', 'Level 1 Emergency & Acute Trauma Resuscitation Bay', 'Emergency Care', 5),
('/images/doctor-consultation.png', 'Empathetic Outpatient Clinical Consultation Suite', 'Outpatient Clinics', 6);

-- 4. hospital_statistics
INSERT INTO hospital_statistics (
  metric_name, metric_value, sublabel, display_order
) VALUES
('Inpatient Capacity', '420', 'Licensed Quaternary Acute Beds', 1),
('Medical Specialists', '185+', 'Board-Certified Attending Physicians', 2),
('Clinical Specialties', '24', 'Centers of Excellence', 3),
('Patients Served', '1.4M+', 'Since Campus Inception in 2004', 4),
('Surgical Success Rate', '99.4%', 'Robotic & Minimally Invasive Procedures', 5),
('Average Door-to-Balloon', '46 min', 'Level 1 STEMI Emergency Response', 6);

INSERT INTO hospital_info (
  id, name, tagline, founded_year, beds_count, doctors_count, specialties_count,
  patients_served, accreditation, phone, emergency_phone, ambulance_phone,
  email, address, about_summary, about_story, mission, vision, values_json,
  leadership_quote, leadership_name, leadership_title
) VALUES (
  1,
  'Healix Medical Center',
  'Precision clinical care, designed around calm and human clarity.',
  2004,
  420,
  185,
  24,
  '1.4M+',
  'JCI & NABH Accredited',
  '+1 (800) 432-5490',
  '+1 (800) 911-4325',
  '+1 (800) 911-2628',
  'care@healixmedical.org',
  '480 Meridian Avenue, Health Sciences District, Boston, MA 02115',
  'Healix Medical Center is a 420-bed quaternary care hospital uniting evidence-based medicine, minimally invasive surgical technology, and restorative clinical environments.',
  'Founded in 2004 by a coalition of academic clinicians and biomedical engineers, Healix Medical Center was built on a simple conviction: clinical excellence and serene, unhurried patient experience belong together. Over two decades, we have grown into a regional referral center across 24 specialties, pairing sub-specialist physician teams with real-time diagnostic precision and transparent care pathways.',
  'To deliver evidence-driven, compassionate clinical care with measurable outcomes, radical transparency, and deep respect for every patient and family we serve.',
  'To set the global benchmark for calm, digitally connected, precision healthcare where preventive medicine and complex tertiary interventions work seamlessly as one.',
  '[
    {"title": "Clinical Precision", "description": "Every diagnosis and care pathway is grounded in peer-reviewed protocols and multidisciplinary tumor and case boards."},
    {"title": "Unwavering Empathy", "description": "We treat people, not charts—designing quiet rooms, clear communication, and unhurried consultations."},
    {"title": "Radical Transparency", "description": "Clear clinical explanations, upfront care plans, and open quality metrics for every department."},
    {"title": "Continuous Innovation", "description": "Investing in robotic surgery, AI-assisted imaging, and clinician-led research that improves recovery times."}
  ]'::jsonb,
  'Medicine at its finest feels effortless to the patient—behind that calm is relentless preparation, multidisciplinary rigor, and teams who listen first.',
  'Dr. Eleanor Vance, MD, FACS',
  'Chief Medical Officer & President'
);

INSERT INTO departments (
  slug, name, short_description, overview, icon, floor_location,
  head_doctor_name, beds_allocated, phone_ext, highlights, conditions_treated, equipment, display_order
) VALUES
(
  'cardiology',
  'Cardiology & Heart Institute',
  'Comprehensive interventional, structural, and preventive cardiovascular care.',
  'Our Heart Institute brings together interventional cardiologists, electrophysiologists, and cardiothoracic surgeons in a dedicated wing with two hybrid catheterization suites and a 28-bed cardiac ICU.',
  'HeartPulse',
  'East Wing, Floors 4–5',
  'Dr. Aris Thorne',
  64,
  'Ext. 4100',
  ARRAY['24/7 Primary PCI & STEMI Protocol', 'Hybrid Structural Heart Suite', 'Dedicated Cardiac Rehabilitation'],
  ARRAY['Coronary Artery Disease', 'Atrial Fibrillation & Arrhythmias', 'Heart Failure & Cardiomyopathy', 'Valvular Heart Disease', 'Resistant Hypertension'],
  ARRAY['Dual-Source 256-Slice Cardiac CT', '3D Electroanatomical Mapping System', 'Biplane Hybrid Cath Lab', '4D Transesophageal Echocardiography'],
  1
),
(
  'neurology',
  'Neurology & Neurosciences',
  'Advanced stroke intervention, epilepsy monitoring, and minimally invasive neurosurgery.',
  'Designated as a Comprehensive Stroke Center, our Neurosciences division provides rapid thrombectomy, continuous video-EEG monitoring, and precision cranial and spinal microsurgery.',
  'Brain',
  'North Tower, Floor 6',
  'Dr. Mei-Ling Chen',
  52,
  'Ext. 4200',
  ARRAY['Door-to-Needle Stroke Time < 24 mins', 'Level 4 Epilepsy Monitoring Unit', 'Intraoperative 3T MRI Navigation'],
  ARRAY['Acute Ischemic & Hemorrhagic Stroke', 'Refractory Epilepsy', 'Parkinson''s & Movement Disorders', 'Brain & Pituitary Tumors', 'Complex Spine Degeneration'],
  ARRAY['3 Tesla Functional MRI', 'StealthStation Surgical Navigation', '64-Channel Video EEG Suite', 'Robotic Stereotactic Radiosurgery'],
  2
),
(
  'orthopedics',
  'Orthopedics & Joint Reconstruction',
  'Robotic joint replacement, sports medicine, and complex trauma reconstruction.',
  'Combining robotic-arm assisted arthroplasty with evidence-based physiotherapy, our Orthopedics team restores mobility with tissue-sparing techniques and rapid-recovery protocols.',
  'Bone',
  'West Pavilion, Floor 3',
  'Dr. Marcus Sterling',
  48,
  'Ext. 4300',
  ARRAY['Same-Day Mobility Joint Protocols', 'Robotic Knee & Hip Arthroplasty', 'Dedicated Sports Biomechanics Lab'],
  ARRAY['Osteoarthritis of Hip & Knee', 'ACL & Meniscal Sports Injuries', 'Rotator Cuff & Shoulder Instability', 'Spinal Disc Herniation', 'Complex Fracture Trauma'],
  ARRAY['Mako Robotic-Arm Assisted System', 'O-Arm Intraoperative 3D Imaging', 'High-Definition Arthroscopy Towers', 'Isokinetic Gait & Force Lab'],
  3
),
(
  'oncology',
  'Comprehensive Oncology',
  'Precision medical, surgical, and radiation oncology guided by molecular profiling.',
  'Every oncology case at Healix is reviewed by a weekly multidisciplinary tumor board. We pair genomic sequencing with targeted immunotherapy and adaptive radiotherapy.',
  'ShieldPlus',
  'South Pavilion, Floors 2–3',
  'Dr. Priya Natarajan',
  58,
  'Ext. 4400',
  ARRAY['Next-Gen Genomic Tumor Profiling', 'Private Daylight Infusion Suites', 'Integrative Palliative & Survivorship Care'],
  ARRAY['Breast & Gynecologic Cancers', 'Thoracic & Lung Malignancies', 'Gastrointestinal Oncology', 'Hematologic Malignancies', 'Urologic Cancers'],
  ARRAY['TrueBeam Adaptive Linear Accelerator', 'PET-CT Digital Molecular Imaging', 'Automated Sterile Chemotherapy Compounding', 'Da Vinci Xi Surgical System'],
  4
),
(
  'pediatrics',
  'Pediatrics & Neonatology',
  'Family-centered child healthcare with a Level III Neonatal Intensive Care Unit.',
  'Designed with natural acoustics and calming architecture, our Pediatrics department cares for newborns through adolescents with sub-specialists in pediatric cardiology, pulmonology, and developmental medicine.',
  'Baby',
  'East Wing, Floor 2',
  'Dr. Hannah Lindqvist',
  44,
  'Ext. 4500',
  ARRAY['Level III NICU with Family Pods', '24/7 Pediatric Emergency Triage', 'Child Life & Developmental Specialists'],
  ARRAY['Premature & High-Risk Newborns', 'Pediatric Asthma & Allergies', 'Congenital Heart Conditions', 'Childhood Infectious Diseases', 'Growth & Endocrine Disorders'],
  ARRAY['Giraffe OmniBed Carestations', 'High-Frequency Neonatal Ventilators', 'Low-Dose Pediatric Digital X-Ray', 'Point-of-Care Pediatric Ultrasound'],
  5
),
(
  'emergency-critical-care',
  'Emergency & Critical Care',
  'Level I trauma readiness, rapid triage, and multidisciplinary intensive care.',
  'Staffed around the clock by board-certified emergency physicians and intensivists, our 36-bay Emergency Department links directly to helipad transport, CT imaging, and dedicated trauma operating rooms.',
  'Siren',
  'Ground Floor, North Entrance',
  'Dr. David Okafor',
  40,
  'Ext. 4911',
  ARRAY['Dedicated Trauma & Resuscitation Bays', 'In-Department 128-Slice CT Scanner', 'Negative-Pressure Isolation Rooms'],
  ARRAY['Major Polytrauma', 'Acute Coronary Syndromes', 'Sepsis & Septic Shock', 'Respiratory Failure', 'Toxicology & Acute Poisoning'],
  ARRAY['Point-of-Care Blood Gas & Troponin', 'Bedside ECMO Readiness', 'Automated Triage Telemetry', 'Negative-Pressure Isolation Chambers'],
  6
);

INSERT INTO doctors (
  slug, name, title, specialty, department_slug, qualification, experience_years,
  languages, bio, education, awards, consultation_days, consultation_hours,
  consultation_fee, avatar_initials, accent_tone, is_featured, display_order
) VALUES
(
  'dr-aris-thorne',
  'Dr. Aris Thorne',
  'Chair, Cardiology & Heart Institute',
  'Interventional Cardiology',
  'cardiology',
  'MD, FACC, FSCAI',
  21,
  ARRAY['English', 'Greek', 'French'],
  'Dr. Aris Thorne specializes in complex coronary interventions and transcatheter valve therapies (TAVR). Having performed over 4,500 interventional procedures, he leads Healix''s structural heart program and mentors fellows in radial-first techniques.',
  ARRAY['MD, Harvard Medical School', 'Residency in Internal Medicine, Massachusetts General Hospital', 'Fellowship in Interventional Cardiology, Cleveland Clinic'],
  ARRAY['American College of Cardiology Distinguished Fellow (2023)', 'Top Clinical Innovator in Structural Heart Care (2024)'],
  'Mon, Tue, Thu, Fri',
  '09:00 AM – 03:30 PM',
  '$220',
  'AT',
  'emerald',
  TRUE,
  1
),
(
  'dr-mei-ling-chen',
  'Dr. Mei-Ling Chen',
  'Chief of Neurosciences',
  'Cerebrovascular & Endovascular Neurology',
  'neurology',
  'MD, PhD, FAAN',
  18,
  ARRAY['English', 'Mandarin'],
  'Dr. Mei-Ling Chen directs the Comprehensive Stroke Center at Healix. Her work integrates rapid neuro-imaging with minimally invasive clot retrieval and personalized post-stroke neurorehabilitation.',
  ARRAY['MD/PhD in Neuroscience, Johns Hopkins University', 'Neurology Residency, UCSF Medical Center', 'Endovascular Surgical Neuroradiology Fellowship, Mayo Clinic'],
  ARRAY['AHA Stroke Systems of Care Excellence Award (2024)', 'Published 85+ peer-reviewed articles in Lancet Neurology & Stroke'],
  'Mon, Wed, Thu',
  '10:00 AM – 04:00 PM',
  '$240',
  'MC',
  'slate',
  TRUE,
  2
),
(
  'dr-marcus-sterling',
  'Dr. Marcus Sterling',
  'Director of Joint Reconstruction',
  'Robotic Orthopedic Surgery',
  'orthopedics',
  'MD, FAAOS',
  16,
  ARRAY['English', 'Spanish'],
  'Dr. Marcus Sterling focuses on robotic-assisted hip and knee arthroplasty and kinematic alignment. His rapid-recovery protocols enable over 85% of joint replacement patients to walk within four hours of surgery.',
  ARRAY['MD, Stanford University School of Medicine', 'Orthopedic Surgery Residency, Hospital for Special Surgery (NY)', 'Adult Reconstruction Fellowship, Rothman Institute'],
  ARRAY['AAOS Achievement Award (2023)', 'Patient Choice Gold Distinction (5 consecutive years)'],
  'Tue, Wed, Fri',
  '08:30 AM – 02:30 PM',
  '$200',
  'MS',
  'stone',
  TRUE,
  3
),
(
  'dr-priya-natarajan',
  'Dr. Priya Natarajan',
  'Director, Precision Oncology',
  'Medical Oncology & Hematology',
  'oncology',
  'MD, DM, FASCO',
  19,
  ARRAY['English', 'Tamil', 'Hindi'],
  'Dr. Priya Natarajan leads genomic-guided cancer therapy and immunotherapy clinical trials at Healix. She is deeply committed to clear, compassionate communication that empowers patients at every stage of treatment.',
  ARRAY['MD, Yale School of Medicine', 'Hematology-Oncology Fellowship, Memorial Sloan Kettering Cancer Center'],
  ARRAY['ASCO Merit Award & Clinical Research Leadership Honor', 'Principal Investigator for 14 Phase II/III Immunotherapy Trials'],
  'Mon, Tue, Thu',
  '09:30 AM – 04:30 PM',
  '$230',
  'PN',
  'teal',
  TRUE,
  4
),
(
  'dr-hannah-lindqvist',
  'Dr. Hannah Lindqvist',
  'Chief of Pediatrics & NICU',
  'Neonatology & Pediatric Medicine',
  'pediatrics',
  'MD, FAAP',
  14,
  ARRAY['English', 'Swedish', 'German'],
  'Dr. Hannah Lindqvist champions family-integrated neonatal care and gentle, evidence-based pediatrics. Under her leadership, Healix''s Level III NICU achieved top-decile survival and developmental outcomes.',
  ARRAY['MD, Karolinska Institutet', 'Pediatrics Residency, Boston Children''s Hospital', 'Neonatal-Perinatal Medicine Fellowship, CHOP'],
  ARRAY['Family-Centered Care Pioneer Award (2024)', 'Regional Excellence in Perinatal Safety (2023)'],
  'Mon, Tue, Wed, Fri',
  '09:00 AM – 03:00 PM',
  '$180',
  'HL',
  'amber',
  FALSE,
  5
),
(
  'dr-david-okafor',
  'Dr. David Okafor',
  'Chief of Emergency & Trauma',
  'Emergency Medicine & Critical Care',
  'emergency-critical-care',
  'MD, FACEP, FCCM',
  15,
  ARRAY['English', 'Yoruba'],
  'Dr. David Okafor oversees Healix''s 24/7 Emergency Department and trauma resuscitation systems, specializing in ultrasound-guided resuscitation, sepsis bundles, and disaster preparedness.',
  ARRAY['MD, University of Pennsylvania Perelman School of Medicine', 'Emergency Medicine Residency, Bellevue / NYU Langone', 'Critical Care Fellowship, Brigham and Women''s Hospital'],
  ARRAY['ACEP National Emergency Medicine Quality Award (2024)', 'Trauma Systems Leadership Medal (2022)'],
  'Rotating 24/7 Command & Consults',
  'Emergency Triage Always Open',
  'Emergency Triage',
  'DO',
  'rose',
  FALSE,
  6
),
(
  'dr-claire-beaumont',
  'Dr. Claire Beaumont',
  'Senior Cardiac Electrophysiologist',
  'Cardiac Electrophysiology',
  'cardiology',
  'MD, FHRS',
  13,
  ARRAY['English', 'French'],
  'Dr. Claire Beaumont treats complex atrial and ventricular arrhythmias using radiation-free 3D mapping and pulsed-field ablation, as well as leadless pacemaker implantation.',
  ARRAY['MD, Columbia University Vagelos College of Physicians and Surgeons', 'Cardiology & EP Fellowship, Johns Hopkins Hospital'],
  ARRAY['Heart Rhythm Society Young Investigator Finalist', 'Zero-Fluoroscopy Ablation Center Lead'],
  'Mon, Wed, Fri',
  '10:00 AM – 04:00 PM',
  '$210',
  'CB',
  'emerald',
  FALSE,
  7
),
(
  'dr-samuel-keller',
  'Dr. Samuel Keller',
  'Senior Spine & Cranial Neurosurgeon',
  'Minimally Invasive Neurosurgery',
  'neurology',
  'MD, FAANS',
  17,
  ARRAY['English', 'German'],
  'Dr. Samuel Keller specializes in endoscopic skull-base surgery and motion-preserving cervical and lumbar spine procedures designed to minimize hospital stay and post-operative pain.',
  ARRAY['MD, Duke University School of Medicine', 'Neurosurgery Residency, Barrow Neurological Institute'],
  ARRAY['AANS Clinical Excellence Recognition (2023)', 'Minimally Invasive Spine Innovation Grant'],
  'Tue, Thu',
  '09:00 AM – 03:00 PM',
  '$250',
  'SK',
  'slate',
  FALSE,
  8
);

INSERT INTO services (
  slug, name, category, department_slug, short_description, overview,
  preparation_notes, duration_estimate, availability, key_features, procedures, is_featured, display_order
) VALUES
(
  'preventive-cardiac-screening',
  'Executive & Preventive Cardiac Screening',
  'Diagnostics & Prevention',
  'cardiology',
  'Comprehensive non-invasive cardiovascular risk assessment completed in a single morning visit.',
  'Designed for early detection of silent coronary artery disease and rhythm abnormalities, this program combines advanced lipidomics, 256-slice calcium scoring, stress echocardiography, and an unhurried cardiologist review.',
  'Fast for 10 hours prior to your morning blood panel. Avoid caffeine for 12 hours before stress testing and wear comfortable walking attire.',
  '2.5 – 3 Hours',
  'Mon – Sat, 07:30 AM – 01:00 PM',
  ARRAY['Same-day cardiologist consultation', 'Low-dose coronary calcium CT', 'Personalized 10-year vascular roadmap'],
  ARRAY['12-Lead Digital ECG', 'Transthoracic Echocardiography', 'Coronary Artery Calcium Scan', 'Advanced ApoB & Lp(a) Panel', 'Treadmill Stress Echo'],
  TRUE,
  1
),
(
  'robotic-joint-replacement',
  'Robotic-Assisted Joint Replacement',
  'Surgical Care',
  'orthopedics',
  'Sub-millimeter 3D-planned knee and hip arthroplasty for natural joint kinematics and faster recovery.',
  'Using pre-operative 3D CT modeling and haptic robotic guidance, our orthopedic surgeons customize implant positioning to each patient''s unique anatomy—preserving healthy bone and ligaments.',
  'Attend our pre-surgical physiotherapy orientation 10 days prior. Bring a list of current medications for anesthesia clearance.',
  '60 – 90 Min Procedure · 1–2 Day Stay',
  'Scheduled Mon – Fri',
  ARRAY['Patient-specific 3D CT surgical plan', 'Walk within 4 hours post-op', 'Dedicated 6-week physical therapy track'],
  ARRAY['Total Knee Arthroplasty', 'Partial Uni-Compartmental Knee Replacement', 'Direct Anterior Total Hip Replacement', 'Complex Revision Arthroplasty'],
  TRUE,
  2
),
(
  'comprehensive-stroke-intervention',
  '24/7 Acute Stroke & Neuro-Intervention',
  'Critical & Interventional',
  'neurology',
  'Rapid-response thrombolysis and mechanical thrombectomy backed by AI-assisted perfusion imaging.',
  'Every minute counts in acute stroke. Our emergency triage triggers an instant stroke code, routing patients directly to CT perfusion and biplane neuro-angiography with dedicated neuro-ICU recovery.',
  'Emergency service—no preparation required. Call our emergency line immediately if you observe facial drooping, arm weakness, or speech difficulty.',
  'Immediate Triage · < 24 Min Door-to-Needle',
  '24 Hours / 7 Days',
  ARRAY['In-house neuro-interventional team 24/7', 'AI rapid CT perfusion triage', 'Dedicated 16-bed Neuro-ICU'],
  ARRAY['IV Thrombolysis (tPA / Tenecteplase)', 'Mechanical Thrombectomy', 'Cerebral Aneurysm Coiling', 'Carotid Artery Stenting'],
  TRUE,
  3
),
(
  'precision-oncology-infusion',
  'Precision Oncology & Genomic Infusion',
  'Specialty Therapeutics',
  'oncology',
  'Targeted immunotherapy, molecularly matched systemic therapy, and serene private infusion suites.',
  'Our outpatient infusion pavilion replaces crowded bays with sunlit private suites, oncology-certified pharmacists, scalp-cooling options, and integrated symptom management.',
  'Hydrate well the evening before infusion. Light snacks, warm blankets, and high-speed Wi-Fi are provided in every suite.',
  '1 – 4 Hours per Session',
  'Mon – Sat, 08:00 AM – 06:00 PM',
  ARRAY['Private daylight-filled infusion rooms', 'Molecular tumor board review', '24/7 oncology nurse triage hotline'],
  ARRAY['Checkpoint Inhibitor Immunotherapy', 'Targeted Monoclonal Antibodies', 'Precision Chemotherapy', 'Liquid Biopsy & Genomic Sequencing'],
  TRUE,
  4
),
(
  'advanced-diagnostic-imaging',
  '3T MRI & Ultra-Low-Dose CT Imaging',
  'Diagnostics & Prevention',
  'neurology',
  'Quiet, wide-bore 3 Tesla MRI and spectral CT imaging with sub-specialist radiologist reporting within 4 hours.',
  'Our Radiology wing minimizes anxiety with wide-bore, ambient-lit scanners and acoustic reduction technology while delivering crisp diagnostic resolution for neurological, cardiac, and musculoskeletal studies.',
  'Remove all metallic accessories before MRI. Inform our team of any pacemakers, implants, or contrast allergies when scheduling.',
  '20 – 45 Minutes',
  'Mon – Sun, 07:00 AM – 09:00 PM (24/7 Emergency)',
  ARRAY['Wide-bore 70cm claustrophobia-friendly MRI', 'Sub-specialist radiologist reads', 'Instant digital image portal access'],
  ARRAY['3T Brain & Spine MRI', '256-Slice Coronary CT Angiography', 'Whole-Body PET-CT', 'High-Resolution Musculoskeletal Ultrasound'],
  FALSE,
  5
),
(
  'neonatal-intensive-care',
  'Level III Neonatal Intensive Care (NICU)',
  'Maternal & Child Health',
  'pediatrics',
  'Round-the-clock sub-specialty care for premature and medically fragile newborns in private family pods.',
  'Our Level III NICU pairs gentle, developmentally supportive lighting and acoustics with advanced respiratory support, lactation consultants, and 24/7 parent rooming-in.',
  'Prenatal NICU tours are available by appointment for expectant parents managing high-risk pregnancies.',
  'Continuous Inpatient Care',
  '24 Hours / 7 Days',
  ARRAY['Private single-family NICU rooms', 'Board-certified neonatologists on-site 24/7', 'Dedicated neonatal transport team'],
  ARRAY['Non-Invasive Neonatal Ventilation', 'Therapeutic Hypothermia', 'Pediatric Echocardiography', 'Developmental Follow-Up Clinic'],
  FALSE,
  6
);

INSERT INTO facilities (
  name, category, floor_location, availability, description, highlights, display_order
) VALUES
(
  '24/7 Clinical Pharmacy',
  'Clinical Support',
  'Ground Floor, Main Atrium',
  'Open 24 Hours',
  'Full-service inpatient and outpatient pharmacy stocked with specialty biologics, pediatric compounding, and direct bedside discharge medication delivery.',
  ARRAY['Bedside discharge prescription delivery', 'Clinical pharmacist interaction checks', 'Cold-chain specialty biologics'],
  1
),
(
  'Automated Pathology & Molecular Lab',
  'Diagnostics',
  'Lower Level 1, Central Core',
  'Open 24 Hours (Walk-in 06:30 AM – 08:00 PM)',
  'CAP-accredited laboratory utilizing robotic sample sorting and pneumatic tube delivery to return routine panels in under 45 minutes.',
  ARRAY['Under 45-minute routine turnaround', 'PCR & molecular genetics wing', 'Pain-minimized pediatric phlebotomy'],
  2
),
(
  'Modular Laminar-Flow Operating Suites',
  'Surgical Infrastructure',
  'Floor 3, Surgical Core',
  '24/7 Scheduled & Trauma Readiness',
  '14 integrated operating rooms equipped with HEPA laminar airflow, seamless antimicrobial glass walls, and 4K surgical tele-consultation.',
  ARRAY['ISO Class 5 sterile airflow', '2 Hybrid Catheterization & Vascular ORs', 'Da Vinci Xi & Mako robotic integration'],
  3
),
(
  'Private Recovery & Inpatient Suites',
  'Patient Comfort',
  'Floors 4–8, All Wings',
  'Inpatient Admissions',
  'Acoustic-insulated single-occupancy rooms featuring floor-to-ceiling natural daylight, circadian lighting, ergonomic sleeper sofas for family, and tablet-controlled room comfort.',
  ARRAY['100% single-patient private rooms', 'Circadian daylight-tuned lighting', 'Chef-curated clinical nutrition menu'],
  4
),
(
  'Blood Bank & Apheresis Center',
  'Clinical Support',
  'Floor 1, North Wing',
  'Open 24 Hours',
  'AABB-compliant blood component center providing NAT-tested whole blood, single-donor platelets, and therapeutic apheresis.',
  ARRAY['100% Nucleic Acid Tested (NAT) units', 'Rapid massive-transfusion protocol', 'Calm donor lounge with refreshments'],
  5
),
(
  'Rehabilitation & Hydrotherapy Pavilion',
  'Recovery & Wellness',
  'West Pavilion, Ground Floor',
  'Mon – Sat, 07:00 AM – 07:00 PM',
  'Dedicated physiotherapy gym, gait-analysis studio, and temperature-controlled hydrotherapy pool supporting post-surgical, cardiac, and neurological recovery.',
  ARRAY['Heated aquatic therapy pool', 'Anti-gravity treadmill training', '1-on-1 licensed physical therapists'],
  6
),
(
  'Courtyard Café & Nutrition Kitchen',
  'Visitor Amenities',
  'Ground Floor, South Courtyard',
  'Daily, 06:30 AM – 09:30 PM',
  'Calm, sunlit dining overlooking our healing garden, serving freshly prepared Mediterranean-inspired meals, specialty coffee, and dietician-approved options.',
  ARRAY['Allergen-labeled fresh menu', 'Quiet family seating alcoves', '24-hour grab-and-go wellness pantry'],
  7
),
(
  'Concierge, Valet & Healing Garden',
  'Visitor Amenities',
  'Main Entrance & Central Courtyard',
  'Daily, 06:00 AM – 10:00 PM',
  'Complimentary wheelchair assistance, multilingual interpreter desk, EV-equipped underground parking, and a serene landscaped courtyard open to patients and visitors.',
  ARRAY['24/7 multilingual medical interpreters', 'Accessible covered valet & EV charging', 'Interfaith meditation & quiet room'],
  8
);

INSERT INTO infrastructure_items (
  title, category, metric_value, metric_label, description, specs, display_order
) VALUES
(
  'Modular Surgical Pavilion',
  'Surgical Excellence',
  '14',
  'Integrated Operating Suites',
  'Purpose-built surgical floor with ISO Class 5 laminar air filtration, dedicated sterile supply elevators, and zero-cross-contamination corridors.',
  ARRAY['2 Biplane Hybrid Cardiac & Neuro ORs', 'Positive-pressure HEPA filtration (25 air changes/hr)', 'Integrated 4K video routing & robotic booms'],
  1
),
(
  'Critical Care Command Units',
  'Intensive Care',
  '78',
  'Smart ICU & NICU Beds',
  'Segmented into Cardiac, Neuro, Medical-Surgical, and Level III Neonatal ICUs with continuous telemetry, decentralized nurse alcoves, and family rest zones.',
  ARRAY['1:1 and 1:2 specialist nursing ratios', 'Centralized predictive early-warning vitals', '12 negative-pressure airborne isolation suites'],
  2
),
(
  'Imaging & Molecular Diagnostics Core',
  'Diagnostic Precision',
  '3T / 256',
  'MRI & Dual-Source CT',
  'High-throughput radiology hub positioned directly adjacent to Emergency and Surgical units for rapid, low-radiation diagnostic clarity.',
  ARRAY['Dual 3 Tesla wide-bore MRI scanners', '256-slice ultra-low-dose cardiac CT', 'Digital PET-CT & interventional fluoroscopy'],
  3
),
(
  'Healing Architecture & Sustainability',
  'Campus Design',
  'LEED Gold',
  'Certified Green Hospital',
  'Engineered for acoustic serenity and infection control—combining triple-glazed daylight facades, antimicrobial surfaces, and 100% redundant N+1 power and medical gas systems.',
  ARRAY['72-hour autonomous backup microgrid', 'Acoustic ceiling baffles (< 42 dB ward target)', 'Centralized medical oxygen & vacuum plants'],
  4
),
(
  'Digital Health & Interoperable EHR',
  'Clinical Technology',
  '99.99%',
  'Clinical Network Uptime',
  'Unified fiber-optic clinical backbone connecting bedside monitors, automated pharmacy dispensing, PACS imaging, and real-time laboratory alerting.',
  ARRAY['Zero-trust encrypted patient records', 'Automated barcode medication verification', 'Pneumatic tube sample network across 42 stations'],
  5
),
(
  'Rooftop Helipad & Trauma Access',
  'Emergency Logistics',
  '< 90 sec',
  'Helipad-to-Trauma Bay',
  'FAA-certified rooftop helipad linked via high-speed dedicated trauma elevator directly into our ground-floor resuscitation bays and imaging core.',
  ARRAY['Supports heavy twin-engine air ambulances', 'Heated all-weather landing deck', 'Direct ambulance bay with 6 sheltered docks'],
  6
);

INSERT INTO gallery_items (
  title, category, location, description, aspect_ratio, accent_palette, display_order
) VALUES
(
  'Main Glass Atrium & Welcome Concierge',
  'Architecture',
  'Ground Floor, Meridian Entrance',
  'A three-story travertine and oak-clad atrium flooded with northern daylight, designed to replace clinical stress with calm arrival.',
  'wide',
  'stone',
  1
),
(
  'Hybrid Cardiovascular Catheterization Suite',
  'Clinical Technology',
  'East Wing, Floor 4',
  'Biplane imaging and surgical lighting integrated into a single sterile suite for complex structural heart interventions.',
  'landscape',
  'slate',
  2
),
(
  'Private Daylight Recovery Suite',
  'Patient Spaces',
  'North Tower, Floor 7',
  'Single-occupancy inpatient room with acoustic timber paneling, circadian lighting, and dedicated family lounge seating.',
  'portrait',
  'warm',
  3
),
(
  '3 Tesla Wide-Bore MRI Pavilion',
  'Diagnostics',
  'Lower Level 1, Imaging Core',
  'Ambient-lit imaging suite engineered to reduce scan noise by 70% and ease claustrophobia during neurological studies.',
  'landscape',
  'cool',
  4
),
(
  'Central Botanical Healing Courtyard',
  'Campus & Gardens',
  'Ground Floor, South Courtyard',
  'Landscaped bamboo, birch, and water-feature courtyard accessible directly from the inpatient elevators and café.',
  'wide',
  'sage',
  5
),
(
  'Level III NICU Family Care Pod',
  'Patient Spaces',
  'East Wing, Floor 2',
  'Softly lit private neonatal room enabling parents to remain beside their newborn around the clock with full clinical monitoring.',
  'landscape',
  'amber',
  6
),
(
  'Robotic Surgical Operating Room 04',
  'Clinical Technology',
  'Floor 3, Surgical Core',
  'Modular glass-walled operating theater configured for minimally invasive robotic orthopedic and oncologic surgery.',
  'portrait',
  'slate',
  7
),
(
  'Rehabilitation & Hydrotherapy Studio',
  'Recovery & Wellness',
  'West Pavilion, Ground Floor',
  'Sunlit physiotherapy studio featuring natural maple flooring, gait-analysis cameras, and heated aquatic therapy.',
  'landscape',
  'sage',
  8
);

INSERT INTO visiting_hours (
  unit_name, category, days, hours, max_visitors, guidelines, display_order
) VALUES
(
  'General Inpatient Wards',
  'Inpatient Care',
  'Monday – Sunday',
  '09:00 AM – 08:30 PM',
  '2 visitors at bedside',
  'Quiet hours begin at 08:30 PM. One designated adult care partner may stay overnight in private recovery suites.',
  1
),
(
  'Intensive Care Units (Cardiac, Neuro, Med-Surg ICU)',
  'Critical Care',
  'Monday – Sunday',
  '11:00 AM – 01:00 PM & 05:00 PM – 07:30 PM',
  '2 immediate family members',
  'Brief 20-minute visits recommended to prioritize patient rest. Please sanitize hands and check in at the ICU nurse desk.',
  2
),
(
  'Level III Neonatal ICU (NICU)',
  'Maternal & Child',
  'Monday – Sunday',
  '24 Hours for Parents · 02:00 PM – 06:00 PM Extended Family',
  '2 adults (one must be a parent)',
  'Parents have 24/7 badge access. Siblings over age 6 may visit briefly following a quick wellness screen.',
  3
),
(
  'Outpatient Specialty Clinics (OPD)',
  'Outpatient Services',
  'Monday – Saturday',
  '08:00 AM – 06:00 PM',
  '1 accompanying companion',
  'Arrive 15 minutes prior to your scheduled consultation. Closed Sundays except for urgent follow-up clinics.',
  4
),
(
  'Diagnostics, Radiology & Pathology Lab',
  'Diagnostics',
  'Monday – Sunday',
  '06:30 AM – 08:00 PM (Emergency 24/7)',
  '1 accompanying companion',
  'Fasting blood draws are prioritized between 06:30 AM and 10:00 AM. Digital reports release automatically upon sign-off.',
  5
),
(
  'Emergency Department & Trauma Center',
  'Emergency',
  'Monday – Sunday',
  'Open 24 Hours / 365 Days',
  '1 support person in triage bay',
  'Patients are seen strictly by clinical acuity, not arrival order. Additional family may wait in the North Atrium Lounge.',
  6
),
(
  'Outpatient Pharmacy & Discharge Desk',
  'Support Services',
  'Monday – Sunday',
  'Open 24 Hours',
  'Open public access',
  'Valid prescription and photo ID required for controlled medications. Curbside pickup available at North Entrance.',
  7
);

INSERT INTO emergency_protocols (
  title, triage_level, response_time, phone, description, steps, display_order
) VALUES
(
  'Cardiac Emergency & Chest Pain',
  'Level 1 — Immediate',
  '< 5 min ECG · < 60 min Cath Lab',
  '+1 (800) 911-4325',
  'For crushing chest pressure, pain radiating to arm or jaw, sudden shortness of breath, or cold sweats. Do not drive yourself.',
  ARRAY['Call Emergency Dispatch immediately or dial 911', 'Sit upright and remain calm; loosen tight clothing', 'Chew one 325mg uncoated aspirin if not allergic and advised by dispatch', 'Alert triage immediately upon arrival for instant ECG'],
  1
),
(
  'Acute Stroke (BE-FAST Protocol)',
  'Level 1 — Immediate',
  '< 24 min Door-to-Needle',
  '+1 (800) 911-4325',
  'Sudden balance loss, vision changes, facial droop, arm weakness, or slurred speech require immediate clot-busting or endovascular care.',
  ARRAY['Note the exact time symptoms were last seen normal', 'Call Ambulance Dispatch—our EMS pre-alerts the Stroke Team en route', 'Do not give food, water, or oral medications', 'Bring a list of any blood thinners currently taken'],
  2
),
(
  'Major Trauma & Accidents',
  'Level 1 — Immediate',
  'Immediate Trauma Bay Activation',
  '+1 (800) 911-2628',
  'Severe falls, vehicular collisions, heavy bleeding, head injuries, or suspected spinal trauma are routed directly to our Level I Trauma Bays.',
  ARRAY['Ensure scene safety and do not move a person with suspected neck/spine injury', 'Apply firm, continuous direct pressure to active bleeding with clean cloth', 'Call Healix Advanced Life Support Ambulance for rapid extraction', 'Proceed to North Entrance Ground Floor Trauma Ramp'],
  3
),
(
  'Pediatric & Respiratory Distress',
  'Level 2 — Urgent',
  '< 10 min Pediatric Triage',
  '+1 (800) 911-4325',
  'Rapid breathing, bluish lips, persistent high fever with lethargy, severe allergic reactions (anaphylaxis), or febrile seizures in children.',
  ARRAY['Administer prescribed epinephrine auto-injector immediately for anaphylaxis', 'Keep child calm and upright if experiencing breathing difficulty', 'Bring immunization records and current weight if available', 'Dedicated Pediatric Emergency bays are staffed 24/7'],
  4
);


INSERT INTO appointments (
  booking_reference, doctor_slug, department_slug, appointment_date, time_slot,
  visit_type, patient_name, patient_email, patient_phone, patient_dob,
  patient_gender, reason_for_visit, insurance_provider, status
) VALUES
(
  'HX-2026-1042',
  'dr-aris-thorne',
  'cardiology',
  CURRENT_DATE + INTERVAL '3 days',
  '10:00 AM',
  'In-Person Consultation',
  'Clara Vance',
  'clara.vance@example.com',
  '+1 (617) 555-0148',
  '1984-06-14',
  'Female',
  'Annual preventive cardiovascular consultation and lipid review.',
  'Blue Cross Blue Shield',
  'Confirmed'
),
(
  'HX-2026-1088',
  'dr-mei-ling-chen',
  'neurology',
  CURRENT_DATE + INTERVAL '5 days',
  '02:00 PM',
  'Video Tele-Consult',
  'Julian Mercer',
  'julian.mercer@example.com',
  '+1 (617) 555-0192',
  '1979-11-02',
  'Male',
  'Follow-up review of 3T MRI findings and migraine management plan.',
  'Aetna Preferred',
  'Confirmed'
);

INSERT INTO appointment_faqs (category, question, answer, display_order) VALUES
(
  'Booking Process',
  'How far in advance can I schedule an outpatient consultation?',
  'Outpatient appointments can be booked up to 60 days in advance online. For urgent clinical concerns within 24 hours, call our triage desk at +1 (800) 432-5490.',
  1
),
(
  'Booking Process',
  'Do I need a referral before booking a specialist?',
  'Most Healix specialists accept direct self-referrals. However, certain HMO insurance plans may require a primary care referral for coverage—check with your insurer prior to your visit.',
  2
),
(
  'Preparation & Arrival',
  'What should I bring to my first appointment?',
  'Please arrive 15 minutes early with a valid government photo ID, your insurance card, a current list of medications, and any relevant imaging CDs or recent lab results.',
  3
),
(
  'Preparation & Arrival',
  'Are video tele-consultations available for follow-up visits?',
  'Yes. Select "Video Tele-Consult" during the slot booking step. A secure encrypted link is sent to your email 30 minutes before your scheduled consultation.',
  4
),
(
  'Changes & Cancellations',
  'How do I track or cancel an existing appointment?',
  'Use the Track Appointment page with your booking reference (e.g., HX-2026-1042) or registered email address to view live status or cancel at no charge up to 4 hours before your slot.',
  5
),
(
  'Changes & Cancellations',
  'Is there a fee for rescheduling or cancelling?',
  'Cancellations made at least 4 hours prior to your appointment carry no fee. You may immediately select a new date and time after cancelling.',
  6
),
(
  'Billing & Insurance',
  'Which insurance providers are accepted at Healix?',
  'Healix Medical Center participates with most major national and regional insurers including Blue Cross Blue Shield, Aetna, Cigna, UnitedHealthcare, and Medicare.',
  7
),
(
  'Billing & Insurance',
  'When is the consultation fee collected?',
  'Standard co-pays or self-pay consultation fees are settled at check-in on the day of your visit. No upfront payment is required to reserve your slot online.',
  8
);
