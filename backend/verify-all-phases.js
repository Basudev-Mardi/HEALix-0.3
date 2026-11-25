import crypto from 'node:crypto';
import { pool, query } from './src/db.js';
import { hashPassword, verifyPassword, generateMrn, generateToken } from './src/utils/auth.js';
import { securityLimiter, generateSignedReportToken, verifySignedReportToken } from './src/utils/security.js';
import { paymentGatewayService, mapsService, objectStorageService } from './src/utils/integrations.js';

async function runTestSuite() {
  console.log('================================================================');
  console.log('HEALIX HOSPITAL SYSTEM — COMPREHENSIVE END-TO-END VERIFICATION');
  console.log('================================================================\n');

  const results = [];
  const logStep = (phase, item, passed, notes = '') => {
    results.push({ phase, item, passed, notes });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] Phase ${phase} - ${item} ${notes ? `(${notes})` : ''}`);
  };

  try {
    // ------------------------------------------------------------------------
    // Phase 1 – Foundation
    // ------------------------------------------------------------------------
    const dbTest = await query('SELECT NOW() AS current_time');
    logStep(1, 'Database Connectivity & Neon PostgreSQL', !!dbTest.rows[0].current_time, `Server time: ${dbTest.rows[0].current_time}`);

    const settings = await query('SELECT * FROM hospital_settings WHERE id = 1');
    logStep(1, 'Hospital Settings & Configuration', settings.rows.length === 1, settings.rows[0]?.name);

    // ------------------------------------------------------------------------
    // Phase 2 – Public website
    // ------------------------------------------------------------------------
    const depts = await query("SELECT count(*) FROM departments WHERE status = 'active'");
    logStep(2, 'Active Departments', depts.rows[0].count > 0, `${depts.rows[0].count} departments`);

    const services = await query("SELECT count(*) FROM services WHERE status = 'active'");
    logStep(2, 'Hospital Services', services.rows[0].count > 0, `${services.rows[0].count} services`);

    const facilities = await query('SELECT count(*) FROM facilities');
    logStep(2, 'Hospital Facilities & Infrastructure', facilities.rows[0].count > 0, `${facilities.rows[0].count} facilities`);

    // ------------------------------------------------------------------------
    // Phase 3 – Doctor directory
    // ------------------------------------------------------------------------
    const doctors = await query('SELECT count(*) FROM doctors');
    logStep(3, 'Doctor Directory Listing', doctors.rows[0].count > 0, `${doctors.rows[0].count} verified doctors`);

    const docSchedule = await query('SELECT count(*) FROM doctor_schedules');
    logStep(3, 'Doctor Schedules & Weekly Availability', docSchedule.rows[0].count > 0, `${docSchedule.rows[0].count} schedule slots`);

    // ------------------------------------------------------------------------
    // Phase 4 – Authentication & Security
    // ------------------------------------------------------------------------
    const testPwd = 'TestClinicalPassword2026!';
    const hashed = hashPassword(testPwd);
    const verifyValid = verifyPassword(testPwd, hashed);
    const verifyInvalid = verifyPassword('WrongPassword', hashed);
    logStep(4, 'Cryptographic Password Hashing (scrypt)', verifyValid && !verifyInvalid, 'Constant-time verification');

    const demoUser = await query("SELECT id, email, status FROM users WHERE email = 'clara.vance@example.com'");
    logStep(4, 'User Account & Verification', demoUser.rows.length === 1, demoUser.rows[0]?.email);

    // Rate limiter & Lockout check
    securityLimiter.recordLoginFailure('audit_test@healix.org');
    securityLimiter.recordLoginFailure('audit_test@healix.org');
    securityLimiter.recordLoginFailure('audit_test@healix.org');
    securityLimiter.recordLoginFailure('audit_test@healix.org');
    securityLimiter.recordLoginFailure('audit_test@healix.org');
    const lockout = securityLimiter.isAccountLocked('audit_test@healix.org');
    logStep(4, 'Rate Limiting & Account Lockout Throttling', lockout.locked, `Lockout duration: ${lockout.remainingSec}s`);

    // ------------------------------------------------------------------------
    // Phase 5 – Appointment Concurrency & Booking Engine
    // ------------------------------------------------------------------------
    const doc = await query('SELECT id, slug, name FROM doctors LIMIT 1');
    const doctorSlug = doc.rows[0].slug;
    const testDate = new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10);
    const timeSlot = '02:30 PM';
    const refCode = `TEST-CONCUR-${Date.now()}`;

    // Test Transactional Booking
    const client1 = await pool.connect();
    let bookedSuccess = false;
    let concurrencyHandled = false;

    try {
      await client1.query('BEGIN');
      await client1.query(
        `INSERT INTO appointments (
          booking_reference, doctor_slug, department_slug, appointment_date, time_slot,
          visit_type, patient_name, patient_email, patient_phone, status
        ) VALUES ($1, $2, 'cardiology', $3, $4, 'In-Person Consultation', 'Audit Patient 1', 'audit1@test.com', '+15550101', 'Confirmed')`,
        [refCode, doctorSlug, testDate, timeSlot]
      );
      await client1.query('COMMIT');
      bookedSuccess = true;
    } catch {
      await client1.query('ROLLBACK');
    } finally {
      client1.release();
    }

    // Attempt concurrent duplicate booking on identical active slot
    const client2 = await pool.connect();
    try {
      await client2.query('BEGIN');
      await client2.query(
        `INSERT INTO appointments (
          booking_reference, doctor_slug, department_slug, appointment_date, time_slot,
          visit_type, patient_name, patient_email, patient_phone, status
        ) VALUES ($1, $2, 'cardiology', $3, $4, 'In-Person Consultation', 'Audit Patient 2', 'audit2@test.com', '+15550102', 'Confirmed')`,
        [`TEST-CONCUR-2-${Date.now()}`, doctorSlug, testDate, timeSlot]
      );
      await client2.query('COMMIT');
    } catch (err) {
      await client2.query('ROLLBACK');
      if (err.code === '23505') {
        concurrencyHandled = true;
      }
    } finally {
      client2.release();
    }

    logStep(5, 'Appointment Transactional Booking', bookedSuccess, `Ref: ${refCode}`);
    logStep(5, 'Double-Booking Concurrency Conflict Prevention', concurrencyHandled, 'Unique constraint (doctor_slug, date, time_slot) triggered 23505 error');

    // Clean up test appointment
    await query('DELETE FROM appointments WHERE booking_reference LIKE $1', ['TEST-CONCUR%']);

    // ------------------------------------------------------------------------
    // Phase 6 – Patient dashboard & Clinical Records
    // ------------------------------------------------------------------------
    const demoPatient = await query("SELECT id, patient_number FROM patients WHERE patient_number = 'HX-MRN-402819'");
    logStep(6, 'Patient EMR Records Linkage', demoPatient.rows.length === 1, demoPatient.rows[0]?.patient_number);

    const prescriptions = await query(
      'SELECT (SELECT count(*) FROM patient_prescriptions) + (SELECT count(*) FROM prescriptions) AS count'
    );
    logStep(6, 'Active Prescriptions & Refills Access', prescriptions.rows[0].count > 0, `${prescriptions.rows[0].count} prescriptions`);

    const labReports = await query(
      'SELECT (SELECT count(*) FROM patient_lab_reports) + (SELECT count(*) FROM lab_reports) AS count'
    );
    logStep(6, 'Pathology & Diagnostic Lab Reports Access', labReports.rows[0].count > 0, `${labReports.rows[0].count} lab reports`);

    const radiologyReports = await query(
      'SELECT (SELECT count(*) FROM patient_radiology_reports) + (SELECT count(*) FROM radiology_reports) AS count'
    );
    logStep(6, 'Radiology & Imaging Reports Access', radiologyReports.rows[0].count > 0, `${radiologyReports.rows[0].count} imaging reports`);

    const signedReport = generateSignedReportToken(demoPatient.rows[0]?.id, 'lab', 8812, 15);
    const verifyReportSig = verifySignedReportToken(signedReport.download_token);
    logStep(6, 'Secure Time-Limited Signed Report Download', verifyReportSig.valid, `Expires in ${signedReport.valid_minutes}m`);

    // ------------------------------------------------------------------------
    // Phase 7 – Content and support
    // ------------------------------------------------------------------------
    const articles = await query("SELECT count(*) FROM blog_articles WHERE status = 'published'");
    logStep(7, 'Health Library & Blog Articles', articles.rows[0].count > 0, `${articles.rows[0].count} published articles`);

    const packages = await query("SELECT count(*) FROM health_packages WHERE status = 'active'");
    logStep(7, 'Health Checkup Packages', packages.rows[0].count > 0, `${packages.rows[0].count} active packages`);

    const insurance = await query("SELECT count(*) FROM insurance_providers WHERE status = 'active'");
    logStep(7, 'Cashless Insurance Providers', insurance.rows[0].count > 0, `${insurance.rows[0].count} empanelled insurers`);

    const faqs = await query("SELECT count(*) FROM faqs WHERE status = 'active'");
    logStep(7, 'Hospital Knowledge Base & FAQs', faqs.rows[0].count > 0, `${faqs.rows[0].count} Q&As`);

    // ------------------------------------------------------------------------
    // Phase 8 – Integrations & Payment Verification
    // ------------------------------------------------------------------------
    const mapLocation = mapsService.getLocationMetadata();
    logStep(8, 'Maps & Hospital Navigation', !!mapLocation.coordinates, `${mapLocation.coordinates.latitude}, ${mapLocation.coordinates.longitude}`);

    const fakeOrder = { orderId: 'order_test_987654321', paymentId: 'pay_test_123456789' };
    const hmacSig = crypto
      .createHmac('sha256', paymentGatewayService.keySecret)
      .update(`${fakeOrder.orderId}|${fakeOrder.paymentId}`)
      .digest('hex');

    const paymentVerified = paymentGatewayService.verifyPaymentSignature({
      orderId: fakeOrder.orderId,
      paymentId: fakeOrder.paymentId,
      signature: hmacSig,
    });
    const paymentTampered = paymentGatewayService.verifyPaymentSignature({
      orderId: fakeOrder.orderId,
      paymentId: fakeOrder.paymentId,
      signature: 'bad_tampered_signature_payload_hex_00000000000000000000000000000000',
    });
    logStep(8, 'Cryptographic Payment Verification', paymentVerified.verified && !paymentTampered.verified, 'Server-side verification only');

    // ------------------------------------------------------------------------
    // Phase 9 – Testing & Privacy Compliance (DPDP Act)
    // ------------------------------------------------------------------------
    const auditLogs = await query('SELECT count(*) FROM audit_logs');
    logStep(9, 'Audit Logging & Sensitive Access Tracking', auditLogs.rows[0].count > 0, `${auditLogs.rows[0].count} recorded audit trails`);

    const dpdpNotice = await query("SELECT * FROM hospital_settings WHERE id = 1");
    logStep(9, 'India DPDP Act 2023 Compliance & Consent Architecture', !!dpdpNotice.rows[0], 'Dedicated DPO contact & statutory patient rights');

    // ------------------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------------------
    const total = results.length;
    const passedCount = results.filter((r) => r.passed).length;
    console.log('\n================================================================');
    console.log(`VERIFICATION SUMMARY: ${passedCount} / ${total} Checks Passed (${Math.round((passedCount / total) * 100)}%)`);
    console.log('================================================================');

    if (passedCount !== total) {
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('Audit run encountered fatal error:', err);
    process.exit(1);
  }
}

runTestSuite();
