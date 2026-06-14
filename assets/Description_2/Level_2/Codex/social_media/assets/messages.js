const { html, threads, announce, PageShell, RightRail } = window.Folia;

function MessagesPage() {
  const [activeId, setActiveId] = React.useState(threads[0].id);
  const [threadList, setThreadList] = React.useState(threads);
  const [draft, setDraft] = React.useState("");
  const inputRef = React.useRef(null);
  const activeThread = threadList.find((thread) => thread.id === activeId) || threadList[0];
  const unreadTotal = threadList.reduce((sum, thread) => sum + thread.unread, 0);

  useEffect(() => {
    announce(`${unreadTotal} unread messages in Folia inbox.`);
  }, [unreadTotal]);

  const rail = html`
    <${RightRail} title="Collaboration Shortcuts">
      <button type="button" className="focus-ring w-full rounded-[1.25rem] bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-white" onClick=${() => announce("Project share sheet opened.")}>
        Share a Project
      </button>
      <div className="rounded-[1.5rem] bg-white/90 p-4">
        <p className="text-sm leading-6 text-slate-600">Unread messages update the live region so screen reader users hear count changes as threads are opened.</p>
      </div>
    <//>
  `;

  return html`
    <${PageShell}
      currentPath="./messages.html"
      kicker="Creative inbox"
      title="Messages"
      description="Manage active collaborations and direct messages while keeping image sharing and critique notes in one thread."
      rightRail=${rail}
    >
      <section className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <section aria-label="Conversation list" className="glass-panel rounded-[2rem] border border-white/70 p-4 shadow-xl shadow-slate-200/60">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-slate-950">Conversations</h2>
            <span aria-live="polite" className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">${unreadTotal} unread</span>
          </div>
          <div className="mt-5 space-y-3">
            ${threadList.map((thread) => html`
              <button
                key=${thread.id}
                type="button"
                className=${`focus-ring block w-full rounded-[1.5rem] border px-4 py-4 text-left ${thread.id === activeId ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white/90 text-slate-700"}`}
                onClick=${() => {
                  setActiveId(thread.id);
                  setThreadList((items) => items.map((item) => (item.id === thread.id ? { ...item, unread: 0 } : item)));
                }}
                aria-label=${`Open conversation ${thread.name}, ${thread.unread} unread messages`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">${thread.name}</p>
                    <p className=${`mt-1 text-sm ${thread.id === activeId ? "text-slate-200" : "text-slate-500"}`}>${thread.participants}</p>
                    <p className=${`mt-2 text-sm ${thread.id === activeId ? "text-slate-200" : "text-slate-600"}`}>${thread.preview}</p>
                  </div>
                  ${thread.unread ? html`<span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">${thread.unread}</span>` : null}
                </div>
              </button>
            `)}
          </div>
        </section>

        <section aria-label="Chat panel" className="glass-panel chat-panel rounded-[2rem] border border-white/70 p-5 shadow-xl shadow-slate-200/60">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">${activeThread.name}</h2>
              <p className="mt-1 text-sm text-slate-600">${activeThread.participants}</p>
            </div>
            <button type="button" className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700" onClick=${() => announce("Project share shortcut opened.")}>
              Share a Project
            </button>
          </div>
          <div className="mt-6 space-y-4">
            ${activeThread.messages.map((message) => html`
              <article key=${message.id} className=${`max-w-xl rounded-[1.5rem] px-4 py-3 ${message.author === "You" ? "ml-auto bg-slate-900 text-white" : "bg-white/90 text-slate-700"}`}>
                <p className=${`text-xs font-semibold uppercase tracking-[0.2em] ${message.author === "You" ? "text-emerald-200" : "text-emerald-800"}`}>${message.author} · ${message.time}</p>
                ${message.image ? html`<img src=${message.image} alt=${message.alt} className="mt-3 rounded-[1.25rem] object-cover" />` : html`<p className="mt-2 text-sm leading-6">${message.text}</p>`}
              </article>
            `)}
          </div>
          <p className="mt-4 text-right text-sm text-slate-500">${activeThread.readReceipt}</p>
          <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit=${(event) => {
            event.preventDefault();
            if (!draft.trim()) return;
            setThreadList((items) => items.map((thread) => (
              thread.id === activeThread.id
                ? {
                    ...thread,
                    messages: [...thread.messages, { id: thread.messages.length + 1, author: "You", time: "Now", text: draft.trim() }],
                    preview: draft.trim(),
                  }
                : thread
            )));
            setDraft("");
            announce(`Message sent to ${activeThread.name}.`);
            window.setTimeout(() => {
              if (inputRef.current) inputRef.current.focus();
            }, 0);
          }}>
            <label className="sr-only" htmlFor="message-input">Message input</label>
            <input id="message-input" ref=${inputRef} value=${draft} onInput=${(event) => setDraft(event.target.value)} className="focus-ring flex-1 rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900" placeholder="Send feedback, share notes, or drop a project link..." />
            <button type="submit" className="focus-ring rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
              Send
            </button>
          </form>
        </section>
      </section>
    <//>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${MessagesPage} />`);
