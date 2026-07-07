const CONTACT_ENDPOINT = "https://api.here-be-dragons.ai/contact";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

function initReveal() {
  const revealEls = Array.from(document.querySelectorAll(".reveal"));

  if (prefersReducedMotion) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const heroEl = document.querySelector('[data-reveal="hero"]');
  const observedEls = revealEls.filter((el) => el !== heroEl);

  // Hero copy animates in immediately on load.
  if (heroEl) {
    requestAnimationFrame(() => {
      heroEl.classList.add("is-visible");
    });
  }

  if (!("IntersectionObserver" in window)) {
    observedEls.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const index = Number(el.dataset.revealIndex || 0);
        const delay = el.dataset.reveal === "card" ? index * 80 : 0;
        setTimeout(() => {
          el.classList.add("is-visible");
        }, delay);
        obs.unobserve(el);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  observedEls.forEach((el) => observer.observe(el));
}

function initForm() {
  const form = document.querySelector(".contact-form");
  if (!form) return;

  const messages = {
    invalid: "Please enter a valid email address.",
    sending: "Sending…",
    success: "Thanks. You are on the list.",
    error: "Something went wrong. Please try again later.",
  };

  const statusEl = form.querySelector(".form-status");

  function setState(state, message) {
    form.dataset.state = state;
    statusEl.textContent = message;
  }

  function payloadFromForm() {
    const formData = new FormData(form);
    return {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
    };
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      setState("error", messages.invalid);
      form.reportValidity();
      return;
    }

    const button = form.querySelector("button");
    button.disabled = true;
    setState("idle", messages.sending);

    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFromForm()),
      });

      if (!response.ok) {
        throw new Error(`Contact request failed with ${response.status}`);
      }

      form.reset();
      setState("success", messages.success);
    } catch (error) {
      console.error(error);
      setState("error", messages.error);
    } finally {
      button.disabled = false;
    }
  });
}

function init() {
  initReveal();
  initForm();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
