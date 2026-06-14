import { Send, Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
}

interface Message {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
}

const conversations: Conversation[] = [
  { id: "1", name: "Maya Chen", avatar: "Maya", lastMessage: "That sounds amazing! Let's collab 🚀", time: "2m", unread: 2 },
  { id: "2", name: "Jordan Lee", avatar: "Jordan", lastMessage: "Did you see the sunset pics?", time: "1h", unread: 0 },
  { id: "3", name: "Sam Rivera", avatar: "Sam", lastMessage: "PR is ready for review", time: "3h", unread: 1 },
  { id: "4", name: "Priya Patel", avatar: "Priya", lastMessage: "Thanks for the article!", time: "5h", unread: 0 },
  { id: "5", name: "Leo Martinez", avatar: "Leo", lastMessage: "Tokyo was incredible", time: "1d", unread: 0 },
];

const chatMessages: Message[] = [
  { id: "1", sender: "them", text: "Hey Alex! I saw your latest post about AI development. Super interesting stuff!", time: "10:30 AM" },
  { id: "2", sender: "me", text: "Thanks Maya! I've been experimenting with a few different approaches. The results are really promising.", time: "10:32 AM" },
  { id: "3", sender: "them", text: "Would love to collaborate on something together. I've been working on a design system that could pair really well with AI tooling.", time: "10:35 AM" },
  { id: "4", sender: "me", text: "That's exactly what I've been thinking about. Let's set up a call this week?", time: "10:38 AM" },
  { id: "5", sender: "them", text: "That sounds amazing! Let's collab 🚀", time: "10:40 AM" },
];

export default function MessagesPage() {
  const [activeConvo, setActiveConvo] = useState("1");
  const activeUser = conversations.find((c) => c.id === activeConvo)!;

  return (
    <div className="flex h-[calc(100vh-56px)] lg:h-screen">
      {/* Conversation List */}
      <div className="w-full sm:w-80 border-r border-border flex flex-col bg-card/50 sm:flex-shrink-0">
        <div className="p-4 border-b border-border">
          <h1 className="font-display text-xl font-bold text-foreground">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((convo) => (
            <button
              key={convo.id}
              onClick={() => setActiveConvo(convo.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
                activeConvo === convo.id ? "bg-secondary" : "hover:bg-secondary/50"
              )}
            >
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${convo.avatar}`}
                alt={convo.name}
                className="w-10 h-10 rounded-full bg-secondary flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-foreground">{convo.name}</span>
                  <span className="text-[10px] text-muted-foreground">{convo.time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{convo.lastMessage}</p>
              </div>
              {convo.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {convo.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="hidden sm:flex flex-1 flex-col">
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeUser.avatar}`}
            alt={activeUser.name}
            className="w-8 h-8 rounded-full bg-secondary"
          />
          <div>
            <p className="text-sm font-semibold text-foreground">{activeUser.name}</p>
            <p className="text-xs text-pulse-success">Online</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.sender === "me" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm",
                  msg.sender === "me"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-foreground rounded-bl-md"
                )}
              >
                <p>{msg.text}</p>
                <p className={cn("text-[10px] mt-1", msg.sender === "me" ? "text-primary-foreground/60" : "text-muted-foreground")}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <button className="text-muted-foreground hover:text-foreground transition-colors p-2">
              <Smile className="w-5 h-5" />
            </button>
            <input
              type="text"
              placeholder="Type a message..."
              className="pulse-input flex-1"
            />
            <button className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
