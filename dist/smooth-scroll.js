(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const touchDevice = window.matchMedia('(pointer: coarse)');
  if (reducedMotion.matches || touchDevice.matches) return;

  let targetY = window.scrollY;
  let frame = 0;

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    targetY = window.scrollY;
  }

  function animate() {
    const difference = targetY - window.scrollY;
    if (Math.abs(difference) < 0.7) {
      window.scrollTo(0, targetY);
      frame = 0;
      return;
    }
    window.scrollTo(0, window.scrollY + difference * 0.2);
    frame = requestAnimationFrame(animate);
  }

  window.addEventListener('wheel', event => {
    if (reducedMotion.matches || touchDevice.matches || event.ctrlKey || Math.abs(event.deltaX) > 2 || Math.abs(event.deltaY) < 40) return;
    event.preventDefault();
    const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? event.deltaY * 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? event.deltaY * window.innerHeight
        : event.deltaY;
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    targetY = Math.max(0, Math.min(maxY, (frame ? targetY : window.scrollY) + delta));
    if (!frame) frame = requestAnimationFrame(animate);
  }, { passive: false });

  window.addEventListener('keydown', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('pointerdown', stop, { passive: true });
  reducedMotion.addEventListener('change', event => { if (event.matches) stop(); });
})();