'use strict';
const express = require('express');
const router = express.Router();
const { sqlite } = require('../db');

// GET /ical/:token.ics — 공개 iCal 피드 (Google Calendar 구독용)
router.get('/:token.ics', (req, res) => {
  const { token } = req.params;
  if (!/^[0-9a-f]{64}$/.test(token)) return res.status(404).type('text').send('Not found');

  const user = sqlite.prepare(
    'SELECT id FROM portal_users WHERE ical_token = ? AND is_active = 1'
  ).get(token);
  if (!user) return res.status(404).type('text').send('Calendar not found');

  const events = sqlite.prepare(
    'SELECT * FROM portal_events WHERE portal_user_id = ? ORDER BY starts_at ASC'
  ).all(user.id);

  const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Highlaw//Portal Calendar//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:법무법인 하이로',
    'X-WR-TIMEZONE:Asia/Seoul',
  ];

  for (const ev of events) {
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + ev.id + '@highlaw.co.kr');
    lines.push('DTSTAMP:' + now);

    if (ev.is_all_day) {
      const ds = (ev.starts_at || '').substring(0, 10).replace(/-/g, '');
      const de = (ev.ends_at || ev.starts_at || '').substring(0, 10).replace(/-/g, '');
      lines.push('DTSTART;VALUE=DATE:' + ds);
      lines.push('DTEND;VALUE=DATE:' + de);
    } else {
      lines.push('DTSTART;TZID=Asia/Seoul:' + toIcalDT(ev.starts_at));
      lines.push('DTEND;TZID=Asia/Seoul:' + toIcalDT(ev.ends_at || ev.starts_at));
    }

    lines.push('SUMMARY:' + escIcal(ev.title || ''));
    if (ev.description) lines.push('DESCRIPTION:' + escIcal(ev.description));
    if (ev.location) lines.push('LOCATION:' + escIcal(ev.location));
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="highlaw.ics"');
  res.send(lines.join('\r\n'));
});

function toIcalDT(s) {
  if (!s) return '19700101T000000';
  // "2024-01-15T09:00" → remove - and : → "20240115T0900" → pad to 15 → "20240115T090000"
  const clean = s.substring(0, 16).replace(/[-:]/g, '');
  return clean.padEnd(15, '0');
}

function escIcal(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

module.exports = router;
