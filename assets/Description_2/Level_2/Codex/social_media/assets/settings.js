const { html, announce, PageShell, RightRail } = window.Folia;

function SettingsPage() {
  const [form, setForm] = React.useState({
    username: "mayalin",
    tools: "Procreate, Figma, Lightroom",
    visibility: "public",
    commissions: true,
    notifications: true,
  });
  const [errors, setErrors] = React.useState({});

  const rail = html`
    <${RightRail} title="Account Status">
      <div className="rounded-[1.5rem] bg-white/90 p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">Commission Status</p>
        <p className="mt-2 text-sm text-slate-600">${form.commissions ? "Open for Work badge visible" : "Open for Work badge hidden"}</p>
      </div>
    <//>
  `;

  const onSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.username.trim()) {
      nextErrors.username = "Username is required to save portfolio changes.";
    }
    if (!form.tools.trim()) {
      nextErrors.tools = "List at least one creative tool or skill.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      announce("Settings form has errors. Review the highlighted fields.", "assertive");
      return;
    }
    announce("Settings saved.");
  };

  return html`
    <${PageShell}
      currentPath="./settings.html"
      kicker="Account controls"
      title="Settings"
      description="Update your creator profile, tools, visibility, commissions, notifications, and account security."
      rightRail=${rail}
    >
      <form className="space-y-6" onSubmit=${onSubmit} noValidate>
        <section className="glass-panel rounded-[2rem] border border-white/70 p-5 shadow-xl shadow-slate-200/60">
          <h2 className="text-2xl font-semibold text-slate-950">Profile & Portfolio</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Username
              <input
                type="text"
                value=${form.username}
                onInput=${(event) => setForm({ ...form, username: event.target.value })}
                aria-invalid=${Boolean(errors.username)}
                aria-describedby=${errors.username ? "username-error" : undefined}
                className="focus-ring mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              />
              ${errors.username ? html`<span id="username-error" className="mt-2 block text-sm text-rose-700">${errors.username}</span>` : null}
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Bio
              <textarea className="focus-ring mt-2 min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">Visual artist focused on poster systems, tactile gradients, and image-led narratives.</textarea>
            </label>
          </div>
        </section>

        <section className="glass-panel rounded-[2rem] border border-white/70 p-5 shadow-xl shadow-slate-200/60">
          <h2 className="text-2xl font-semibold text-slate-950">Creative Tools</h2>
          <label className="mt-5 block text-sm font-medium text-slate-700">
            Listed skills and software
            <input
              type="text"
              value=${form.tools}
              onInput=${(event) => setForm({ ...form, tools: event.target.value })}
              aria-invalid=${Boolean(errors.tools)}
              aria-describedby=${errors.tools ? "tools-error" : undefined}
              className="focus-ring mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            />
            ${errors.tools ? html`<span id="tools-error" className="mt-2 block text-sm text-rose-700">${errors.tools}</span>` : null}
          </label>
        </section>

        <section className="glass-panel rounded-[2rem] border border-white/70 p-5 shadow-xl shadow-slate-200/60">
          <h2 className="text-2xl font-semibold text-slate-950">Visibility</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            ${["public", "private"].map((value) => html`
              <button
                key=${value}
                type="button"
                className=${`focus-ring rounded-full px-4 py-2 text-sm font-medium ${form.visibility === value ? "bg-slate-900 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
                aria-pressed=${form.visibility === value}
                onClick=${() => setForm({ ...form, visibility: value })}
              >
                ${value === "public" ? "Public portfolio" : "Private portfolio"}
              </button>
            `)}
          </div>
        </section>

        <section className="glass-panel rounded-[2rem] border border-white/70 p-5 shadow-xl shadow-slate-200/60">
          <h2 className="text-2xl font-semibold text-slate-950">Commission Status</h2>
          <button type="button" className="focus-ring mt-5 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300" aria-pressed=${form.commissions} onClick=${() => setForm({ ...form, commissions: !form.commissions })}>
            ${form.commissions ? "Open for Work" : "Closed to commissions"}
          </button>
        </section>

        <section className="glass-panel rounded-[2rem] border border-white/70 p-5 shadow-xl shadow-slate-200/60">
          <h2 className="text-2xl font-semibold text-slate-950">Notifications</h2>
          <button type="button" className="focus-ring mt-5 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300" aria-pressed=${form.notifications} onClick=${() => setForm({ ...form, notifications: !form.notifications })}>
            ${form.notifications ? "Notifications on" : "Notifications off"}
          </button>
        </section>

        <section className="glass-panel rounded-[2rem] border border-white/70 p-5 shadow-xl shadow-slate-200/60">
          <h2 className="text-2xl font-semibold text-slate-950">Account Security</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              New password
              <input type="password" className="focus-ring mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Two-factor authentication
              <select className="focus-ring mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                <option>Authenticator app</option>
                <option>SMS backup</option>
              </select>
            </label>
          </div>
        </section>

        <button type="submit" className="focus-ring rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white">
          Save settings
        </button>
      </form>
    <//>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${SettingsPage} />`);
