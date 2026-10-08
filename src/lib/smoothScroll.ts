const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const running = new WeakMap<HTMLElement, number>();

/** Stop a scroll animation started by `smoothScrollTo` (e.g. when the user grabs the wheel). */
export const cancelSmoothScroll = (el: HTMLElement) => {
  const id = running.get(el);
  if (id !== undefined) cancelAnimationFrame(id);
  running.delete(el);
};

/**
 * Scroll `el` to `top` with an ease-in-out curve. Native `behavior: "smooth"` has a fixed,
 * browser-chosen curve; this one accelerates out and decelerates in, and the duration scales
 * with distance so a hop to the next section and a jump across the floor both feel right.
 */
export const smoothScrollTo = (el: HTMLElement, top: number, onDone?: () => void) => {
  cancelSmoothScroll(el);
  const from = el.scrollTop;
  const to = Math.max(0, Math.min(top, el.scrollHeight - el.clientHeight));
  const distance = Math.abs(to - from);
  if (distance < 1) {
    onDone?.();
    return;
  }
  const duration = Math.min(1100, Math.max(450, 320 + distance * 0.45));
  const start = performance.now();

  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    el.scrollTop = from + (to - from) * easeInOutCubic(t);
    if (t < 1) running.set(el, requestAnimationFrame(step));
    else {
      running.delete(el);
      onDone?.();
    }
  };
  running.set(el, requestAnimationFrame(step));
};
