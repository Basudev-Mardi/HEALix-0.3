import http from 'http';
import fs from 'fs';
import path from 'path';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function verifySidebar() {
  console.log('================================================================');
  console.log('VERIFYING RECEPTION PORTAL SIDEBAR IMPLEMENTATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Static Verification of ReceptionistSidebar.tsx
  console.log('--- 1. Static Analysis of ReceptionistSidebar.tsx ---');
  const sidebarPath = path.resolve('frontend/my-app/components/receptionist/ReceptionistSidebar.tsx');
  assert(fs.existsSync(sidebarPath), 'ReceptionistSidebar.tsx exists');
  const sidebarCode = fs.readFileSync(sidebarPath, 'utf8');

  // Verify Title
  assert(
    sidebarCode.includes('Hospital Management System'),
    'Sidebar title contains "Hospital Management System"'
  );

  // Verify Section
  assert(
    sidebarCode.includes('SECTION: RECEPTION') || sidebarCode.includes('Reception'),
    'Sidebar section contains "Reception"'
  );

  // Verify the 10 navigation items
  const requiredNavItems = [
    'Dashboard',
    'New Patient Registration',
    'Patient Directory',
    'Token Management',
    'Appointments',
    'Doctor Availability',
    'Billing & Payments',
    'Visit History',
    'Reports',
    'Settings',
  ];

  for (const item of requiredNavItems) {
    assert(
      sidebarCode.includes(`'${item}'`) || sidebarCode.includes(`"${item}"`),
      `Navigation item present: "${item}"`
    );
  }

  // Verify Collapse & Permissions
  assert(
    sidebarCode.includes('isCollapsed') && sidebarCode.includes('onToggleCollapse'),
    'Sidebar collapse and toggle logic implemented'
  );
  assert(
    sidebarCode.includes('staffUser') && (sidebarCode.includes('receptionist') || sidebarCode.includes('administrator')),
    'Role-based permissions check implemented'
  );

  // 2. Integration in ReceptionistDashboard.tsx
  console.log('\n--- 2. Static Analysis of ReceptionistDashboard.tsx ---');
  const dashboardPath = path.resolve('frontend/my-app/components/receptionist/ReceptionistDashboard.tsx');
  const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');

  assert(dashboardCode.includes('<ReceptionistSidebar'), 'ReceptionistSidebar is mounted in ReceptionistDashboard');
  assert(dashboardCode.includes('activeView === \'dashboard\''), 'Dashboard view wired up');
  assert(dashboardCode.includes('activeView === \'registration\''), 'New Patient Registration view wired up');
  assert(dashboardCode.includes('activeView === \'directory\''), 'Patient Directory view wired up');
  assert(dashboardCode.includes('activeView === \'tokens\''), 'Token Management view wired up');
  assert(dashboardCode.includes('activeView === \'appointments\''), 'Appointments view wired up');
  assert(dashboardCode.includes('activeView === \'doctors\''), 'Doctor Availability view wired up');
  assert(dashboardCode.includes('activeView === \'billing\''), 'Billing & Payments view wired up');
  assert(dashboardCode.includes('activeView === \'history\''), 'Visit History view wired up');
  assert(dashboardCode.includes('activeView === \'reports\''), 'Reports view wired up');
  assert(dashboardCode.includes('activeView === \'settings\''), 'Settings view wired up');

  // 3. Backend Verification for Doctor Availability & Status Updates
  console.log('\n--- 3. Backend API Verification for Doctor Availability ---');
  try {
    const docListRes = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/v1/reception/visits/available-doctors',
      method: 'GET',
    });

    assert(docListRes.status === 200, 'GET /visits/available-doctors returned 200 OK');
    assert(Array.isArray(docListRes.body.doctors), 'Doctors list is an array');
    assert(Array.isArray(docListRes.body.departments), 'Departments list is an array');

    if (docListRes.body.doctors.length > 0) {
      const firstDoc = docListRes.body.doctors[0];
      console.log(`   Testing Doctor Status Update for Doctor #${firstDoc.id} (${firstDoc.name})`);

      // Update doctor availability to 'On Break'
      const updateRes = await request(
        {
          hostname: '127.0.0.1',
          port: 5000,
          path: `/api/v1/reception/doctors/${firstDoc.id}/availability`,
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        },
        { status: 'On Break', staff_name: 'Elena Rostova (REC-4011)' }
      );

      assert(updateRes.status === 200, `PATCH /doctors/:id/availability returned 200 OK (got ${updateRes.status})`);
      assert(updateRes.body.doctor?.availability_status === 'On Break', 'Doctor status updated to "On Break"');

      // Restore doctor availability to 'Available'
      const restoreRes = await request(
        {
          hostname: '127.0.0.1',
          port: 5000,
          path: `/api/v1/reception/doctors/${firstDoc.id}/availability`,
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        },
        { status: 'Available', staff_name: 'Elena Rostova (REC-4011)' }
      );

      assert(restoreRes.status === 200, 'Doctor status restored to "Available"');
    }
  } catch (err) {
    console.error('API verification error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

verifySidebar();
