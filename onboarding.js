(() => {
  "use strict";

  const STORAGE_KEY = "okinamap-onboarding-seen-v1";
  const splash = document.getElementById("splash");
  const modal = document.getElementById("onboardingModal");
  const track = document.getElementById("onboardingTrack");
  const dots = [...document.querySelectorAll(".onboarding-dot")];
  const backButton = document.getElementById("onboardingBack");
  const nextButton = document.getElementById("onboardingNext");
  const skipButton = document.getElementById("onboardingSkip");
  const replayButton = document.getElementById("onboardingReplay");
  const total = dots.length;
  let current = 0;
  let openedFromMenu = false;
  let touchStartX = 0;
  let touchStartY = 0;

  function hasSeenOnboarding() {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; }
    catch { return false; }
  }

  function rememberSeen() {
    try { localStorage.setItem(STORAGE_KEY, "1"); }
    catch { /* Storage may be disabled. The site still works. */ }
  }

  function showModal(fromMenu = false) {
    openedFromMenu = fromMenu;
    current = 0;
    updateSlide(false);
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("onboarding-open");
    skipButton.focus({ preventScroll: true });
  }

  function closeModal(markSeen = true) {
    if (markSeen) rememberSeen();
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("onboarding-open");
    if (openedFromMenu) replayButton?.focus({ preventScroll: true });
  }

  function updateSlide(animate = true) {
    track.classList.toggle("no-transition", !animate);
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === current);
      dot.setAttribute("aria-current", index === current ? "step" : "false");
    });
    backButton.hidden = current === 0;
    nextButton.textContent = current === total - 1 ? "はじめる" : "次へ";
    nextButton.classList.toggle("is-start", current === total - 1);
    requestAnimationFrame(() => track.classList.remove("no-transition"));
  }

  function goNext() {
    if (current === total - 1) closeModal(true);
    else { current += 1; updateSlide(true); }
  }

  function goBack() {
    if (current > 0) { current -= 1; updateSlide(true); }
  }

  function openAfterSplash() {
    if (!hasSeenOnboarding()) showModal(false);
  }

  nextButton.addEventListener("click", goNext);
  backButton.addEventListener("click", goBack);
  skipButton.addEventListener("click", () => closeModal(true));
  replayButton?.addEventListener("click", () => {
    const filterModal = document.getElementById("filterModal");
    if (filterModal) filterModal.hidden = true;
    showModal(true);
  });

  track.addEventListener("touchstart", event => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  track.addEventListener("touchend", event => {
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0 && current < total - 1) { current += 1; updateSlide(true); }
    if (dx > 0 && current > 0) { current -= 1; updateSlide(true); }
  }, { passive: true });

  modal.addEventListener("keydown", event => {
    if (event.key === "ArrowRight") goNext();
    if (event.key === "ArrowLeft") goBack();
    if (event.key === "Escape") closeModal(true);
  });

  // The splash animation in v2.2 lasts 1.25 seconds.
  if (splash) setTimeout(openAfterSplash, 1250);
  else openAfterSplash();
})();
