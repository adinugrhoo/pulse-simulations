/**
 * Time-based display (TBD) rules from the merchant dashboard: a dish is unavailable on
 * the picked weekdays, inside the time windows, optionally only within date ranges.
 * The POS greys the dish out and prints the rule ("Unavailable Mon–Thu, Sat, 02:10–22:00").
 */

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type ScheduleRule = {
  days: Weekday[];
  /** "HH:MM" 24h. A window whose end is before its start runs past midnight; equal ends mean all day. */
  times: { from: string; to: string }[];
  /** "YYYY-MM-DD", both ends inclusive. Unset means every date. */
  dates?: { from: string; to: string }[];
};

export const WEEKDAYS: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABEL: Record<Weekday, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Runs of 3+ days collapse to "Mon–Thu"; every day reads "Daily". */
export const formatDays = (days: Weekday[]) => {
  const on = WEEKDAYS.map((d) => days.includes(d));
  if (on.every(Boolean)) return "Daily";
  const parts: string[] = [];
  for (let i = 0; i < 7; i++) {
    if (!on[i]) continue;
    let j = i;
    while (j + 1 < 7 && on[j + 1]) j++;
    const run = WEEKDAYS.slice(i, j + 1).map((d) => DAY_LABEL[d]);
    parts.push(run.length >= 3 ? `${run[0]}–${run.at(-1)}` : run.join(", "));
    i = j;
  }
  return parts.join(", ");
};

const parseDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
};

/** "1–30 Nov", "28 Nov–3 Dec", "28 Dec 2026–3 Jan 2027". */
export const formatRange = ({ from, to }: { from: string; to: string }) => {
  const a = parseDate(from);
  const b = parseDate(to);
  if (a.y !== b.y) return `${a.d} ${MONTHS[a.m]} ${a.y}–${b.d} ${MONTHS[b.m]} ${b.y}`;
  if (a.m !== b.m) return `${a.d} ${MONTHS[a.m]}–${b.d} ${MONTHS[b.m]}`;
  return a.d === b.d ? `${a.d} ${MONTHS[a.m]}` : `${a.d}–${b.d} ${MONTHS[a.m]}`;
};

export const formatWindow = ({ from, to }: { from: string; to: string }) => (from === to ? "All day" : `${from}–${to}`);

/** The whole rule on one line, as the dashboard has it. Dates, when set, lead. */
export const formatUnavailable = (rule: ScheduleRule) => {
  const when = [formatDays(rule.days), ...rule.times.map(formatWindow)].join(", ");
  const dates = rule.dates?.length ? `${rule.dates.map(formatRange).join(", ")} · ` : "";
  return `Unavailable ${dates}${when}`;
};

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
/** Date's weekday; JS counts from Sunday. */
const weekdayOf = (d: Date) => WEEKDAYS[(d.getDay() + 6) % 7];

/** Whether the rule makes the dish unavailable at `now` (local time). */
export const isUnavailableAt = (rule: ScheduleRule, now: Date) => {
  const t = now.getHours() * 60 + now.getMinutes();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  // a window counts on the day it starts, so 22:00–02:00 on Sat still holds at 01:00 Sun
  const ruleDay = (d: Date) =>
    rule.days.includes(weekdayOf(d)) &&
    (!rule.dates?.length || rule.dates.some((r) => r.from <= isoOf(d) && isoOf(d) <= r.to));
  return rule.times.some(({ from, to }) => {
    const a = minutes(from);
    const b = minutes(to);
    if (a === b) return ruleDay(now);
    if (a < b) return ruleDay(now) && t >= a && t < b;
    return (ruleDay(now) && t >= a) || (ruleDay(yesterday) && t < b);
  });
};

const at = (day: Date, hhmm: string, offsetDays = 0) => {
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate() + offsetDays);
  d.setMinutes(minutes(hhmm));
  return d;
};

/** How far ahead to look: long enough for a date range that closes a dish for a season. */
const HORIZON_DAYS = 400;

/** Moments, in order, where the rule can change its answer: midnights and window edges. */
function* edges(rule: ScheduleRule, from: Date, key: "from" | "to") {
  for (let i = 0; i <= HORIZON_DAYS; i++) {
    const marks = [at(from, "00:00", i), ...rule.times.map((w) => at(from, w[key], i))].sort((a, b) => +a - +b);
    for (const m of marks) if (m > from) yield m;
  }
}

/** When a dish blocked at `now` can be ordered again; null if never inside the horizon. */
export const nextAvailableAt = (rule: ScheduleRule, now: Date): Date | null => {
  if (!isUnavailableAt(rule, now)) return now;
  for (const m of edges(rule, now, "to")) if (!isUnavailableAt(rule, m)) return m;
  return null;
};

/** Start of the next blocked stretch from `now` (now itself when already blocked). */
const nextBlockedAt = (rule: ScheduleRule, now: Date): Date | null => {
  if (isUnavailableAt(rule, now)) return now;
  for (const m of edges(rule, now, "from")) if (isUnavailableAt(rule, m)) return m;
  return null;
};

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "Available at 22:00", "Available tomorrow 02:10", "Available Fri 02:10", "Available 21 Dec". */
export const formatBack = (next: Date, now: Date) => {
  const days = Math.round((dayStart(next) - dayStart(now)) / 86_400_000);
  if (days === 0) return `Available at ${hhmm(next)}`;
  if (days === 1) return `Available tomorrow ${hhmm(next)}`;
  if (days < 7) return `Available ${DAY_LABEL[weekdayOf(next)]} ${hhmm(next)}`;
  const year = next.getFullYear() !== now.getFullYear() ? ` ${next.getFullYear()}` : "";
  return `Available ${next.getDate()} ${MONTHS[next.getMonth()]}${year}`;
};

/** What the POS shows for a scheduled dish. */
export type ScheduleState = {
  rule: ScheduleRule;
  /** Short card label, always one line: when it can be ordered again. */
  label: string;
  /** The rule in full, for the detail popover and screen readers. */
  full: string;
  next: Date | null;
};

/**
 * The dish's state at `now`, or undefined while it can be ordered. `force` shows the
 * blocked state anyway (demos), as of the next time the rule kicks in.
 */
export const scheduleState = (rule: ScheduleRule, now: Date, force = false): ScheduleState | undefined => {
  const blocked = force ? nextBlockedAt(rule, now) : isUnavailableAt(rule, now) ? now : null;
  if (!blocked) return undefined;
  const next = nextAvailableAt(rule, blocked);
  return { rule, label: next ? formatBack(next, now) : "Unavailable", full: formatUnavailable(rule), next };
};

/** Shape check for menu layers coming from outside the type system. */
export const isScheduleRule = (v: unknown): v is ScheduleRule => {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  const hhmm = (s: unknown) => typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
  const iso = (s: unknown) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const pairs = (list: unknown, ok: (s: unknown) => boolean) =>
    Array.isArray(list) &&
    list.every((p) => typeof p === "object" && p !== null && ok((p as Obj).from) && ok((p as Obj).to));
  return (
    Array.isArray(r.days) &&
    r.days.length > 0 &&
    r.days.every((d) => WEEKDAYS.includes(d as Weekday)) &&
    pairs(r.times, hhmm) &&
    (r.times as unknown[]).length > 0 &&
    (r.dates === undefined || pairs(r.dates, iso))
  );
};
type Obj = Record<string, unknown>;
