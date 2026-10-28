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
                                      (src/engine/reducer.ts)
                                 └──▶ resolveNav()      ──▶ screens.mobile / screens.tablet
                                      (src/engine/triggers.ts)
```

`reducer.ts` only changes domain data (tables, orders, carts, signals).
`triggers.ts` only decides which screen each device shows. That split is the point: the "customer does X → tablet shows Y" wiring lives in one small, readable table.

## Configuration layers

Everything you tweak lives under `src/config/`, in three levels that stack:

```
src/config/
  global/                     applies to every phase and theme
    index.ts                  GLOBAL_CONFIG (app name, currency, default phase), re-exports
    menu.json                 base menu: every dish + mobile and tablet category lists
    theme.ts                  default mobile + POS tokens themes start from
    devices.ts                device pixel sizes + bezels (mobile 375×812, tablet 1280×800)
    floor.ts, sections.ts     the 15-table Pulse floor, the 25 Phase 2.0 sections
    modifiers.ts              combo / modifier sheets for the POS
  phases/
    index.ts                  PHASES registry, getPhase(), getTheme()
    screens.ts                phase id → screen registry (kept apart: the engine never imports UI)
    phase-1/                  one folder per phase
      index.ts                PhaseConfig: label, chip, features, seedTables, scenario, themes
      scenario.ts             the scripted steps the header stepper runs
      menu.json               menu patch for this phase
      screens.ts              full mobile + tablet registry for this phase, plus theme swaps
      themes/
        default/              one folder per theme
          index.ts            ThemeConfig: label, chip, description
          menu.json           menu patch for this theme
          mobile/tokens.ts    mobile tokens (set as CSS vars, e.g. --mobile-primary)
          mobile/screens.ts   mobile screens this theme swaps for its own
          tablet/tokens.ts    tablet tokens (the POS page classes)
          tablet/screens.ts   tablet screens this theme swaps for its own
    phase-2/                  same shape; themes dark, light, foodpanda
  types.ts                    PhaseConfig / ThemeConfig / registry contracts
```

Rules of thumb:

- **Screens read features and tokens, never phase ids.** `usePhaseConfig().features` (`floor`, `splitBill`) and
  `useTokens("mobile" | "tablet")` (`src/theme/hooks.ts`) are the only ways a screen learns which phase or theme it is in.
- **The menu stacks global → phase → theme.** A phase or theme `menu.json` is a patch: `dishes` (field overrides by id),
  `added` (new dishes), `removed` (hidden ids) and `categories.mobile` / `categories.tablet` (replace the whole list for
  that device). An empty `{}` inherits everything. A tablet category may carry `subcategories` (`id`, `name`, `color`,
  `dishIds`, each a subset of the category's dishes); on the POS it then opens its own page with subcategory tiles
  (Figma 3124:186) instead of expanding inline. Phase 2.0's `menu.json` uses this for Drinks (Hot / Ice) and Desserts
  (Warm / Chilled); the Menu Studio does not edit subcategories yet, so change them in the JSON. `useMenu()` (`src/menu/hooks.ts`) returns the resolved menu for the
  phase + theme on screen; `getActiveMenu(phase)` does the same outside React (engine seeds, scenario steps).
- **Registries stack the same way.** `screens/<device>/registry.tsx` is the default; a phase's `screens.ts` overrides
  entries (Phase 2.0 swaps `tables` for `TablesScreenV2`); a theme's `mobile/screens.ts` / `tablet/screens.ts` can swap more.
- The header remembers the selected phase and each phase's theme for the browser session (`src/theme/store.ts`).

### Adding a theme

1. Copy a theme folder, e.g. `phases/phase-2/themes/light` to `themes/<new-id>`, and change `id`, `label`, `chip` in its `index.ts`.
2. Adjust `mobile/tokens.ts` and `tablet/tokens.ts`. The token shapes live in `src/theme/tokens.ts`; adding a key there makes
   the compiler list every theme that still needs it.
3. List the theme in the phase's `index.ts` (`themes: [...]`) and in the phase's `screens.ts` (`themes: { ... }`).

### Adding a phase

1. Copy a phase folder to `phases/phase-<n>/`, set `id`, `folder`, `label`, `features`, `scenario` and `themes`.
2. Add it to `PHASES` in `phases/index.ts` and to `PHASE_SCREENS` in `phases/screens.ts`.

## Menu Studio

The header's **Menu Studio** button opens an editor for dish photos, names, prices, descriptions, tags and categories at
any layer: Global, a phase, or a theme inside a phase.

- Edits show on the devices immediately and are kept as drafts in `localStorage`, so a reload never loses them.
- On `pnpm dev`, **Save** writes the layer's `menu.json` (route `src/app/api/studio/menu`), uploads go to `public/uploads`
  (`api/studio/upload`, PNG/JPG/WebP/GIF up to 5 MB), and the gallery lists `public/figma` + `public/uploads`
  (`api/studio/assets`). Writes only accept same-origin requests, validated layers (`src/menu/validate.ts`) and
  images whose file header matches their type. Saving reloads the page through the dev server; the selected phase and
  theme come back. A draft whose file changed on disk since it started is flagged before you overwrite it.
- On a deployed build those routes answer 404, so drafts stay in the browser (uploads become downscaled data URLs) and
  **Export JSON** downloads a layer for committing.
- On a phase or theme, a changed field shows *set here* with a *reset* link; *Hide here* hides an inherited dish from that
  layer down. Category edits copy the inherited list into the layer the first time (*Use inherited list* undoes it).

Logic lives in `src/menu/edits.ts` (one function per operation), shape checks in `src/menu/validate.ts`, UI in
`src/stage/studio/`.

## File map

```
src/app/                 Next.js routes only: the page + dev-only studio API
src/config/              everything configurable (see above)
src/engine/              the simulation core
  screens.ts             screen id unions, the contract with Figma
  types.ts               domain model (Table, Order, CartLine, Signal, …)
  events.ts              SimEvent union, the full trigger vocabulary
  state.ts               SimState shape + initialState(phase)
  reducer.ts             pure domain transitions (Immer)
  triggers.ts            ⬅ EDIT THIS: event → which screen each device shows
  scenario.ts            Step type + withDish() helper (scripts live in each phase folder)
  seed.ts                floor and order seeding
  store.ts               Zustand store, step runner, event log
  bill.ts                service charge / GST maths
src/menu/                menu model, layer resolver, editable store, edits, DishImage
src/theme/               selected theme store, hooks (usePhaseConfig, useTokens), token types
src/screens/
  mobile/<feature>/      login, menu, cart, order, bill, payment, shared (tab bar)
  mobile/registry.tsx    default mobile screen registry
  tablet/<feature>/      tables, order-detail, pos, sheets, shared (tab bar)
  tablet/registry.tsx    default tablet screen registry
src/stage/
  Stage.tsx              header + two-device layout
  header/                phase, theme and scenario controls, Popover, useDismiss
  device/                DeviceFrame (exact Figma size, scaled to fit), Mobile/TabletDevice, SignalLayer, ScreenStub
  studio/                Menu Studio window
src/lib/                 cn, fonts, smoothScroll
```

## Adding a Figma screen

1. Add its id to `MOBILE_SCREENS` / `TABLET_SCREENS` in `src/engine/screens.ts` (skip if already listed).
2. Pull the frame with the Figma MCP and build the component under `src/screens/<device>/<feature>/<Id>.tsx`.
   Author it at the exact frame size; `DeviceFrame` handles all scaling. No responsive CSS needed.
3. Register it in `src/screens/<device>/registry.tsx`, replacing the stub (or only in one phase's `screens.ts`, or one
   theme's `mobile|tablet/screens.ts`, if it is specific to that phase or theme).
4. Wire the interaction: add the event to `src/engine/events.ts`, handle it in `reducer.ts`, and map its screen effect in `triggers.ts`.
5. Optionally add a `Step` to the phase's `scenario.ts` so it becomes clickable in the header.

Steps 1 and 3 are the only ones the compiler forces; a registry missing an id fails the build.

## Screen ids in place

Mobile: **`login`** ✅ (Figma `3951:11269`) · **`menu`** ✅ (`2099:4387` bottom nav, `2099:5395` cart CTA) · **`cart`** ✅ (`2099:5710`) · **`order-placed`** ✅ (`2099:7980`) · **`bill`** ✅ (`2099:6002`) · **`payment-success`** ✅ · `item-detail`, `order-status` — stubs
Tablet: **`tables`** ✅ implemented (Figma `1802:11665`) · `table-detail`, `orders`, `order-detail`, `menu`, `settings` — stubs

Implemented screens live at `src/screens/<device>/<feature>/<Name>.tsx` and pull their exported images/icons from
`public/figma/<screen-slug>/` (downloaded once via the Figma MCP — remote asset URLs expire after ~7 days, so
committed code never references them directly). Both use the `figtree` font loader (`src/lib/fonts.ts`), scoped
via `className` rather than globally, since only these Figma-derived screens use Figtree.

`TablesScreen` reads live `tables` state from the store — it is not a static mock. Tapping a seated table dispatches
`waiter/select-table` and opens `OrderDetailDialog` (Figma `2098:2517`) — a 1240×760 popup over the floor plan, not a
registry screen, which is why `waiter/select-table`, `waiter/add-to-cart` and `waiter/submit-order` all keep the tablet
on `tables` in `triggers.ts`; routing elsewhere would unmount the dialog mid-action. The bottom tab bar dispatches
`sim/navigate` between the four tablet screen ids.
**Phases.** The header phase dropdown is live: `state.phase` picks a `PhaseConfig` (`src/config/phases/`), whose
`scenario` the stepper runs; Reset keeps the phase. Phase 2.0 covers the POS order flow.

**Table management (Phase 2.0, Figma `2861:12353`).** Phase 2.0's `screens.ts` registers `TablesScreenV2` as `tables`. The floor is 25 sections (`src/config/global/sections.ts`, 219 tables from `seedTablesV2()`; Main Dining keeps
`t01`-`t15`). The top-left pill names the section in view (scroll-spy) and opens `SectionsSidebar`, a blurred left
drawer with per-section vacant / allocate counts; picking a section eases the scroll there (`src/lib/smoothScroll.ts`,
ease-in-out). Sidebar and scroll state are local UI, not sim state.

**POS order (Phase 2.0, Figma `2820:17259`).** `pos-order` is a full-screen tablet registry screen
(`PosOrderScreen.tsx`). "Add Order" in `OrderDetailDialog` dispatches `waiter/open-pos`; the order bucket is the live
`waiter.cart`, and Confirm Order dispatches `waiter/submit-order`. The dialog's open state is `waiter.openTableId`
(not local state), so closing the POS (`waiter/close-pos`) or confirming returns to `tables` with the dialog still open.
Dish tiles, categories and cards come from `useMenu()` (tablet categories), not the Figma's French menu copy. Its look
comes from the active theme's `tablet/tokens.ts`.

`LoginScreen`'s Continue / skip-login both dispatch `customer/login` with placeholder guest data — replace with
the real trigger once specified. `MobileTabBar` (`src/screens/mobile/shared/MobileTabBar.tsx`, Figma `2099:4590`) is the
HOME / VIEW AND PAY BILL bar shared by `menu` and `bill`; the Figma source file's orange primary is remapped to
home's maroon `#43263c` everywhere on mobile, including re-exported icon assets. Screens read it as
`var(--mobile-primary)`, set from the theme's `mobile/tokens.ts`.

## Run

```bash
pnpm dev     # dev server
pnpm build   # production build
```
