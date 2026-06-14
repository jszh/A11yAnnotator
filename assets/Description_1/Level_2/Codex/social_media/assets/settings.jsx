function SettingsPage() {
  const [liveMessage, setLiveMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [theme, setTheme] = useState("light");

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextErrors = {};

    if (!formData.get("username")?.trim()) nextErrors.username = "Enter a username.";
    if (!formData.get("email")?.trim()) nextErrors.email = "Enter an email address.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setLiveMessage("Settings form errors are shown.");
      return;
    }
    setLiveMessage("Settings saved.");
  };

  return (
    <PageLayout currentPage="settings" liveMessage={liveMessage}>
      <section>
        <h1 className="text-4xl font-semibold text-slate-950">Settings</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">Manage account details, privacy, notifications, appearance, and account safety controls.</p>
      </section>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
        <section className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">Account</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-800">
              Username *
              <input
                name="username"
                defaultValue="alexr"
                className="focus-ring mt-2 w-full rounded-[1.5rem] border border-slate-300 px-4 py-3"
                aria-required="true"
                aria-invalid={Boolean(errors.username)}
                aria-describedby={errors.username ? "settings-username-error" : undefined}
              />
              {errors.username && <span id="settings-username-error" className="mt-2 block text-sm text-rose-700">{errors.username}</span>}
            </label>
            <label className="text-sm font-medium text-slate-800">
              Email *
              <input
                name="email"
                defaultValue="alex@pulse.app"
                className="focus-ring mt-2 w-full rounded-[1.5rem] border border-slate-300 px-4 py-3"
                aria-required="true"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "settings-email-error" : undefined}
              />
              {errors.email && <span id="settings-email-error" className="mt-2 block text-sm text-rose-700">{errors.email}</span>}
            </label>
            <label className="text-sm font-medium text-slate-800">
              Password
              <input name="password" type="password" className="focus-ring mt-2 w-full rounded-[1.5rem] border border-slate-300 px-4 py-3" />
            </label>
          </div>
        </section>

        <section className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">Privacy</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-800">
              Who can see posts
              <select className="focus-ring mt-2 w-full rounded-[1.5rem] border border-slate-300 px-4 py-3">
                <option>Everyone</option>
                <option>Followers only</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-800">
              Direct messages
              <select className="focus-ring mt-2 w-full rounded-[1.5rem] border border-slate-300 px-4 py-3">
                <option>Everyone</option>
                <option>People you follow</option>
              </select>
            </label>
          </div>
        </section>

        <section className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">Notifications</h2>
          <div className="mt-5 flex flex-wrap gap-5">
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input type="checkbox" defaultChecked />
              <span>Email notifications</span>
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input type="checkbox" defaultChecked />
              <span>Push notifications</span>
            </label>
          </div>
        </section>

        <section className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">Appearance</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setTheme("light");
                setLiveMessage("Light mode selected.");
              }}
              aria-pressed={theme === "light"}
              className={`focus-ring rounded-full px-4 py-2 text-sm font-medium ${theme === "light" ? "bg-slate-950 text-white" : "border border-slate-300 text-slate-700"}`}
              aria-label="Use light mode"
            >
              Light Mode
            </button>
            <button
              type="button"
              onClick={() => {
                setTheme("dark");
                setLiveMessage("Dark mode selected.");
              }}
              aria-pressed={theme === "dark"}
              className={`focus-ring rounded-full px-4 py-2 text-sm font-medium ${theme === "dark" ? "bg-slate-950 text-white" : "border border-slate-300 text-slate-700"}`}
              aria-label="Use dark mode"
            >
              Dark Mode
            </button>
          </div>
        </section>

        <section className="panel rounded-[2rem] border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-rose-950">Danger Zone</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" className="focus-ring rounded-full border border-rose-300 px-4 py-2 text-sm font-medium text-rose-800" aria-label="Deactivate Pulse account">
              Deactivate Account
            </button>
            <button type="button" className="focus-ring rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white" aria-label="Delete Pulse account">
              Delete Account
            </button>
          </div>
        </section>

        <button type="submit" className="focus-ring rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" aria-label="Save Pulse settings">
          Save Settings
        </button>
      </form>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<SettingsPage />);
