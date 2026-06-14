import { useState } from "react";
import { FoliaLayout } from "@/components/social-media/FoliaLayout";
import { Send, Image, FolderOpen, Check, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";

const threads = [
  { id: 1, name: "Lena Oort", avatar: "LO", lastMsg: "I love the color study — maybe try warmer shadows?", time: "2m", unread: true, type: "collab" },
  { id: 2, name: "Tomás Rivera", avatar: "TR", lastMsg: "Thanks for the feedback on the greenhouse series!", time: "1h", unread: false, type: "dm" },
  { id: 3, name: "Ava Moretti", avatar: "AM", lastMsg: "Shared a project with you", time: "3h", unread: true, type: "collab" },
  { id: 4, name: "Kai Hoffman", avatar: "KH", lastMsg: "Want to collab on the motion piece?", time: "1d", unread: false, type: "dm" },
  { id: 5, name: "Priya Nair", avatar: "PN", lastMsg: "Here's the updated palette 🎨", time: "2d", unread: false, type: "dm" },
];

const messages = [
  { id: 1, sender: "them", text: "Hey! I saw your Solstice series — absolutely gorgeous work.", time: "10:24 AM", read: true },
  { id: 2, sender: "me", text: "Thank you so much! That means a lot coming from you. I've been experimenting with layered textures lately.", time: "10:26 AM", read: true },
  { id: 3, sender: "them", text: "I can tell! The depth is incredible. Would you be open to collaborating on a joint piece?", time: "10:28 AM", read: true },
  { id: 4, sender: "them", image: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=300&h=200&fit=crop", text: "Here's something I've been working on — similar vibe", time: "10:29 AM", read: true },
  { id: 5, sender: "me", text: "Oh wow, I love the color study — maybe try warmer shadows? That would bridge our styles nicely.", time: "10:31 AM", read: false },
];

export default function MessagesPage() {
  const [activeThread, setActiveThread] = useState(0);

  return (
    <FoliaLayout>
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Thread List */}
        <div className="w-80 border-r border-border overflow-y-auto shrink-0 hidden md:block">
          <div className="p-4">
            <h2 className="font-display text-lg text-foreground mb-3">Messages</h2>
          </div>
          {threads.map((thread, i) => (
            <button
              key={thread.id}
              onClick={() => setActiveThread(i)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                activeThread === i ? "bg-secondary/60" : "hover:bg-secondary/30"
              }`}
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${
                thread.type === "collab" ? "bg-folia-teal/15 text-folia-teal" : "bg-folia-coral/15 text-folia-coral"
              }`}>
                {thread.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${thread.unread ? "font-semibold text-foreground" : "text-foreground"}`}>
                    {thread.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{thread.time}</span>
                </div>
                <p className={`text-xs truncate ${thread.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {thread.lastMsg}
                </p>
              </div>
              {thread.unread && <div className="h-2 w-2 rounded-full bg-folia-coral shrink-0" />}
            </button>
          ))}
        </div>

        {/* Conversation */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-folia-coral/15 text-folia-coral flex items-center justify-center font-semibold text-xs">
              {threads[activeThread].avatar}
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{threads[activeThread].name}</p>
              <p className="text-xs text-muted-foreground">
                {threads[activeThread].type === "collab" ? "Creative Collaboration" : "Direct Message"}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-xs rounded-2xl px-4 py-2 ${
                  msg.sender === "me"
                    ? "bg-folia-coral text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}>
                  {msg.image && (
                    <img src={msg.image} alt="" className="rounded-lg mb-2 w-full" />
                  )}
                  <p className="text-sm">{msg.text}</p>
                  <div className={`flex items-center gap-1 mt-1 ${
                    msg.sender === "me" ? "justify-end" : ""
                  }`}>
                    <span className={`text-xs ${msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {msg.time}
                    </span>
                    {msg.sender === "me" && (
                      msg.read
                        ? <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                        : <Check className="h-3 w-3 text-primary-foreground/70" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border flex items-center gap-2">
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Image className="h-5 w-5" />
            </button>
            <button className="text-muted-foreground hover:text-folia-teal transition-colors" title="Share a Project">
              <FolderOpen className="h-5 w-5" />
            </button>
            <input
              placeholder="Type a message..."
              className="flex-1 bg-muted rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button className="h-9 w-9 rounded-full bg-folia-coral text-primary-foreground flex items-center justify-center hover:bg-folia-coral/90 transition-colors">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </FoliaLayout>
  );
}
