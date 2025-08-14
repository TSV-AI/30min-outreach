// very simple merge, expand as needed
export function render(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

// default dental cold email sequence
export const DEFAULT_STEPS = [
  {
    dayOffset: 0,
    subject: "After-hours calls → booked appointments (hands-off)",
    bodyHtml: `Hi {{firstname}},<br/><br/>
We build a Voice AI that answers after-hours calls like a trained receptionist — quoting prices, reading your calendar, and booking directly into {{scheduler}}. It references your practice data (hours, insurances, pricing, procedures) and avoids missed opportunities.<br/><br/>
If we routed tonight's calls for {{company}}, how many would you want converted to appointments?<br/><br/>
— Ava · Three Sixty Vue<br/>
<small><a href="{{unsub}}">Unsubscribe</a></small>`
  },
  {
    dayOffset: 2,
    subject: "{{company}}'s missed calls last weekend",
    bodyHtml: `Quick one: most dental practices miss 20–40% of after-hours calls. We turn those into next-day bookings with insurance capture and reminders. Want a 10‑min demo with your own pricing and calendar? <br/><br/>
— Ava<br/>
<small><a href="{{unsub}}">Unsubscribe</a></small>`
  },
  {
    dayOffset: 5,
    subject: "Free pilot this week?",
    bodyHtml: `We can stand up a sandbox that reads {{company}}'s hours and availability, then simulate weekend calls. If it doesn't impress, you owe nothing.<br/><br/>
— Ava<br/>
<small><a href="{{unsub}}">Unsubscribe</a></small>`
  }
];