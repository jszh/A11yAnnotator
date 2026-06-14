import { useState } from "react";
import { Send, Smile, ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/social-media/AppLayout";
import { conversations, chatMessages, Conversation, Message } from "@/data/mockData";

export default function MessagesPage() {
  const [activeChat, setActiveChat] = useState<Conversation | null>(conversations[0]);
  const [showChat, setShowChat] = useState(false);

  const selectChat = (conv: Conversation) => {
    setActiveChat(conv);
    setShowChat(true);
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)] lg:h-screen max-w-4xl mx-auto">
        {/* Conversation list */}
        <section
          className={`w-full md:w-80 border-r border-border flex flex-col ${showChat ? "hidden md:flex" : "flex"}`}
          aria-label="Conversations"
        >
          <header className="pulse-glass px-4 py-3 border-b border-border">
            <h1 className="text-xl font-bold text-foreground">Messages</h1>
          </header>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                className={`w-full flex items-center gap-3 p-4 border-b border-border transition-colors text-left hover:bg-muted/30 ${
                  activeChat?.id === conv.id ? "bg-muted/40" : ""
                }`}
                onClick={() => selectChat(conv)}
                aria-label={`Chat with ${conv.user.displayName}${conv.unread > 0 ? `, ${conv.unread} unread messages` : ""}`}
                aria-current={activeChat?.id === conv.id ? "true" : undefined}
              >
                <div className="relative">
                  <img
                    src={conv.user.avatar}
                    alt={conv.user.displayName}
                    className="pulse-avatar w-12 h-12"
                  />
                  {conv.user.isOnline && <span className="pulse-online-dot" aria-label="Online" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {conv.user.displayName}
                    </p>
                    <time className="text-xs text-muted-foreground flex-shrink-0">
                      {conv.timestamp}
                    </time>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="pulse-badge">{conv.unread}</span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Chat panel */}
        <section
          className={`flex-1 flex flex-col ${showChat ? "flex" : "hidden md:flex"}`}
          aria-label={activeChat ? `Chat with ${activeChat.user.displayName}` : "Select a conversation"}
        >
          {activeChat ? (
            <>
              {/* Chat header */}
              <header className="pulse-glass px-4 py-3 border-b border-border flex items-center gap-3">
                <button
                  className="md:hidden pulse-action-btn"
                  onClick={() => setShowChat(false)}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                </button>
                <img
                  src={activeChat.user.avatar}
                  alt={activeChat.user.displayName}
                  className="pulse-avatar w-9 h-9"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {activeChat.user.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeChat.user.isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </header>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <p className="text-center text-xs text-muted-foreground py-2">Today</p>
                {chatMessages.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} />
                ))}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <button className="pulse-action-btn" aria-label="Add emoji">
                    <Smile className="w-5 h-5" aria-hidden="true" />
                  </button>
                  <label htmlFor="message-input" className="sr-only">Type a message</label>
                  <input
                    id="message-input"
                    type="text"
                    placeholder="Type a message..."
                    className="pulse-input flex-1"
                  />
                  <button
                    className="w-10 h-10 rounded-full bg-primary flex items-center justify-center transition-colors hover:bg-primary/90"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation to start messaging
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

function ChatBubble({ message }: { message: Message }) {
  return (
    <div className={`flex ${message.sent ? "justify-end" : "justify-start"}`}>
      <div className={message.sent ? "pulse-message-sent" : "pulse-message-received"}>
        <p className="text-sm">{message.text}</p>
        <time className={`text-[10px] mt-1 block ${message.sent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {message.timestamp}
        </time>
      </div>
    </div>
  );
}
