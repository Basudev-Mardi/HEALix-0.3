import 'dotenv/config';

async function testReports() {
  console.log('--- Starting Reports & Analytics Verification ---');
  const baseUrl = 'http://localhost:5000';

  try {
    // 1. Test Default Analytics (Today, Receptionist)
    console.log('\n[1] Testing GET /api/v1/reception/reports/analytics (Default Today, Receptionist)...');
    const res1 = await fetch(`${baseUrl}/api/v1/reception/reports/analytics?staff_role=receptionist`);
    const json1 = await res1.json();

    if (res1.status !== 200 || !json1.success) {
      throw new Error(`Analytics default failed: ${res1.status} - ${JSON.stringify(json1)}`);
    }
    const data1 = json1;
    console.log('✓ Successfully retrieved analytics summary:');
    console.log(`  - Total Registrations: ${data1.summary.total_registrations}`);
    console.log(`  - Total Consultations: ${data1.summary.total_consultations}`);
    console.log(`  - Waiting Patients: ${data1.summary.waiting_patients}`);
    console.log(`  - Completed Patients: ${data1.summary.completed_patients}`);
    console.log(`  - Total Tokens: ${data1.summary.total_tokens}`);
    console.log(`  - Emergency Registrations: ${data1.summary.emergency_registrations}`);
    console.log(`  - Total Appointments: ${data1.summary.total_appointments}`);
    console.log(`  - Check-in Rate: ${data1.summary.appointment_checkin_rate}%`);
    console.log(`  - Department Volume entries: ${data1.department_volume.length}`);
    console.log(`  - Doctor Volume entries: ${data1.doctor_volume.length}`);
    console.log(`  - Financials can_view: ${data1.financials.can_view}`);
    if (data1.financials.can_view) {
      console.log(`  - Total Billed: ₹${data1.financials.total_billed}, Paid: ₹${data1.financials.total_paid}`);
    }

    // 2. Test Custom Date Range & Department Filter
    console.log('\n[2] Testing GET /api/v1/reception/reports/analytics with Date Range & Department Filter...');
    const params2 = new URLSearchParams({
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      department_id: '1',
      staff_role: 'administrator',
    });
    const res2 = await fetch(`${baseUrl}/api/v1/reception/reports/analytics?${params2.toString()}`);
    const json2 = await res2.json();

    if (res2.status !== 200 || !json2.success) {
      throw new Error(`Analytics filtered failed: ${res2.status} - ${JSON.stringify(json2)}`);
    }
    const data2 = json2;
    console.log('✓ Filtered analytics retrieved successfully:');
    console.log(`  - Filter: ${data2.filter.start_date} to ${data2.filter.end_date}, Dept ID: ${data2.filter.department_id}`);
    console.log(`  - Total Visits: ${data2.summary.total_visits}, Tokens: ${data2.summary.total_tokens}`);

    // 3. Test Financial RBAC Enforcement for unauthorized role (nurse)
    console.log('\n[3] Testing Financial RBAC Enforcement for Non-Financial Roles...');
    const resUnauthorized = await fetch(`${baseUrl}/api/v1/reception/reports/analytics?staff_role=nurse`);
    const jsonUnauth = await resUnauthorized.json();

    if (resUnauthorized.status !== 200 || !jsonUnauth.success) {
      throw new Error(`Analytics role check failed: ${resUnauthorized.status}`);
    }
    const financialsUnauth = jsonUnauth.financials;
    if (financialsUnauth.can_view !== false) {
      throw new Error(`SECURITY LEAK: Nurse should have can_view: false, but got ${financialsUnauth.can_view}`);
    }
    if (financialsUnauth.total_billed !== undefined || financialsUnauth.total_paid !== undefined) {
      throw new Error(`SECURITY LEAK: Financial figures exposed to unauthorized role`);
    }
    console.log('✓ RBAC Security Verified: Nurse correctly received restricted view without financial figures');
    console.log(`  - Notice: "${financialsUnauth.notice}"`);

    // 4. Test Authorized Roles for Financials (billing-staff)
    console.log('\n[4] Testing Financial RBAC for Authorized Roles (billing-staff)...');
    const resBilling = await fetch(`${baseUrl}/api/v1/reception/reports/analytics?staff_role=billing-staff`);
    const jsonBilling = await resBilling.json();

    if (resBilling.status !== 200 || !jsonBilling.financials.can_view) {
      throw new Error(`Billing staff should have can_view: true`);
    }
    console.log('✓ Billing staff authorized to view financials: can_view = true');

    // 5. Test CSV Export Endpoint
    console.log('\n[5] Testing GET /api/v1/reception/reports/export (CSV Generation)...');
    const paramsCsv = new URLSearchParams({
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      staff_role: 'receptionist',
    });
    const resCsv = await fetch(`${baseUrl}/api/v1/reception/reports/export?${paramsCsv.toString()}`);

    if (resCsv.status !== 200) {
      throw new Error(`CSV export failed: ${resCsv.status}`);
    }
    const contentType = resCsv.headers.get('content-type') || '';
    if (!contentType.includes('text/csv')) {
      throw new Error(`CSV export content-type invalid: ${contentType}`);
    }
    const csvContent = await resCsv.text();
    console.log('✓ CSV generated successfully with size: ' + csvContent.length + ' bytes');
    const lines = csvContent.split('\n').filter(Boolean);
    console.log(`  - Total CSV Lines: ${lines.length}`);
    console.log(`  - First 3 lines preview:\n    ${lines.slice(0, 3).join('\n    ')}`);

    // Verify CSV contains sections:
    const requiredSections = [
      '# SECTION: SUMMARY METRICS',
      '# SECTION: DEPARTMENT PATIENT VOLUME',
      '# SECTION: DOCTOR CONSULTATION VOLUME',
      '# SECTION: APPOINTMENT STATISTICS',
      '# SECTION: FINANCIAL & REVENUE TELEMETRY'
    ];
    for (const sec of requiredSections) {
      if (!csvContent.includes(sec)) {
        throw new Error(`CSV missing expected section: ${sec}`);
      }
    }
    console.log('✓ All expected CSV report sections present');

    // 6. Test CSV Export with Unauthorized Role (Doctor)
    console.log('\n[6] Testing CSV Export with Non-Financial Role (Doctor)...');
    const paramsCsvUnauth = new URLSearchParams({
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      staff_role: 'doctor',
    });
    const resCsvUnauth = await fetch(`${baseUrl}/api/v1/reception/reports/export?${paramsCsvUnauth.toString()}`);
    if (resCsvUnauth.status !== 200) {
      throw new Error(`CSV export failed: ${resCsvUnauth.status}`);
    }
    const csvUnauthContent = await resCsvUnauth.text();
    if (csvUnauthContent.includes('# SECTION: FINANCIAL & REVENUE TELEMETRY')) {
      throw new Error(`SECURITY LEAK: Financial section exposed in CSV to doctor`);
    }
    if (!csvUnauthContent.includes('# FINANCIAL TELEMETRY RESTRICTED')) {
      throw new Error(`Expected restriction notice in CSV for doctor`);
    }
    console.log('✓ CSV RBAC Security Verified: Financial telemetry redacted from export for non-financial role');

    console.log('\n=========================================');
    console.log('ALL RECEPTION REPORTS & ANALYTICS TESTS PASSED!');
    console.log('=========================================\n');
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  }
}

testReports();
