/** Service charge and GST on top of the items, as the customer's phone shows them. */
export const SERVICE_RATE = 0.05;
export const GST_RATE = 0.09;

const cents = (n: number) => Math.round(n * 100) / 100;

/** What the table owes: items plus service charge and GST. The tablet's Total Bill and the phone's Grand Total. */
export const grandTotal = (items: number) => cents(items * (1 + SERVICE_RATE + GST_RATE));

/** Items, service and GST for a grand total, split so the three always add up to it exactly. */
export const breakdown = (grand: number) => {
  const items = cents(grand / (1 + SERVICE_RATE + GST_RATE));
  const service = cents(items * SERVICE_RATE);
  return { items, service, gst: cents(grand - items - service) };
};

/** The item total that rounds back to exactly `grand` (for seeding orders behind a known bill). */
export const itemsFor = (grand: number) => {
  let items = breakdown(grand).items;
  while (grandTotal(items) < grand) items = cents(items + 0.01);
  while (grandTotal(items) > grand) items = cents(items - 0.01);
  return items;
};

/** Optional platform fee on a payment, as the split-bill frames add it (SGD 0.19 on 6.00). */
export const PLATFORM_FEE_RATE = 0.0317;
export const platformFee = (amount: number) => cents(amount * PLATFORM_FEE_RATE);
