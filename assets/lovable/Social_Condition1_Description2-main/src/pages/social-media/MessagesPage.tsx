import { useState } from "react";
import { FoliaLayout } from "@/components/social-media/FoliaLayout";
import { Send, Image, FolderOpen, Check, CheckCheck } from "lucide-react";

const conversations = [
  {
    id: 1,
    name: "Leo Sato",
    avatar: "LS",
    lastMessage: "That color palette is exactly what I was going for!",
    time: "2m",
    unread: true,
    type: "dm" as const,
  },
  {
    id: 2,
    name: "Mural Project Collab",
    avatar: "MP",
    lastMessage: "Hana: I'll send the updated mockup tonight",
    time: "1h",
    unread: true,
    type: "collab" as const,
  },
  {
    id: 3,
    name: "Ada Moreau",
    avatar: "AM",
    lastMessage: "Would you be open to a commission?",
    time: "3h",
    unread: false,
    type: "dm" as const,
  },
  {
    id: 4,
    name: "Zine Collective",
    avatar: "ZC",
    lastMessage: "Felix: Deadline extended to next Friday",
    time: "1d",
    unread: false,
    type: "collab" as const,
  },
  {
    id: 5,
    name: "Yuki Tanaka",
    avatar: "YT",
    lastMessage: "Thanks for the feedback on Solstice!",
    time: "2d",
    unread: false,
    type: "dm" as const,
  },
];

const chatMessages = [
  { id: 1, sender: "them", text: "Hey! I loved your latest piece", time: "10:30 AM", read: true },
  { id: 2, sender: "me", text: "Thank you so much! I've been experimenting with new color palettes", time: "10:32 AM", read: true },
  { id: 3, sender: "them", text: "The warm tones really work beautifully together", time: "10:33 AM", read: true },
  { id: 4, sender: "them", text: "That color palette is exactly what I was going for!", time: "10:34 AM", read: true },
  { id: 5, sender: "me", text: "I used a reference from some desert photography — helps a lot with natural color harmony", time: "10:36 AM", read: false },
];

export default function MessagesPage() {
  const [selectedConvo, setSelectedConvo] = useState(conversations[0]);
  const [messageInput, setMessageInput] = useState("");
  const [showConvoList, setShowConvoList] = useState(true);

  return (
    <FoliaLayout>
      <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen">
        {/* Conversation List */}
        <aside
          className={`${showConvoList ? "flex" : "hidden"} md:flex flex-col w-full md:w-80 border-r border-border bg-card`}
          aria-label="Conversations"
        >
          <div className="p-4 border-b border-border">
            <h1 className="font-display text-2xl text-foreground">Messages</h1>
          </div>
          <nav className="flex-1 overflow-y-auto" aria-label="Message threads">
            {conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => {
                  setSelectedConvo(convo);
                  setShowConvoList(false);
                }}
                className={`w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                  selectedConvo.id === convo.id ? "bg-muted" : ""
                }`}
                aria-current={selectedConvo.id === convo.id ? "true" : undefined}
                aria-label={`Conversation with ${convo.name}${convo.unread ? ", unread" : ""}`}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0" aria-hidden="true">
                  {convo.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${convo.unread ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                      {convo.name}
                    </p>
                    <span className="text-xs text-muted-foreground">{convo.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {convo.type === "collab" && (
                      <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full shrink-0">
                        Collab
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground truncate">{convo.lastMessage}</p>
                  </div>
                </div>
                {convo.unread && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" aria-hidden="true" />}
              </button>
            ))}
          </nav>
        </aside>

        {/* Chat Panel */}
        <section
          className={`${!showConvoList ? "flex" : "hidden"} md:flex flex-col flex-1 min-w-0`}
          aria-label={`Chat with ${selectedConvo.name}`}
        >
          {/* Chat Header */}
          <header className="flex items-center gap-3 p-4 border-b border-border">
            <button
              onClick={() => setShowConvoList(true)}
              className="md:hidden text-sm text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              aria-label="Back to conversations"
            >
              ← Back
            </button>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary" aria-hidden="true">
              {selectedConvo.avatar}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{selectedConvo.name}</p>
              <p className="text-xs text-muted-foreground">Active now</p>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" role="log" aria-label="Message history">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.sender === "me"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <div className={`flex items-center gap-1 mt-1 ${msg.sender === "me" ? "justify-end" : ""}`}>
                    <span className={`text-[10px] ${msg.sender === "me" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {msg.time}
                    </span>
                    {msg.sender === "me" && (
                      msg.read
                        ? <CheckCheck className="h-3 w-3 text-primary-foreground/60" aria-label="Read" />
                        : <Check className="h-3 w-3 text-primary-foreground/60" aria-label="Sent" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-border">
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setMessageInput("");
              }}
            >
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors p-2 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                aria-label="Share an image"
              >
                <Image className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors p-2 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                aria-label="Share a project"
              >
                <FolderOpen className="h-5 w-5" aria-hidden="true" />
              </button>
              <label htmlFor="message-input" className="sr-only">Type a message</label>
              <input
                id="message-input"
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="bg-primary text-primary-foreground p-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </section>
      </div>
    </FoliaLayout>
  );
}
