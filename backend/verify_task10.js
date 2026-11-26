import http from 'http';

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

async function runVerification() {
  console.log('================================================================');
  console.log('BEGINNING RECEPTION PORTAL TASK 10 VERIFICATION TEST');
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

  try {
    // 1. EMERGENCY PATIENT REGISTRATION & STRICT TRIAGE RESTRICTION
    console.log('--- 1. Testing Emergency Patient Intake & Triage Level Enforcement ---');
    const emergencyPayload = {
      is_unknown_patient: true,
      gender: 'Male',
      estimated_age: '42',
      emergency_notes: 'Brought by EMS after road accident, head laceration',
      assigned_bay: 'Emergency Resuscitation Bay 1',
      requested_triage_level: 'ESI-1 Resuscitation (Clinical Override Attempt)', // Must be rejected/locked!
    };

    const regRes = await request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/v1/reception/emergency/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      emergencyPayload
    );

    assert(regRes.status === 201, `Emergency registration returned 201 Created (got ${regRes.status})`);
    assert(regRes.body.success === true, 'Response marked success');
    assert(regRes.body.visit?.visit_type === 'Emergency', `Visit type is Emergency (got ${regRes.body.visit?.visit_type})`);
    assert(
      regRes.body.visit?.triage_level === 'Pending Clinical Triage',
      `STRICT CLINICAL RULE: Triage level is locked as 'Pending Clinical Triage' (got '${regRes.body.visit?.triage_level}')`
    );
    assert(
      regRes.body.token?.token_display?.startsWith('EMR') || regRes.body.token?.token_number > 0,
      `Generated priority emergency token: ${regRes.body.token?.token_display}`
    );
    assert(
      regRes.body.alert?.status === 'Active',
      `Emergency alert dispatched: ${regRes.body.alert?.alert_type} to trauma teams`
    );

    // 2. EMERGENCY ALERTS BROADCAST & ACTIVE STATUS
    console.log('\n--- 2. Testing Emergency Alert Broadcast & Live Alert Feed ---');
    const alertPayload = {
      alert_type: 'Code Blue - Cardiac Arrest',
      location: 'Emergency Resuscitation Bay 2',
      severity: 'Critical',
      condition_summary: 'Adult male in ventricular fibrillation, CPR in progress',
      staff_name: 'Front Desk Reception',
    };

    const alertRes = await request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/v1/reception/emergency/alerts',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      alertPayload
    );

    assert(alertRes.status === 201, `Alert broadcast returned 201 Created (got ${alertRes.status})`);
    assert(alertRes.body.alert?.alert_type === 'Code Blue - Cardiac Arrest', 'Code Blue recorded');

    // Query active alerts
    const getAlertsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/reception/emergency/alerts',
      method: 'GET',
    });

    assert(getAlertsRes.status === 200, 'GET /emergency/alerts returned 200 OK');
    assert(getAlertsRes.body.has_active_emergency === true, 'has_active_emergency is TRUE');
    assert(getAlertsRes.body.active_alerts?.length > 0, `Active alerts count: ${getAlertsRes.body.active_alerts?.length}`);

    // 3. INTEGRATIONS SERVICE REAL STATUS (NO SIMULATIONS)
    console.log('\n--- 3. Testing Integration Service Status & Non-Simulation Enforcement ---');
    const intStatusRes = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/v1/reception/integrations/status',
      method: 'GET',
    });

    assert(intStatusRes.status === 200, 'GET /integrations/status returned 200 OK');
    assert(intStatusRes.body.integrations !== undefined, 'Integrations metadata present');
    console.log('   Twilio SMS Configured:', intStatusRes.body.integrations.twilio_sms.configured);
    console.log('   WhatsApp Configured:', intStatusRes.body.integrations.whatsapp.configured);

    // Test sending notification when unconfigured (strict requirement: Do not simulate successful delivery!)
    const notifyPayload = {
      channel: 'sms',
      mobile: '+1234567890',
      message: 'Test notification',
    };

    const notifyRes = await request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/v1/reception/notifications/send',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      notifyPayload
    );

    if (!intStatusRes.body.integrations.twilio_sms.configured) {
      assert(
        notifyRes.status === 503,
        `Unconfigured SMS gateway returned HTTP 503 Service Unavailable (got ${notifyRes.status})`
      );
      assert(
        notifyRes.body.configured === false,
        'Response accurately reflects configured: false (no fake delivery simulated)'
      );
      assert(
        notifyRes.body.error?.includes('not simulated'),
        `Error contains non-simulation notice: "${notifyRes.body.error}"`
      );
    } else {
      assert(notifyRes.status === 200, 'Configured SMS gateway dispatched');
    }

    // 4. PUBLIC DIGITAL QUEUE DISPLAY FEED
    console.log('\n--- 4. Testing Public Digital Queue Display Feed ---');
    const publicDisplayRes = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/v1/reception/queue/public-display',
      method: 'GET',
    });

    assert(publicDisplayRes.status === 200, 'GET /queue/public-display returned 200 OK');
    assert(publicDisplayRes.body.hospital_name === 'Healix Medical Center', 'Hospital name verified');
    assert(Array.isArray(publicDisplayRes.body.now_serving), 'now_serving is an array');
    assert(Array.isArray(publicDisplayRes.body.upcoming_queue), 'upcoming_queue is an array');
    assert(publicDisplayRes.body.active_emergency !== null, 'Active emergency banner present in feed');
    console.log('   Now Serving Count:', publicDisplayRes.body.now_serving.length);
    console.log('   Upcoming Queue Count:', publicDisplayRes.body.upcoming_queue.length);
    if (publicDisplayRes.body.now_serving.length > 0) {
      const sample = publicDisplayRes.body.now_serving[0];
      console.log('   Sample Token Display:', sample.token_display);
      console.log('   Sample Masked Patient:', sample.masked_patient_name);
      console.log('   Sample Room / Cabin:', sample.room_or_cabin);
      assert(sample.masked_patient_name?.endsWith('.'), 'Patient name is properly masked for privacy');
    }

    console.log('\n================================================================');
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runVerification();
