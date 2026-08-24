import { site } from "../data/site";

export function wireForm(formId: string, subject: string) {
  const form = document.getElementById(formId) as HTMLFormElement | null;
  if (!form) return;

  const statusEl = form.querySelector<HTMLElement>("[data-form-status]");
  const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // honeypot: bots fill hidden field, humans never see it
    const honeypot = form.querySelector<HTMLInputElement>('input[name="_honeypot"]');
    if (honeypot && honeypot.value) return;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Wird gesendet …";
    }
    if (statusEl) {
      statusEl.textContent = "";
      statusEl.className = "";
    }

    const data = new FormData(form);
    data.set("_subject", subject);
    data.set("_template", "table");
    data.set("_captcha", "false");

    try {
      const res = await fetch("/api/anfrage", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || "Request failed");

      form.reset();
      form.classList.add("hidden");
      if (statusEl) {
        statusEl.textContent =
          "Vielen Dank! Ihre Anfrage wurde übermittelt. Wir melden uns in Kürze bei Ihnen.";
        statusEl.className = "rounded-lg bg-brass-soft px-4 py-3 text-sm text-ink";
        statusEl.classList.remove("hidden");
      }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent =
          err instanceof Error && err.message !== "Request failed"
            ? err.message
            : `Leider ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder schreiben Sie uns direkt an ${site.email}.`;
        statusEl.className = "rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800";
        statusEl.classList.remove("hidden");
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Anfrage senden";
      }
    }
  });
}
