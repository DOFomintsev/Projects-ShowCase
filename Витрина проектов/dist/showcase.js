const scenes = [...document.querySelectorAll(".scene")];
const stories = [...document.querySelectorAll(".story")];
const tiles = [...document.querySelectorAll(".tile")];
const stage = document.querySelector("#stage");
const detail = document.querySelector("#project-detail");
const present = document.querySelector("#present");
const dialog = document.querySelector("#image-dialog");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let current = 0;

function selectSlide(index) {
  const next = (index + scenes.length) % scenes.length;
  if (next === current) return;
  current = next;
  scenes.forEach((scene, position) => {
    const selected = position === current;
    scene.hidden = !selected;
    scene.classList.toggle("active", selected);
    stories[position].hidden = !selected;
    tiles[position].classList.toggle("selected", selected);
    tiles[position].setAttribute("aria-pressed", String(selected));
  });
  document.querySelector("#current-index").textContent = String(current + 1).padStart(2, "0");
}

function step(delta) {
  selectSlide(current + delta);
}

tiles.forEach(tile => tile.addEventListener("click", () => {
  selectSlide(Number(tile.dataset.slide));
  stage.scrollIntoView({ block: "start" });
}));
document.querySelector("#prev").addEventListener("click", () => step(-1));
document.querySelector("#next").addEventListener("click", () => step(1));

function setPresenting(active) {
  document.body.classList.toggle("presenting", active);
  present.setAttribute("aria-pressed", String(active));
  document.querySelector("#present-label").textContent = active ? "Выйти из показа" : "Режим показа";
}
setPresenting(false);
present.addEventListener("click", async () => {
  if (document.body.classList.contains("presenting")) {
    setPresenting(false);
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    return;
  }
  setPresenting(true);
  window.scrollTo(0, 0);
  if (document.documentElement.requestFullscreen) {
    await document.documentElement.requestFullscreen().catch(() => {});
  }
});
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) setPresenting(false);
});
document.addEventListener("keydown", event => {
  if (dialog.open || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    step(event.key === "ArrowLeft" ? -1 : 1);
  }
  if (event.key === "Escape" && !document.fullscreenElement) setPresenting(false);
});

stage.addEventListener("pointermove", event => {
  if (event.pointerType !== "mouse" || reducedMotion.matches) return;
  const bounds = stage.getBoundingClientRect();
  stage.style.setProperty("--mx", `${(event.clientX - bounds.left - bounds.width / 2) / 54}px`);
  stage.style.setProperty("--my", `${(event.clientY - bounds.top - bounds.height / 2) / 56}px`);
});
stage.addEventListener("pointerleave", () => {
  stage.style.removeProperty("--mx");
  stage.style.removeProperty("--my");
});
let touchStart;
stage.addEventListener("pointerdown", event => {
  if (event.pointerType === "touch") touchStart = { x: event.clientX, y: event.clientY };
});
stage.addEventListener("pointercancel", () => { touchStart = undefined; });
stage.addEventListener("pointerup", event => {
  if (!touchStart || event.pointerType !== "touch") return;
  const dx = event.clientX - touchStart.x;
  const dy = event.clientY - touchStart.y;
  touchStart = undefined;
  if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
});

document.querySelectorAll(".details-link").forEach(link => link.addEventListener("click", () => {
  detail.focus({ preventScroll: true });
}));
document.querySelectorAll("[data-image]").forEach(button => button.addEventListener("click", () => {
  const image = document.querySelector("#expanded-image");
  image.src = button.dataset.image;
  image.alt = button.querySelector("img").alt;
  document.querySelector("#image-caption").textContent = button.dataset.caption;
  dialog.showModal();
}));
document.querySelector("#close-image").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});
