// Zavoia — Support flow sample data. Plain JS (global scope).
// Tickets, the reported-item context, and small formatters.

// Ticket statuses → label + accent color (drawn from the Zavoia status ramp).
const SUPPORT_STATUS = {
  OPEN:        { label: 'Open',        color: 'var(--s-info-600)' },
  IN_PROGRESS: { label: 'In progress', color: 'var(--s-success-600)' },
  CLOSED:      { label: 'Closed',      color: 'var(--c-500)' },
  REOPENED:    { label: 'Reopened',    color: 'var(--s-warning-600)' },
};

const CATEGORY = {
  BUG:      { label: 'Issue' },
  QUESTION: { label: 'Question' },
};

// The contextual entry payload — what "Report a problem" hands to the
// New-ticket screen. `label` is the only thing the customer ever sees;
// the ids ride along invisibly for support.
const REPORTED_ITEM = {
  kind: 'appointment',            // appointment | listing | professional
  label: 'Masaj relaxare · Bella Beauty Group · Thu Jun 11 2026 · 18:00',
  service: 'Masaj relaxare',
  venue: 'Bella Beauty Group',
  when: 'Thu Jun 11 2026 · 18:00',
  ids: { business: 'biz_8841', location: 'loc_212', appointment: 'appt_55027' },
};

// Conversation seeds. `from` is 'user' | 'support'.
const SEED_THREADS = {
  t1: [
    { from: 'user', text: "I tried to reschedule my massage but the app froze on the time picker and never saved the new slot.", at: '11:02 AM' },
    { from: 'support', text: "Thanks for flagging this — I can see the appointment on our side. We've reproduced the freeze on the reschedule step and a fix is rolling out today.", at: '11:18 AM' },
    { from: 'support', text: "In the meantime I've moved you to Thu Jun 11, 18:00. Does that work?", at: '11:19 AM' },
  ],
  t4: [
    { from: 'user', text: "My reminder notification arrived after the appointment had already started. Can you check my notification settings?", at: '9:40 AM' },
    { from: 'support', text: "Thanks for letting us know — I can see the reminder went out late on our side. We've corrected the schedule, so your next one will arrive the day before as expected.", at: '9:52 AM' },
  ],
  t2: [
    { from: 'user', text: "The pin for this salon is in the wrong place on the map, it points two streets over.", at: 'Yesterday' },
    { from: 'support', text: "Good catch. We've corrected the coordinates for that listing — should refresh within the hour.", at: 'Yesterday' },
    { from: 'user', text: "Still showing the old spot for me.", at: '14m ago' },
  ],
  t3: [
    { from: 'user', text: "How do I cancel a booking?", at: '3h ago' },
    { from: 'support', text: "You can cancel up to 24h before the appointment from Bookings → the appointment → Cancel. Inside 24h, the venue's cancellation policy applies.", at: '3h ago' },
  ],
  t5: [
    { from: 'user', text: "Is it possible to request a different stylist for my next visit?", at: '3h ago' },
  ],
};

// Ticket list (newest first). `reported` links to a reported entity.
const SEED_TICKETS = [
  {
    id: 't1', num: 1042, category: 'BUG', status: 'OPEN', unread: true,
    preview: "Couldn't reschedule my appointment",
    ago: '1m ago', created: 'Jun 4 · 11:00 AM',
    reported: { kind: 'appointment', label: 'Masaj relaxare · Bella Beauty Group · Thu Jun 11 · 18:00' },
    thread: 't1',
  },
  {
    id: 't4', num: 1041, category: 'BUG', status: 'IN_PROGRESS', unread: true,
    preview: 'Reminder arrived too late',
    ago: '15m ago', created: 'Jun 4 · 9:38 AM',
    reported: null,
    thread: 't4',
  },
  {
    id: 't2', num: 1039, category: 'BUG', status: 'REOPENED', unread: false,
    preview: 'Wrong location showing on the map',
    ago: '14m ago', created: 'Jun 3 · 4:21 PM',
    reported: { kind: 'listing', label: 'Glow Studio · Soho, London' },
    thread: 't2',
  },
  {
    id: 't5', num: 1038, category: 'QUESTION', status: 'OPEN', unread: false,
    preview: 'Can I request a different stylist?',
    ago: '3h ago', created: 'Jun 4 · 8:05 AM',
    reported: { kind: 'professional', label: 'Mara Voinescu · Glow Studio' },
    thread: 't5',
  },
  {
    id: 't3', num: 1036, category: 'QUESTION', status: 'CLOSED', unread: false,
    preview: 'How do I cancel a booking?',
    ago: '3h ago', created: 'Jun 4 · 7:40 AM',
    reported: null,
    thread: 't3',
  },
];

// Icon name per reported-item kind.
const KIND_ICON = { appointment: 'cal', listing: 'pin', professional: 'user' };
const KIND_LABEL = { appointment: 'Appointment', listing: 'Listing', professional: 'Professional' };

Object.assign(window, {
  SUPPORT_STATUS, CATEGORY, REPORTED_ITEM, SEED_TICKETS, SEED_THREADS, KIND_ICON, KIND_LABEL,
});
