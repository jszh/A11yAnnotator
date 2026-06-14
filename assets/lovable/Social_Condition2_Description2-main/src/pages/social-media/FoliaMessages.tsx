import { useState, useRef, useEffect } from "react";
import FoliaLayout from "@/components/social-media/FoliaLayout";
import { Send, Image, FolderOpen, Check, CheckCheck } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "me" | "other";
  time: string;
  read: boolean;
  image?: string;
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isProject: boolean;
  messages: Message[];
}

const conversations: Conversation[] = [
  {
    id: "1",
    name: "Maya Chen",
    avatar: "M",
    lastMessage: "Love the color choices! Can we try a warmer palette?",
    time: "2m",
    unread: 2,
    isProject: true,
    messages: [
      { id: "m1", text: "Hey! I saw your latest piece — the lighting is incredible.", sender: "other", time: "10:30 AM", read: true },
      { id: "m2", text: "Thank you so much! I spent a lot of time on the rim lighting.", sender: "me", time: "10:32 AM", read: true },
      { id: "m3", text: "Would you be interested in collaborating on my gallery project?", sender: "other", time: "10:35 AM", read: true },
      { id: "m4", text: "Absolutely! I'd love to. What's the concept?", sender: "me", time: "10:36 AM", read: true },
      { id: "m5", text: "Love the color choices! Can we try a warmer palette?", sender: "other", time: "10:40 AM", read: false },
    ],
  },
  {
    id: "2",
    name: "Hana Kim",
    avatar: "H",
    lastMessage: "The prints arrived! They look amazing 📸",
    time: "1h",
    unread: 0,
    isProject: false,
    messages: [
      { id: "m6", text: "How's the film photography series going?", sender: "me", time: "9:00 AM", read: true },
      { id: "m7", text: "The prints arrived! They look amazing 📸", sender: "other", time: "9:15 AM", read: true },
    ],
  },
  {
    id: "3",
    name: "Typography Collective",
    avatar: "T",
    lastMessage: "Next meetup is Thursday — bringing my new specimens",
    time: "3h",
    unread: 0,
    isProject: true,
    messages: [
      { id: "m8", text: "Next meetup is Thursday — bringing my new specimens", sender: "other", time: "Yesterday", read: true },
    ],
  },
];

export default function FoliaMessages() {
  const [activeConvo, setActiveConvo] = useState(conversations[0]);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(activeConvo.messages);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(activeConvo.messages);
  }, [activeConvo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: `new-${Date.now()}`,
      text: newMessage,
      sender: "me",
      time: "Now",
      read: false,
    };
    setMessages((prev) => [...prev, msg]);
    setNewMessage("");
    inputRef.current?.focus();
  };

  return (
    <FoliaLayout title="Messages | Folia">
      <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex">
        {/* Conversation list */}
        <aside
          className="w-full md:w-80 border-r border-border bg-card flex-shrink-0 flex flex-col md:flex"
          role="region"
          aria-label="Conversations"
        >
          <div className="p-4 border-b border-border">
            <h1 className="text-lg font-display text-foreground">Messages</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setActiveConvo(convo)}
                className={`w-full text-left p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b border-border ${
                  activeConvo.id === convo.id ? "bg-secondary" : ""
                }`}
                aria-current={activeConvo.id === convo.id ? "true" : undefined}
              >
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {convo.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      {convo.name}
                      {convo.isProject && <FolderOpen className="h-3 w-3 text-muted-foreground" />}
                    </p>
                    <span className="text-xs text-muted-foreground">{convo.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{convo.lastMessage}</p>
                </div>
                {convo.unread > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0" aria-label={`${convo.unread} unread messages`}>
                    {convo.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Chat panel */}
        <div className="hidden md:flex flex-1 flex-col" role="region" aria-label="Chat with {{activeConvo.name}}">
          {/* Chat header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
                {activeConvo.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{activeConvo.name}</p>
                {activeConvo.isProject && <p className="text-xs text-muted-foreground">Creative Collaboration</p>}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-label="Message thread">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.sender === "me"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-secondary-foreground rounded-bl-md"
                  }`}
                >
                  <p>{msg.text}</p>
                  <div className={`flex items-center gap-1 mt-1 ${msg.sender === "me" ? "justify-end" : ""}`}>
                    <span className={`text-[10px] ${msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {msg.time}
                    </span>
                    {msg.sender === "me" && (
                      msg.read
                        ? <CheckCheck className="h-3 w-3 text-primary-foreground/70" aria-label="Read" />
                        : <Check className="h-3 w-3 text-primary-foreground/70" aria-label="Sent" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                aria-label="Share a project"
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
              >
                <FolderOpen className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Share an image"
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
              >
                <Image className="h-5 w-5" />
              </button>
              <label htmlFor="message-input" className="sr-only">Type a message</label>
              <input
                ref={inputRef}
                id="message-input"
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="folia-input flex-1"
              />
              <button
                type="submit"
                aria-label="Send message"
                className="p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </FoliaLayout>
  );
}
