import type { ReactNode } from "react";
import { DEFAULT_POS_TOKENS } from "@/config/global/theme";
import { scheduleState } from "@/menu/schedule";
import type { ActiveCall } from "@/engine/calls";
import type { Table, WaiterCall } from "@/engine/types";
import { BucketLine, DishRowCard, EmptyState, NoteDialog, OptionCard, SummaryCard } from "@/screens/tablet/pos/items";
import { PresentCard, TabletPresentCard } from "@/screens/tablet/sheets/SameDevicePayment";
import { CallsButton, CallsSidebar, CallTag } from "@/screens/tablet/tables/CallWaiters";

/**
 * Product changelog for the Pulse app (waiter tablet POS), the customer mobile and the
 * payment terminal: one entry per PR (or per commit before PRs), newest first. Changes to
 * the simulation itself (stage chrome, tools, scenarios) don't belong here.
 * Add an entry with every PR: what it touches (phase, theme, payment, QR), what changed,
 * and a before/after for any component whose design moved.
 */

export type ChangeKind = "added" | "changed" | "fixed" | "removed";

export type DesignChange = {
  component: string;
  /** Where it lives in the prototype. */
  where: string;
  note: string;
  /** Unset for brand-new components: the card shows "New" instead of a before. */
  before?: ReactNode;
  after: ReactNode;
  /** Design-system story to explore every state. */
  story?: string;
};

export type ChangelogEntry = {
  version: string;
  date: string;
  status: "released" | "unreleased";
  title: string;
  summary: string;
  /** PR number or branch; older entries point at the commit. */
  source: { label: string; value: string };
  /** What the entry touches; "—" when it doesn't. */
  scope: { phase: string; theme: string; payment: string; qr: string };
  changes: { kind: ChangeKind; area: string; text: string }[];
  design?: DesignChange[];
};

/* --------------------------- before / after previews --------------------------- */

const t = DEFAULT_POS_TOKENS;

const ConfirmButtons = ({ on, off }: { on: string; off: string }) => (
  <div className="flex w-[300px] flex-col gap-2">
    <div className={`flex h-[46px] items-center justify-center rounded-xl text-sm font-bold ${on}`}>Confirm Order</div>
    <div className={`flex h-[46px] items-center justify-center rounded-xl text-sm font-bold ${off}`}>Confirm Order</div>
  </div>
);

const Titles = ({ color, tab }: { color: string; tab: string }) => (
  <div className="flex items-end gap-10">
    <div className="flex flex-col items-center gap-3">
      <div className={`h-0.5 w-[120px] rounded-full ${tab}`} />
      <p className={`text-xl font-bold ${color}`}>Select Dish</p>
    </div>
    <p className={`pb-0 text-xl font-bold ${color}`}>Order Bucket</p>
  </div>
);

const LetterRow = () => (
  <div className="flex w-[280px] items-end justify-between gap-2 rounded-xl border border-[#222] bg-[#191919] p-2.5 text-[#fff8eb]">
    <div className="flex flex-col gap-1.5 leading-none">
      <p className="text-sm font-semibold">Smacked Cucumber Salad</p>
      <p className="text-xs">SGD 6.80</p>
    </div>
    <span className="flex size-[76px] items-center justify-center rounded-lg bg-[#2b2b2b] text-2xl font-bold text-[#f5dfa8]">S</span>
  </div>
);

const SCHEDULE = { days: ["mon", "tue", "wed", "thu", "sat"] as const, times: [{ from: "02:10", to: "22:00" }] };

const ScheduledRow = () => (
  <DishRowCard
    dish={{ id: "p-jellyfish", name: "Chilled Jellyfish with Sesame", price: 12.8 }}
    inBucket={0}
    onAdd={() => {}}
    unavailable={scheduleState({ ...SCHEDULE, days: [...SCHEDULE.days] }, new Date("2026-11-10T12:00"), true)}
  />
);

const SoldOutRow = () => (
  <DishRowCard
    dish={{ id: "d8", name: "Deep Fried Beancurd Skin Roll", price: 9.9, image: "/figma/mobile-menu/dish-3.png", soldOut: true }}
    inBucket={0}
    onAdd={() => {}}
  />
);

const NoteLine = () => (
  <ul className="w-[340px]">
    <BucketLine
      line={{ lineId: "c", itemId: "d1", name: "Steamed Mushroom and Truffle Dumpling", unitPrice: 12.4, qty: 2, notes: "No spring onion, Less spicy" }}
      open={false}
      onOpen={() => {}}
      onClose={() => {}}
      onTouch={() => {}}
      onNote={() => {}}
      onIncrement={() => {}}
      onDecrement={() => {}}
      onRemove={() => {}}
    />
  </ul>
);

const MaxSummary = () => (
  <div className="w-[340px]">
    <SummaryCard
      label="Chef’s Adds"
      status="none"
      limit={{ used: 3, max: 3 }}
      pills={[
        { key: "a", name: "Fried Egg", detail: "+SGD 2.50", qty: 2, onAdd: () => {}, onRemove: () => {} },
        { key: "b", name: "Chilli Oil", detail: "+SGD 1.00", qty: 1, onAdd: () => {}, onRemove: () => {} },
      ]}
    />
  </div>
);

const FullOption = () => (
  <div className="flex gap-2.5">
    <OptionCard option={{ id: "egg", name: "Fried Egg", price: 2.5 }} priceStyle="addon" compact selected count={2} groupFull onClick={() => {}} />
    <OptionCard option={{ id: "xo", name: "XO Sauce", price: 3 }} priceStyle="addon" compact selected={false} groupFull onClick={() => {}} />
  </div>
);

/** A floor card stand-in, just enough to seat a call tag on its top edge. */
const TagOnCard = ({ label, bg, call }: { label: string; bg: string; call: WaiterCall }) => (
  <div className={`relative flex h-[120px] w-[200px] items-end rounded-[20px] p-4 ${bg}`}>
    <p className="text-2xl leading-none font-bold text-white">{label}</p>
    <CallTag call={call} tableLabel={label} now={PREVIEW_NOW} onAccept={() => {}} onComplete={() => {}} />
  </div>
);

/** Drawer preview on a stopped clock, so the server and the browser render the same times. */
const PREVIEW_NOW = 1_000_000;
const previewTable = (id: string, label: string): Table => ({ id, label, section: "main-dining", status: "occupied" });
const PREVIEW_CALLS: ActiveCall[] = [
  { table: previewTable("t04", "Table 04"), call: { status: "accepted", at: PREVIEW_NOW - 185_000 } },
  { table: previewTable("t06", "Table 06"), call: { status: "calling", at: PREVIEW_NOW - 72_000 } },
  { table: previewTable("t08", "Table 08"), call: { status: "calling", at: PREVIEW_NOW - 9_000 } },
];

/* ------------------------------------ entries ----------------------------------- */

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "v0.8.0",
    date: "2026-11-26",
    status: "unreleased",
    title: "Call waiter",
    summary:
      "Guests can call for a waiter and the Pulse floor shows it: a Customers Calling count top right, a Calling tag on each table that called, and a drawer to accept the calls and mark them done. The customer's Call Waiter button on mobile comes next.",
    source: { label: "Branch", value: "new-feature/call-waiters" },
    scope: { phase: "Phase 2.0", theme: "Dark (Pulse), Light, Foodpanda", payment: "Same device", qr: "—" },
    changes: [
      { kind: "changed", area: "Payment", text: "Same-device Present card is laid out for the tablet instead of the terminal's narrow column, and turned 180° so the guest across the table reads it. Tap card here with arrows sits on the edge by the reader (top centre, under the printer dock); the card dips toward it and a soft glow beats twice each time it lands. It holds 30s before approving (the terminal keeps 3s)." },
      { kind: "added", area: "Floor", text: "A round hand button joins search and history top right. While guests wait it becomes Customers Calling with a red count and a waving hand; either opens the calls drawer." },
      { kind: "added", area: "Floor", text: "A table that called carries a white tag on its top edge: New calling (first 15s, bobbing, hand waving), then Calling (still), then Customer waiting.. past a minute (bobbing again). Tap to accept (green, check), tap again once the guest is helped; swipe it left or right to clear it at once." },
      { kind: "added", area: "Floor", text: "A guest who calls again reads Calling again: the tag turns red even if it was accepted, pops once, then bobs and waves. The drawer keeps its order and marks the row Calling again. Hotkey 3 rings the next calling table again, floor order, until the phone has its button." },
      { kind: "added", area: "Floor", text: "A guest who cancels their call: the tag shrinks away and a grey Call dismissed pill shows for 3s, the drawer row leaves and the count drops. Hotkey 4 cancels the next calling table, floor order." },
      { kind: "added", area: "Floor", text: "Sounds: a bell when a guest calls or calls again, a short chime when a call is done." },
      { kind: "added", area: "Floor", text: "Calls drawer from the right, same glass as the sections drawer: each calling table, how long since it called and its section, longest wait first. Accept turns a call green; Done with a check clears it, or swipe the row left or right." },
    ],
    design: [
      {
        component: "Present card (same device)",
        where: "Order detail: Pay, SmartPay",
        note: "Tablet layout: 112px amount, 40px Present card, a 300px card that dips 36px toward the reader, Tap card here on the reader edge with arrows and a glow bar. The page is turned 180° for the guest, so on the waiter's side it reads upside down with Tap card here at the top centre. The terminal keeps its own Present card.",
        before: (
          <div className="relative h-[200px] w-[320px] shrink-0 overflow-hidden rounded-lg">
            <div className="absolute top-0 left-0 h-[800px] w-[1280px] origin-top-left scale-25">
              <PresentCard amount={42.5} />
            </div>
          </div>
        ),
        after: (
          <div className="relative h-[200px] w-[320px] shrink-0 overflow-hidden rounded-lg">
            <div className="absolute top-0 left-0 h-[800px] w-[1280px] origin-top-left scale-25">
              <TabletPresentCard amount={42.5} />
            </div>
          </div>
        ),
      },
      {
        component: "Customer calls button",
        where: "Floor: top right, after search and history",
        note: "New. Idle: 54px round hand button (Figma 3224:5132). Calling: Customers Calling with a red count pill and a waving hand (Figma 3221:424).",
        after: (
          <div className="flex items-center gap-3">
            <CallsButton calling={0} onOpen={() => {}} />
            <CallsButton calling={3} onOpen={() => {}} />
          </div>
        ),
      },
      {
        component: "Call tag",
        where: "Floor: top edge of a table card",
        note: "New. Figma 3222:500, centred on the card's top edge, hand 30% bigger (14px). New calling for 15s and Customer waiting.. past a minute bob 7px and wave; Calling in between sits still. Accepted turns the floor's paid green with a check. Tap: accept, then done; swipe left or right: done.",
        after: (
          <div className="flex items-center gap-6 pt-4">
            <TagOnCard label="Table 08" bg="bg-[#917b0a]" call={{ status: "calling", at: PREVIEW_NOW - 5_000 }} />
            <TagOnCard label="Table 06" bg="bg-[#917b0a]" call={{ status: "calling", at: PREVIEW_NOW - 30_000 }} />
            <TagOnCard label="Table 12" bg="bg-[#917b0a]" call={{ status: "calling", at: PREVIEW_NOW - 90_000 }} />
            <TagOnCard
              label="Table 10"
              bg="bg-[#917b0a]"
              call={{ status: "calling", at: PREVIEW_NOW - 40_000, again: PREVIEW_NOW - 3_000 }}
            />
            <TagOnCard label="Table 04" bg="bg-[#917b0a]" call={{ status: "accepted", at: PREVIEW_NOW - 90_000 }} />
          </div>
        ),
      },
      {
        component: "Calls drawer",
        where: "Floor: Customers Calling",
        note: "New. 400px glass drawer from the right, the sections drawer mirrored; 40px wider so the time and section fit beside the 96px Accept / Done button.",
        after: (
          <div className="relative h-[400px] w-[640px] overflow-hidden rounded-xl bg-[#121415]">
            <CallsSidebar
              open
              now={PREVIEW_NOW}
              calls={PREVIEW_CALLS}
              onAccept={() => {}}
              onComplete={() => {}}
              onClose={() => {}}
            />
          </div>
        ),
      },
    ],
  },
  {
    version: "v0.7.0",
    date: "2026-11-12",
    status: "unreleased",
    title: "Empty dish list",
    summary:
      "Native ordering on the Pulse app no longer shows a blank page when the API or menu data lists no dishes: Select Dish shows an empty state with \u201cItem unavailable for now\u201d.",
    source: { label: "Branch", value: "add/empty-state" },
    scope: { phase: "Phase 2.0", theme: "Dark (Pulse), Light, Foodpanda", payment: "—", qr: "—" },
    changes: [
      { kind: "added", area: "POS", text: "No dishes from the API or menu data: the category grid and Pulse Dish Recommendation give way to an empty state, \u201cItem unavailable for now\u201d." },
      { kind: "added", area: "POS", text: "An open category or subcategory with no dishes shows the same empty state under the grid; the order bucket keeps its lines." },
      { kind: "changed", area: "POS", text: "An empty subcategory used to say \u201cNo dishes in \u2026 yet.\u201d; it now shows the empty state." },
    ],
    design: [
      {
        component: "Empty state, item list",
        where: "POS: Select Dish, category and subcategory lists",
        note: "New. Same pattern as the empty Order Bucket (glow, 42px gap, 14px copy), with the illustration and glow at 2\u00d7 for the wider Select Dish area.",
        after: (
          <div className={`h-[420px] w-[560px] overflow-hidden rounded-xl ${t.page}`}>
            <EmptyState kind="items" />
          </div>
        ),
        story: "empty-state",
      },
    ],
  },
  {
    version: "v0.6.0",
    date: "2026-11-10",
    status: "unreleased",
    title: "Native ordering states and Pulse colours",
    summary:
      "Native ordering on the Pulse app learns the states QA and product asked for: modifier maximums explained in place, time-based display (TBD), sold out, order notes for plain dishes and a no-image placeholder. Its main colours now match the Pulse theme on Table Detail.",
    source: { label: "Branch", value: "refactor/improve-navigation" },
    scope: { phase: "Phase 2.0", theme: "Dark (Pulse), Light, Foodpanda", payment: "—", qr: "—" },
    changes: [
      { kind: "added", area: "POS", text: "Add-on groups have a maximum: the summary card counts picks, says Max reached in place and shakes on a blocked add; unpicked option cards dim. No snackbar." },
      { kind: "added", area: "POS", text: "Time-based display (TBD): dishes a merchant schedule blocks grey out with when they're back (\"Available at 22:00\"); a tap opens the full schedule." },
      { kind: "added", area: "POS", text: "Sold out: dishes flagged in the menu show a Sold out chip and can't be added." },
      { kind: "added", area: "POS", text: "Order notes for dishes without a modifier page: Add note on the bucket line opens a centred note dialog." },
      { kind: "changed", area: "POS", text: "Dishes without a photo show the no-image placeholder instead of a lettered tile." },
      { kind: "fixed", area: "POS", text: "Main colours match the Pulse theme on Table Detail: Confirm Order, Save Modifier and Save note share Pay Bill's gold gradient and one disabled style; page titles are gold." },
    ],
    design: [
      {
        component: "Main action buttons",
        where: "POS: Confirm Order, Save Modifier, Save note",
        note: "Pale cream fill becomes Table Detail's Pay Bill gradient with a gold outline; enabled and disabled now match across every main action.",
        before: <ConfirmButtons on="bg-[#f5dfa8] text-[#1b1b1a]" off="bg-[#383736] text-[#676665]" />,
        after: <ConfirmButtons on={t.confirmOn} off={t.confirmOff} />,
        story: "action-button",
      },
      {
        component: "Page titles",
        where: "POS: Select Dish, Order Bucket, Modifier",
        note: "Cream titles turn Pulse gold, as Table Detail's Guest list.",
        before: <Titles color="text-[#fff8eb]" tab="bg-[#f5dfa8]" />,
        after: <Titles color="text-[#fcdfa2]" tab="bg-[#f5dfa8]" />,
      },
      {
        component: "Dish Row Card, no photo",
        where: "POS: category and search lists",
        note: "The lettered tile is replaced by the no-image placeholder.",
        before: <LetterRow />,
        after: (
          <DishRowCard dish={{ id: "p-cucumber", name: "Smacked Cucumber Salad", price: 6.8 }} inBucket={0} onAdd={() => {}} />
        ),
        story: "dish-row-card",
      },
      {
        component: "Scheduled dish (TBD)",
        where: "POS: category lists",
        note: "New. Greyed card with a one-line \"when it's back\" label and an info mark; the tap shows the full schedule.",
        after: <ScheduledRow />,
        story: "dish-row-card",
      },
      {
        component: "Sold out dish",
        where: "POS: category lists",
        note: "Now live. Sold out chip, greyed, not tappable.",
        after: <SoldOutRow />,
        story: "dish-row-card",
      },
      {
        component: "Order note dialog",
        where: "Native ordering: Order Bucket › Add note",
        note: "New. Centred over the POS page, 44px+ targets, Save only once something changed; Remove note when editing.",
        after: (
          <div className="relative h-[420px] w-[620px] overflow-hidden rounded-xl">
            <NoteDialog dishName="Steamed Mushroom and Truffle Dumpling" qty={2} initial="No spring onion" autoFocus={false} onSave={() => {}} onCancel={() => {}} />
          </div>
        ),
        story: "note-dialog",
      },
      {
        component: "Bucket line note",
        where: "POS: Order Bucket",
        note: "New. Add note on plain lines; a saved note is the edit target.",
        after: <NoteLine />,
        story: "bucket-line",
      },
      {
        component: "Modifier maximum",
        where: "POS: modifier sheet",
        note: "New. The summary card explains the limit; the option cards dim instead of failing silently.",
        after: (
          <div className="flex flex-col items-center gap-4">
            <MaxSummary />
            <FullOption />
          </div>
        ),
        story: "summary-card",
      },
    ],
  },
  {
    version: "v0.5.0",
    date: "2026-11-06",
    status: "released",
    title: "PayNow and GrabPay QR on terminal payment",
    summary: "The payment terminal can take wallet QR payments: PayNow and GrabPay sit next to card on the tablet's payment sheets.",
    source: { label: "Commit", value: "a65172d" },
    scope: { phase: "Phase 2.0", theme: "All", payment: "Terminal", qr: "—" },
    changes: [
      { kind: "added", area: "Terminal", text: "PayNow and GrabPay QR options on the terminal payment flow." },
      { kind: "changed", area: "POS", text: "Collect-payment and same-device sheets list the wallet options." },
    ],
  },
  {
    version: "v0.4.0",
    date: "2026-11-05",
    status: "released",
    title: "QR receipt printing and terminal QR payment",
    summary: "Printing a table QR plays a receipt overlay on the tablet, and the payment terminal runs its own QR payment screens.",
    source: { label: "Commit", value: "13866dc" },
    scope: { phase: "Phase 1.0, Phase 2.0", theme: "All", payment: "Terminal", qr: "Dynamic" },
    changes: [
      { kind: "added", area: "POS", text: "QR receipt print overlay with a generated QR code." },
      { kind: "added", area: "Terminal", text: "Terminal QR payment screens: processing, scan, done." },
    ],
  },
  {
    version: "v0.3.1",
    date: "2026-11-04",
    status: "released",
    title: "Dynamic QR flow and same-device payment",
    summary: "A second QR mode joins the static one, with its own QR panel, and the bill can be paid on the waiter's tablet.",
    source: { label: "Commit", value: "48da0e8" },
    scope: { phase: "Phase 1.0, Phase 2.0", theme: "All", payment: "Same device", qr: "Static, Dynamic" },
    changes: [
      { kind: "added", area: "QR", text: "Dynamic QR type: per-seating codes and a QR panel on Table Detail." },
      { kind: "added", area: "POS", text: "Same-device payment on the tablet with an approval screen." },
    ],
  },
  {
    version: "v0.2.0",
    date: "2026-10-08",
    status: "released",
    title: "Phase 2: POS order page, split bill, cash payment",
    summary: "The waiter's full-screen POS order page arrives (12 categories, 15 appetizers), along with the customer's split bill, cash payment and a payment ledger.",
    source: { label: "Commit", value: "229b9bc" },
    scope: { phase: "Phase 2.0", theme: "Default", payment: "Cash", qr: "Static" },
    changes: [
      { kind: "added", area: "POS", text: "POS order page with categories, modifiers, combos and the order bucket." },
      { kind: "added", area: "Mobile", text: "Split bill on the customer's phone." },
      { kind: "added", area: "POS", text: "Cash payment and the payment ledger on the tablet." },
    ],
  },
  {
    version: "v0.1.0",
    date: "2026-10-01",
    status: "released",
    title: "Customer ordering and the waiter floor",
    summary: "The customer orders from their phone after scanning the table QR; the waiter follows tables and orders on the tablet floor plan.",
    source: { label: "Commit", value: "ad6dd61" },
    scope: { phase: "Phase 1.0", theme: "Default", payment: "—", qr: "Static" },
    changes: [
      { kind: "added", area: "Mobile", text: "Login, menu, cart and order placed on the customer's phone." },
      { kind: "added", area: "POS", text: "Floor plan with table cards and the order detail on the waiter tablet." },
    ],
  },
];
