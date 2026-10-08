# Pulse Simulations

Full-site view of one restaurant ordering flow across two devices on a single screen:

- **Left — mobile (375×812)**: the customer. Scans, logs in, browses the menu, places the order, asks for the bill.
- **Right — tablet (1280×800)**: the waiter. Reviews incoming orders, updates their status, and can place orders too.
- **Header**: the scenario stepper — current step, chevron dropdown with the full step list, an event-log dropdown, and Back / Next / Reset.

Both devices read from one in-memory store, so a customer action is reflected on the tablet in the same frame.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) | Single static page; no server needed for the sim |
| Language | TypeScript (strict) | Screen ids and events are typed unions — a missing screen is a build error |
| Styling | Tailwind CSS v4 | Figma frames translate to utility classes directly |
| State | Zustand + Immer | One store, one `dispatch(event)`, pure reducer |
| Rendering | Client-only store, static page | Deterministic replays, no hydration mismatch |

There is deliberately **no backend, no websocket, no database**. Both devices live in one browser tab, so a shared store is the whole sync layer. If real two-window sync is ever needed, swap the store's `set` for a `BroadcastChannel` — nothing else changes.

## Data flow

```
UI event  ──▶ dispatch(SimEvent) ──▶ reduce()          ──▶ domain state
                                      (src/sim/reducer.ts)
                                 └──▶ resolveNav()      ──▶ screens.mobile / screens.tablet
                                      (src/sim/triggers.ts)
```

`reducer.ts` only changes domain data (tables, orders, carts, signals).
`triggers.ts` only decides which screen each device shows. That split is the point: the "customer does X → tablet shows Y" wiring lives in one small, readable table.

## File map

```
src/sim/
  devices.ts    device pixel sizes + bezels (mobile 375×812, tablet 1280×800)
  screens.ts    screen id unions — the contract with Figma
  types.ts      domain model (Table, Order, CartLine, Signal, …)
  events.ts     SimEvent union — the full trigger vocabulary
  seed.ts       15 tables from the Pulse frame + a sample menu
  state.ts      SimState shape + initialState()
  reducer.ts    pure domain transitions (Immer)
  triggers.ts   ⬅ EDIT THIS: event → which screen each device shows
  scenario.ts   ⬅ EDIT THIS: the scripted demo steps
  store.ts      Zustand store, step runner, event log

src/components/stage/
  Stage.tsx         header + two-device layout
  DeviceFrame.tsx   renders at exact Figma size, scales to fit
  SignalLayer.tsx   in-device toast stack
  ScreenStub.tsx    placeholder for a not-yet-imported screen
  ScenarioBar.tsx   header stepper: scenario + log dropdowns, Back/Next/Reset
  useDismiss.ts     outside-click / Escape close for the dropdowns
  Chevron.tsx       dropdown caret

src/devices/mobile/  MobileDevice.tsx + screens/index.tsx (registry)
src/devices/tablet/  TabletDevice.tsx + screens/index.tsx (registry)
```

## Adding a Figma screen

1. Add its id to `MOBILE_SCREENS` / `TABLET_SCREENS` in `src/sim/screens.ts` (skip if already listed).
2. Pull the frame with the Figma MCP and build the component under `src/devices/<device>/screens/<Id>.tsx`.
   Author it at the exact frame size — `DeviceFrame` handles all scaling. No responsive CSS needed.
3. Register it in that device's `screens/index.tsx`, replacing the stub.
4. Wire the interaction: add the event to `src/sim/events.ts`, handle it in `reducer.ts`, and map its screen effect in `triggers.ts`.
5. Optionally add a `Step` to `scenario.ts` so it becomes clickable in the rail.

Steps 1 and 3 are the only ones the compiler forces — a registry missing an id fails the build.

## Screen ids in place

Mobile: **`login`** ✅ (Figma `3951:11269`) · **`menu`** ✅ (`2099:4387` bottom nav, `2099:5395` cart CTA) · **`cart`** ✅ (`2099:5710`) · **`order-placed`** ✅ (`2099:7980`) · **`bill`** ✅ (`2099:6002`) · **`payment-success`** ✅ · `item-detail`, `order-status` — stubs
Tablet: **`tables`** ✅ implemented (Figma `1802:11665`) · `table-detail`, `orders`, `order-detail`, `menu`, `settings` — stubs

Implemented screens live at `src/devices/<device>/screens/<Name>.tsx` and pull their exported images/icons from
`public/figma/<screen-slug>/` (downloaded once via the Figma MCP — remote asset URLs expire after ~7 days, so
committed code never references them directly). Both use the `figtree` font loader (`src/lib/fonts.ts`), scoped
via `className` rather than globally, since only these Figma-derived screens use Figtree.

`TablesScreen` reads live `tables` state from the store — it is not a static mock. Tapping a seated table dispatches
`waiter/select-table` and opens `OrderDetailDialog` (Figma `2098:2517`) — a 1240×760 popup over the floor plan, not a
registry screen, which is why `waiter/select-table`, `waiter/add-to-cart` and `waiter/submit-order` all keep the tablet
on `tables` in `triggers.ts`; routing elsewhere would unmount the dialog mid-action. The bottom tab bar dispatches
`sim/navigate` between the four tablet screen ids.
**Phases.** The header phase dropdown is live: `state.phase` (`src/sim/phases.ts`) selects which script in `SCENARIOS`
(`scenario.ts`) the stepper runs; Reset keeps the phase. Phase 2.0 covers the POS order flow.

**Table management (Phase 2.0, Figma `2861:12353`).** `TablesRoute` (tablet registry) renders `TablesScreenV2` when
`phase === "2.0"`. The floor is 25 sections (`src/sim/sections.ts`, 219 tables from `seedTablesV2()`; Main Dining keeps
`t01`-`t15`). The top-left pill names the section in view (scroll-spy) and opens `SectionsSidebar`, a blurred left
drawer with per-section vacant / allocate counts; picking a section eases the scroll there (`src/lib/smoothScroll.ts`,
ease-in-out). Sidebar and scroll state are local UI, not sim state.

**POS order (Phase 2.0, Figma `2820:17259`).** `pos-order` is a full-screen tablet registry screen
(`PosOrderScreen.tsx`). "Add Order" in `OrderDetailDialog` dispatches `waiter/open-pos`; the order bucket is the live
`waiter.cart`, and Confirm Order dispatches `waiter/submit-order`. The dialog's open state is `waiter.openTableId`
(not local state), so closing the POS (`waiter/close-pos`) or confirming returns to `tables` with the dialog still open.
Dish tiles/cards come from `MENU_CATALOG`, not the Figma's French menu copy.

`LoginScreen`'s Continue / skip-login both dispatch `customer/login` with placeholder guest data — replace with
the real trigger once specified. `MobileTabBar` (`src/devices/mobile/MobileTabBar.tsx`, Figma `2099:4590`) is the
HOME / VIEW AND PAY BILL bar shared by `menu` and `bill`; the Figma source file's orange primary is remapped to
home's maroon `#43263c` everywhere on mobile, including re-exported icon assets.

## Run

```bash
pnpm dev     # dev server
pnpm build   # production build
```
