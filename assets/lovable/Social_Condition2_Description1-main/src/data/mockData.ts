export interface User {
  id: string;
  displayName: string;
  handle: string;
  avatar: string;
  bio?: string;
  followers?: number;
  following?: number;
  isOnline?: boolean;
}

export interface Post {
  id: string;
  user: User;
  text: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface Notification {
  id: string;
  type: "like" | "mention" | "follow" | "comment";
  user: User;
  text: string;
  timestamp: string;
  snippet?: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  user: User;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

export interface Message {
  id: string;
  text: string;
  sent: boolean;
  timestamp: string;
}

export const currentUser: User = {
  id: "u0",
  displayName: "Alex Rivera",
  handle: "alexrivera",
  avatar: "https://i.pravatar.cc/150?img=12",
  bio: "Designer & creative technologist. Building the future one pixel at a time. 🎨✨",
  followers: 2847,
  following: 631,
};

export const users: User[] = [
  { id: "u1", displayName: "Maya Chen", handle: "mayachen", avatar: "https://i.pravatar.cc/150?img=5", bio: "Photographer & storyteller", followers: 12400, following: 842, isOnline: true },
  { id: "u2", displayName: "Jordan Blake", handle: "jordanblake", avatar: "https://i.pravatar.cc/150?img=8", bio: "Tech journalist", followers: 8200, following: 512 },
  { id: "u3", displayName: "Sam Patel", handle: "sampatel", avatar: "https://i.pravatar.cc/150?img=11", bio: "Startup founder & coffee enthusiast", followers: 5600, following: 320, isOnline: true },
  { id: "u4", displayName: "Aria Kim", handle: "ariakim", avatar: "https://i.pravatar.cc/150?img=9", bio: "UI/UX designer at Figma", followers: 19300, following: 267 },
  { id: "u5", displayName: "Leo Martinez", handle: "leomartinez", avatar: "https://i.pravatar.cc/150?img=14", bio: "Music producer & vinyl collector", followers: 3100, following: 450, isOnline: true },
  { id: "u6", displayName: "Nina Zhao", handle: "ninazhao", avatar: "https://i.pravatar.cc/150?img=20", bio: "Climate researcher", followers: 7800, following: 389 },
  { id: "u7", displayName: "Kai Anderson", handle: "kaianderson", avatar: "https://i.pravatar.cc/150?img=15", bio: "Full-stack dev", followers: 4200, following: 198, isOnline: true },
  { id: "u8", displayName: "Zara Okafor", handle: "zaraokafor", avatar: "https://i.pravatar.cc/150?img=25", bio: "Travel blogger", followers: 22100, following: 534 },
];

export const feedPosts: Post[] = [
  {
    id: "p1", user: users[0], timestamp: "2h",
    text: "Just wrapped up an incredible sunset shoot at the pier. The light was absolutely magical today — golden hour never disappoints. 🌅",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    likes: 342, comments: 28, shares: 15, isLiked: true,
  },
  {
    id: "p2", user: users[1], timestamp: "4h",
    text: "New article: The AI revolution is reshaping how we think about creativity. Are we ready for what comes next? Thread below 🧵",
    likes: 189, comments: 67, shares: 44,
  },
  {
    id: "p3", user: users[2], timestamp: "5h",
    text: "Three years ago I left my corporate job to build something meaningful. Today we hit 100K users. The journey has been wild but worth every sleepless night.",
    likes: 1204, comments: 156, shares: 89,
  },
  {
    id: "p4", user: users[3], timestamp: "7h",
    text: "Design tip: White space isn't empty space — it's breathing room for your content. Stop filling every pixel.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop",
    likes: 567, comments: 42, shares: 31,
  },
  {
    id: "p5", user: users[4], timestamp: "9h",
    text: "New track dropping this Friday. Been working on this one for months — it's got that retro synth vibe with modern production. Stay tuned 🎵",
    likes: 98, comments: 12, shares: 8,
  },
  {
    id: "p6", user: users[5], timestamp: "12h",
    text: "The latest climate data is in: global temperatures have risen 0.2°C faster than predicted. We need to act now, not tomorrow.",
    likes: 2340, comments: 312, shares: 876,
  },
];

export const trendingTopics = [
  { tag: "#ClimateWeek", posts: "84K" },
  { tag: "#TechLayoffs", posts: "42K" },
  { tag: "#WorldCup2026", posts: "128K" },
  { tag: "#AIArt", posts: "33K" },
  { tag: "#MondayMotivation", posts: "19K" },
];

export const notifications: Notification[] = [
  { id: "n1", type: "like", user: users[0], text: "liked your post", timestamp: "2h", snippet: "Design tip: White space isn't empty space...", read: false },
  { id: "n2", type: "mention", user: users[1], text: "mentioned you in a post", timestamp: "3h", snippet: "Great thread by @alexrivera on modern design...", read: false },
  { id: "n3", type: "follow", user: users[6], text: "started following you", timestamp: "5h", read: false },
  { id: "n4", type: "comment", user: users[2], text: "commented on your post", timestamp: "6h", snippet: "Totally agree! The journey is what matters.", read: true },
  { id: "n5", type: "like", user: users[3], text: "liked your post", timestamp: "8h", snippet: "Just wrapped up an incredible sunset shoot...", read: true },
  { id: "n6", type: "follow", user: users[7], text: "started following you", timestamp: "12h", read: true },
  { id: "n7", type: "mention", user: users[4], text: "mentioned you in a comment", timestamp: "1d", snippet: "Check out @alexrivera's latest work!", read: true },
  { id: "n8", type: "like", user: users[5], text: "liked your post", timestamp: "1d", snippet: "Three years ago I left my corporate job...", read: true },
];

export const conversations: Conversation[] = [
  { id: "c1", user: users[0], lastMessage: "Those photos are stunning! Where was that?", timestamp: "2m", unread: 2 },
  { id: "c2", user: users[2], lastMessage: "Let's grab coffee this week 👋", timestamp: "1h", unread: 0 },
  { id: "c3", user: users[3], lastMessage: "Sent you the design files", timestamp: "3h", unread: 1 },
  { id: "c4", user: users[4], lastMessage: "The track is fire 🔥🔥", timestamp: "5h", unread: 0 },
  { id: "c5", user: users[6], lastMessage: "Can you review the PR?", timestamp: "1d", unread: 0 },
];

export const chatMessages: Message[] = [
  { id: "m1", text: "Hey! Loved your latest photo series 📸", sent: false, timestamp: "10:23 AM" },
  { id: "m2", text: "Thanks so much! That shoot at the pier was magical", sent: true, timestamp: "10:25 AM" },
  { id: "m3", text: "The golden hour lighting was perfect. What camera did you use?", sent: false, timestamp: "10:26 AM" },
  { id: "m4", text: "Sony A7IV with the 24-70mm GM. It handles low light like a dream", sent: true, timestamp: "10:28 AM" },
  { id: "m5", text: "Those photos are stunning! Where was that?", sent: false, timestamp: "10:30 AM" },
  { id: "m6", text: "Santa Monica Pier! We should do a collab shoot sometime", sent: true, timestamp: "10:32 AM" },
];

export const explorePosts: Post[] = [
  {
    id: "ep1", user: users[7], timestamp: "1h",
    text: "Exploring the streets of Tokyo at night. Every corner is a new adventure. 🗼",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=500&fit=crop",
    likes: 4521, comments: 234, shares: 167,
  },
  {
    id: "ep2", user: users[3], timestamp: "3h",
    text: "Minimalism in UI design — less really is more.",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop",
    likes: 892, comments: 56, shares: 34,
  },
  {
    id: "ep3", user: users[5], timestamp: "6h",
    text: "Nature always finds a way. 🌿",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop",
    likes: 1567, comments: 89, shares: 45,
  },
  {
    id: "ep4", user: users[4], timestamp: "8h",
    text: "Studio vibes today. New music incoming.",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=350&fit=crop",
    likes: 234, comments: 18, shares: 9,
  },
  {
    id: "ep5", user: users[6], timestamp: "10h",
    text: "Code is poetry when written with intention.",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop",
    likes: 678, comments: 45, shares: 23,
  },
  {
    id: "ep6", user: users[1], timestamp: "14h",
    text: "The future of work is already here.",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=450&fit=crop",
    likes: 445, comments: 67, shares: 28,
  },
];
