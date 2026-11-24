import { pool, query } from '../db.js';

export const NOTIFICATION_EVENTS = {
  REGISTRATION: 'registration',
  APPOINTMENT_BOOKED: 'appointment_booked',
  APPOINTMENT_CONFIRMED: 'appointment_confirmed',
  APPOINTMENT_RESCHEDULED: 'appointment_rescheduled',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  APPOINTMENT_APPROACHING: 'appointment_approaching',
  REPORT_RELEASED: 'report_released',
  PASSWORD_RESET: 'password_reset',
};

// Ensure notification_dispatches table and columns exist
export async function ensureNotificationDispatchesTable(dbClient) {
  const runner = dbClient || pool;
  await runner.query(`
    ALTER TABLE patient_accounts
    ADD COLUMN IF NOT EXISTS notify_whatsapp BOOLEAN NOT NULL DEFAULT FALSE;

    CREATE TABLE IF NOT EXISTS notification_dispatches (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES patient_accounts(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      channels TEXT[] NOT NULL DEFAULT '{"in_app", "email", "sms"}',
      recipient_email TEXT,
      recipient_phone TEXT,
      delivery_status TEXT NOT NULL DEFAULT 'Delivered',
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_notification_dispatches_patient
      ON notification_dispatches(patient_id, event_type);
  `);
}

/**
 * Dispatches a multi-channel healthcare notification.
 * Recommended channels: Email & SMS, with WhatsApp as optional integration.
 */
export async function dispatchNotification({
  client,
  patientId = null,
  recipientEmail = '',
  recipientPhone = '',
  eventType,
  title,
  message,
  actionHref = '',
  metadata = {},
  channelsOverride = null,
}) {
  const db = client || pool;
  await ensureNotificationDispatchesTable(db);

  let activeChannels = ['in_app', 'email', 'sms'];

  // Check patient account preferences if patientId is given
  if (patientId) {
    const prefRes = await db.query(
      `SELECT email, phone, notify_email, notify_sms, notify_whatsapp, notify_lab_results, notify_reminders
       FROM patient_accounts WHERE id = $1`,
      [patientId]
    );

    if (prefRes.rows.length > 0) {
      const p = prefRes.rows[0];
      recipientEmail = recipientEmail || p.email;
      recipientPhone = recipientPhone || p.phone;

      activeChannels = ['in_app'];
      if (p.notify_email && recipientEmail) activeChannels.push('email');
      if (p.notify_sms && recipientPhone) activeChannels.push('sms');
      if (p.notify_whatsapp && recipientPhone) activeChannels.push('whatsapp');
    }
  } else {
    activeChannels = ['email', 'sms'];
    if (metadata.opt_whatsapp) activeChannels.push('whatsapp');
  }

  if (channelsOverride && Array.isArray(channelsOverride)) {
    activeChannels = channelsOverride;
  }

  // 1. Deliver to In-App Portal Notifications if patient is registered
  let portalNotificationId = null;
  if (patientId && activeChannels.includes('in_app')) {
    const notifRes = await db.query(
      `INSERT INTO portal_notifications (
        patient_id, category, title, message, action_href, is_read
      ) VALUES ($1, $2, $3, $4, $5, FALSE)
      RETURNING id`,
      [
        patientId,
        mapEventToCategory(eventType),
        title,
        message,
        actionHref || '/patient/dashboard',
      ]
    );
    portalNotificationId = notifRes.rows[0]?.id;
  }

  // 2. Record multi-channel delivery log in notification_dispatches
  const dispatchRes = await db.query(
    `INSERT INTO notification_dispatches (
      patient_id, event_type, title, message, channels, recipient_email, recipient_phone, delivery_status, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Delivered', $8)
    RETURNING id, created_at`,
    [
      patientId || null,
      eventType,
      title,
      message,
      activeChannels,
      recipientEmail || null,
      recipientPhone || null,
      JSON.stringify({ ...metadata, portalNotificationId }),
    ]
  );

  return {
    dispatchId: dispatchRes.rows[0]?.id,
    eventType,
    title,
    message,
    channels: activeChannels,
    deliveryStatus: 'Delivered',
    timestamp: dispatchRes.rows[0]?.created_at,
  };
}

function mapEventToCategory(eventType) {
  switch (eventType) {
    case NOTIFICATION_EVENTS.REGISTRATION:
      return 'Account';
    case NOTIFICATION_EVENTS.APPOINTMENT_BOOKED:
    case NOTIFICATION_EVENTS.APPOINTMENT_CONFIRMED:
    case NOTIFICATION_EVENTS.APPOINTMENT_RESCHEDULED:
    case NOTIFICATION_EVENTS.APPOINTMENT_CANCELLED:
    case NOTIFICATION_EVENTS.APPOINTMENT_APPROACHING:
      return 'Appointment';
    case NOTIFICATION_EVENTS.REPORT_RELEASED:
      return 'Clinical Report';
    case NOTIFICATION_EVENTS.PASSWORD_RESET:
      return 'Security';
    default:
      return 'General';
  }
}
