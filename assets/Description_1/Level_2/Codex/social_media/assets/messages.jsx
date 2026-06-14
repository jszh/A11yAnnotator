function MessagesPage() {
  const { conversations } = window.PulseData;
  const [activeConversationId, setActiveConversationId] = useState(conversations[0].id);
  const [liveMessage, setLiveMessage] = useState("2 unread messages.");
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  const [conversationState, setConversationState] = useState(conversations);
  const activeConversation = conversationState.find((conversation) => conversation.id === activeConversationId);

  const sendMessage = () => {
    if (!draft.trim()) return;
    setConversationState((current) =>
      current.map((conversation) =>
        conversation.id === activeConversationId
          ? {
              ...conversation,
              preview: draft,
              timestamp: "Now",
              unread: 0,
              messages: [...conversation.messages, { author: "Alex Rivera", mine: true, text: draft, time: "Now" }]
            }
          : conversation
      )
    );
    setLiveMessage(`Sent message to ${activeConversation.displayName}.`);
    setDraft("");
    window.requestAnimationFrame(() => {
      if (inputRef.current) inputRef.current.focus();
    });
  };

  return (
    <PageLayout currentPage="messages" liveMessage={liveMessage}>
      <section>
        <h1 className="text-4xl font-semibold text-slate-950">Messages</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">Direct conversations with creators, collaborators, and friends across Pulse.</p>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm" aria-labelledby="conversations-heading">
          <h2 id="conversations-heading" className="text-2xl font-semibold text-slate-950">Conversations</h2>
          <ul className="mt-5 space-y-3" aria-live="polite">
            {conversationState.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => setActiveConversationId(conversation.id)}
                  className={`focus-ring flex w-full items-center gap-3 rounded-[1.5rem] px-4 py-3 text-left ${activeConversationId === conversation.id ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-700"}`}
                  aria-label={`Open conversation with ${conversation.displayName}`}
                >
                  <img src={conversation.avatar} alt={`${conversation.displayName} avatar`} className="h-12 w-12 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold">{conversation.displayName}</span>
                      <span className="text-xs">{conversation.timestamp}</span>
                    </div>
                    <p className="truncate text-sm opacity-80">{conversation.preview}</p>
                  </div>
                  {conversation.unread > 0 && (
                    <span className="rounded-full bg-rose-500 px-2 py-1 text-xs font-semibold text-white">{conversation.unread}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm" aria-labelledby="chat-heading">
          <h2 id="chat-heading" className="text-2xl font-semibold text-slate-950">Chat with {activeConversation.displayName}</h2>
          <div className="mt-5 space-y-4">
            {activeConversation.messages.map((message, index) => (
              <div key={`${message.time}-${index}`} className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[32rem] rounded-[1.5rem] px-4 py-3 text-sm leading-6 ${message.mine ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-800"}`}>
                  <p>{message.text}</p>
                  <p className={`mt-2 text-xs ${message.mine ? "text-slate-300" : "text-slate-500"}`}>{message.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <label className="block text-sm font-medium text-slate-800">
              Message input
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows="3"
                className="focus-ring mt-2 w-full rounded-[1.5rem] border border-slate-300 px-4 py-3"
                aria-label={`Write a message to ${activeConversation.displayName}`}
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700" aria-label="Open emoji picker for message input">
                Emoji Picker
              </button>
              <button
                type="button"
                onClick={sendMessage}
                className="focus-ring rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white"
                aria-label={`Send message to ${activeConversation.displayName}`}
              >
                Send
              </button>
            </div>
          </div>
        </section>
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<MessagesPage />);
