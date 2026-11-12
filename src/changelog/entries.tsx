import type { ReactNode } from "react";
import { DEFAULT_POS_TOKENS } from "@/config/global/theme";
import { scheduleState } from "@/menu/schedule";
import { BucketLine, DishRowCard, EmptyState, NoteDialog, OptionCard, SummaryCard } from "@/screens/tablet/pos/items";

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

/* ------------------------------------ entries ----------------------------------- */

export const CHANGELOG: ChangelogEntry[] = [
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
