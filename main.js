const form = document.querySelector(".contact-form");

const messages = {
  invalid: "Please enter a valid email address.",
  sending: "Sending...",
  success: "Thanks. You are on the list.",
  unconfigured: "The form is ready, but Airtable is not connected yet.",
  error: "Something went wrong. Please try again later.",
};

function setState(state, message) {
  form.dataset.state = state;
  form.querySelector(".form-status").textContent = message;
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
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadFromForm()),
    });

    if (response.status === 501) {
      setState("error", messages.unconfigured);
      return;
    }

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
