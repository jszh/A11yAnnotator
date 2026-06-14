window.PulseData = (() => {
  const posts = [
    {
      id: "post-1",
      displayName: "Maya Chen",
      handle: "@maya",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
      timestamp: "12m",
      text: "Spent the morning at the waterfront climate summit. The best sessions were the ones led by local organizers who translated policy into neighborhood action.",
      image: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
      likes: 42,
      comments: 8,
      shares: 5,
      bookmarked: false
    },
    {
      id: "post-2",
      displayName: "Owen Park",
      handle: "@owenpark",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
      timestamp: "38m",
      text: "Everyone is talking about AI hiring freezes, but the better story is how teams are redesigning roles. That shift is going to outlast the headlines.",
      image: "",
      likes: 118,
      comments: 26,
      shares: 11,
      bookmarked: true
    },
    {
      id: "post-3",
      displayName: "Sara Imani",
      handle: "@sarai",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
      timestamp: "1h",
      text: "Photo dump from tonight’s street food market. The mango chili skewers were worth the wait.",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
      likes: 267,
      comments: 33,
      shares: 19,
      bookmarked: false
    },
    {
      id: "post-4",
      displayName: "Leo Martínez",
      handle: "@leom",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
      timestamp: "2h",
      text: "World Cup city prep is accelerating. Transit maps, pop-up fan zones, and late-night service plans all dropped today.",
      image: "",
      likes: 391,
      comments: 74,
      shares: 40,
      bookmarked: false
    }
  ];

  const trending = [
    "🔥 #ClimateWeek — 84K posts",
    "#TechLayoffs",
    "#WorldCup2026",
    "#DesignSystems",
    "#NightMarket"
  ];

  const suggestedUsers = [
    {
      displayName: "Jordan Fields",
      handle: "@jordanf",
      avatar: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=400&q=80",
      bio: "Urban photographer and transit nerd."
    },
    {
      displayName: "Amara Singh",
      handle: "@amaras",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
      bio: "Tech policy reporter tracking labor and regulation."
    },
    {
      displayName: "Noah Kim",
      handle: "@nkim",
      avatar: "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&q=80",
      bio: "Writes about product teams, layoffs, and recovery."
    },
    {
      displayName: "Talia Brooks",
      handle: "@taliab",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
      bio: "Food creator sharing city guides and recipes."
    }
  ];

  const notifications = [
    { type: "All", displayName: "Maya Chen", handle: "@maya", avatar: posts[0].avatar, action: "liked your post", time: "2h", snippet: "The post about neighborhood transit redesigns really landed." },
    { type: "Mentions", displayName: "Leo Martínez", handle: "@leom", avatar: posts[3].avatar, action: "mentioned you in a thread", time: "3h", snippet: "Alex, your breakdown of fan zone logistics deserves a longer post." },
    { type: "Likes", displayName: "Sara Imani", handle: "@sarai", avatar: posts[2].avatar, action: "liked your photo set", time: "5h", snippet: "The waterfront skyline shots are still my favorite." },
    { type: "Follows", displayName: "Jordan Fields", handle: "@jordanf", avatar: suggestedUsers[0].avatar, action: "followed you", time: "7h", snippet: "Now following your posts about civic design." }
  ];

  const conversations = [
    {
      id: "maya",
      displayName: "Maya Chen",
      handle: "@maya",
      avatar: posts[0].avatar,
      preview: "Can you send the draft before the panel starts?",
      timestamp: "9:12 AM",
      unread: 2,
      messages: [
        { author: "Maya Chen", mine: false, text: "Can you send the draft before the panel starts?", time: "9:12 AM" },
        { author: "Alex Rivera", mine: true, text: "Sending it in ten. I added the climate transit notes too.", time: "9:15 AM" },
        { author: "Maya Chen", mine: false, text: "Perfect. I’ll fold that into the thread once I’m on site.", time: "9:18 AM" }
      ]
    },
    {
      id: "sara",
      displayName: "Sara Imani",
      handle: "@sarai",
      avatar: posts[2].avatar,
      preview: "Night market carousel is up. Want me to tag you?",
      timestamp: "Yesterday",
      unread: 0,
      messages: [
        { author: "Sara Imani", mine: false, text: "Night market carousel is up. Want me to tag you?", time: "Yesterday" },
        { author: "Alex Rivera", mine: true, text: "Yes, and send the skewer spot name please.", time: "Yesterday" }
      ]
    }
  ];

  return { posts, trending, suggestedUsers, notifications, conversations };
})();
