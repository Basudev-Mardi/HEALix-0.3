// Global & Layout
export { default as SiteHeader } from './SiteHeader';
export { default as SiteFooter } from './SiteFooter';
export { default as PageHeader } from './PageHeader';

// Feedback, Modals & System States
export {
  PageLoader,
  ErrorDisplay,
  EmptyState,
  ToastNotification,
  ConfirmationModal,
} from './FeedbackComponents';

// Form & Input System
export {
  TextInput,
  SelectInput,
  Textarea,
  RadioGroup,
  Checkbox,
  FileUpload,
} from './FormComponents';

// Hospital Domain Cards & Statistics
export {
  DoctorCard,
  DepartmentCard,
  HospitalStatistics,
} from './HospitalCards';

// Patient Domain Cards & Portal Components
export {
  PatientProfileSummary,
  AppointmentCard,
  MedicalReportCard,
  DashboardStatistics,
} from './PatientCards';

// Booking Flow Components
export { default as AppointmentStepper } from './AppointmentStepper';
export { default as AppointmentDoctorFinder } from './AppointmentDoctorFinder';
export { default as BookAppointmentClient } from './BookAppointmentClient';
export { default as PatientDetailsClient } from './PatientDetailsClient';
export { default as ConfirmationClient } from './ConfirmationClient';

// Core Directory & Showcase Clients
export { default as DoctorsDirectoryClient } from './DoctorsDirectoryClient';
export { default as DepartmentsDirectoryClient } from './DepartmentsDirectoryClient';
export { default as ServicesDirectoryClient } from './ServicesDirectoryClient';
export { default as HealthPackagesClient } from './HealthPackagesClient';
export { default as HealthLibraryClient } from './HealthLibraryClient';
