/**
 * NEXUS SOCIAL — Shared React Components
 * Loaded by every page. Each component is written with vanilla
 * React (no JSX transform needed — uses React.createElement).
 *
 * Components exported via window.NexusComponents:
 *   TopHeader, SidebarNav, SidebarRight,
 *   FeedComposer, PostCard, TrendingCard, SuggestionCard,
 *   MobileBottomNav
 */

(function () {
  'use strict';

  const e = React.createElement;

  /* ============================================================
     DATA
     ============================================================ */
  function buildNavLinks(root) {
    const r = root || '..';
    return [
      { icon: '⌂',  label: 'Home',          href: r + '/index.html',                    key: 'home' },
      { icon: '⊕',  label: 'Explore',       href: r + '/explore/explore.html',          key: 'explore' },
      { icon: '🔔', label: 'Notifications', href: r + '/notifications/notifications.html', key: 'notifications', badge: 5 },
      { icon: '✉',  label: 'Messages',      href: r + '/messages/messages.html',        key: 'messages', badge: 2 },
      { icon: '🔖', label: 'Bookmarks',     href: r + '/bookmarks/bookmarks.html',      key: 'bookmarks' },
      { icon: '👤', label: 'Profile',       href: r + '/profile/profile.html',          key: 'profile' },
      { icon: '⚙',  label: 'Settings',      href: r + '/settings/settings.html',        key: 'settings' },
    ];
  }

  const NAV_LINKS = buildNavLinks('..');

  const TRENDING_DATA = [
    { category: 'Technology', tag: '#AIRevolution',  count: '142K posts' },
    { category: 'Design',     tag: '#UITrends2026',  count: '89K posts' },
    { category: 'Science',    tag: '#SpaceExplore',  count: '76K posts' },
    { category: 'Gaming',     tag: '#NextGenGaming', count: '54K posts' },
    { category: 'Music',      tag: '#SynthWave',     count: '41K posts' },
  ];

  const SUGGESTIONS_DATA = [
    { name: 'Aria Chen',    handle: '@aria_designs', avatar: 'https://i.pravatar.cc/80?img=47' },
    { name: 'Marcus Webb',  handle: '@marcuswebb',   avatar: 'https://i.pravatar.cc/80?img=12' },
    { name: 'Lena Kovacs',  handle: '@lenakovacs',   avatar: 'https://i.pravatar.cc/80?img=23' },
  ];

  const NEWS_DATA = [
    { headline: 'Open-source AI models now rival proprietary systems in benchmarks', time: '2h ago' },
    { headline: 'New spatial computing interface redefines how we interact with apps', time: '4h ago' },
    { headline: 'Record number of developers contributing to community projects', time: '6h ago' },
  ];

  /* ============================================================
     TOP HEADER
     ============================================================ */
  function TopHeader({ activePage, rootPath }) {
    const r = rootPath || '..';
    return e('header', { className: 'top-header', role: 'banner' },
      e('a', { href: '#main-content', className: 'skip-link' }, 'Skip to main content'),

      e('a', {
        href: r + '/index.html',
        className: 'top-header__logo',
        'aria-label': 'Nexus Social — Go to home'
      },
        e('div', { className: 'top-header__logo-icon', 'aria-hidden': 'true' }, '✦'),
        e('span', null, 'Nexus')
      ),

      e('div', { className: 'top-header__search', role: 'search' },
        e('label', { htmlFor: 'global-search', className: 'visually-hidden' }, 'Search Nexus Social'),
        e('span', { className: 'top-header__search-icon', 'aria-hidden': 'true' }, '🔍'),
        e('input', {
          id: 'global-search',
          type: 'search',
          placeholder: 'Search Nexus…',
          'aria-label': 'Search Nexus Social',
          autoComplete: 'off'
        })
      ),

      e('div', { className: 'top-header__actions', role: 'navigation', 'aria-label': 'Header actions' },
        e('button', {
          className: 'icon-btn',
          'aria-label': 'Notifications (5 unread)',
          title: 'Notifications'
        },
          '🔔',
          e('span', { className: 'icon-btn__badge', 'aria-hidden': 'true' }, '5')
        ),
        e('button', {
          className: 'icon-btn',
          'aria-label': 'Messages (2 unread)',
          title: 'Messages'
        },
          '✉',
          e('span', { className: 'icon-btn__badge', 'aria-hidden': 'true' }, '2')
        ),
        e('a', {
          href: r + '/profile/profile.html',
          className: 'header-avatar',
          'aria-label': 'View your profile — Jordan Parker',
          tabIndex: 0
        },
          e('img', {
            src: 'https://i.pravatar.cc/80?img=33',
            alt: 'Your avatar: Jordan Parker',
            width: 36, height: 36
          })
        )
      )
    );
  }

  /* ============================================================
     SIDEBAR NAV
     ============================================================ */
  function SidebarNav({ activePage, rootPath }) {
    const links = buildNavLinks(rootPath || '..');
    return e('nav', {
      className: 'sidebar-left',
      'aria-label': 'Main navigation'
    },
      e('ul', { role: 'list' },
        links.map(link =>
          e('li', { key: link.key },
            e('a', {
              href: link.href,
              className: 'nav-item' + (activePage === link.key ? ' active' : ''),
              'aria-current': activePage === link.key ? 'page' : undefined,
              'aria-label': link.badge
                ? `${link.label} — ${link.badge} unread`
                : link.label
            },
              e('span', { className: 'nav-item__icon', 'aria-hidden': 'true' }, link.icon),
              e('span', null, link.label),
              link.badge
                ? e('span', { className: 'nav-item__badge', 'aria-hidden': 'true' }, link.badge)
                : null
            )
          )
        )
      ),

      e('div', { className: 'sidebar-left__cta' },
        e('button', {
          className: 'btn-primary',
          'aria-label': 'Compose a new post'
        },
          e('span', { 'aria-hidden': 'true' }, '✦'),
          ' Post'
        )
      ),

      e('div', { className: 'sidebar-left__profile' },
        e('a', {
          href: (rootPath || '..') + '/profile/profile.html',
          className: 'mini-profile',
          'aria-label': 'Your profile: Jordan Parker, @jordan_p'
        },
          e('div', { className: 'mini-profile__avatar' },
            e('img', {
              src: 'https://i.pravatar.cc/80?img=33',
              alt: 'Jordan Parker avatar',
              width: 40, height: 40
            })
          ),
          e('div', { className: 'mini-profile__info' },
            e('div', { className: 'mini-profile__name' }, 'Jordan Parker'),
            e('div', { className: 'mini-profile__handle' }, '@jordan_p')
          ),
          e('span', { className: 'mini-profile__dots', 'aria-hidden': 'true' }, '···')
        )
      )
    );
  }

  /* ============================================================
     MOBILE BOTTOM NAV
     ============================================================ */
  function MobileBottomNav({ activePage, rootPath }) {
    const r = rootPath || '..';
    const items = [
      { icon: '⌂', label: 'Home',      href: r + '/index.html',                    key: 'home' },
      { icon: '⊕', label: 'Explore',   href: r + '/explore/explore.html',          key: 'explore' },
      { icon: '🔔',label: 'Alerts',    href: r + '/notifications/notifications.html', key: 'notifications' },
      { icon: '✉', label: 'Messages',  href: r + '/messages/messages.html',        key: 'messages' },
      { icon: '👤',label: 'Profile',   href: r + '/profile/profile.html',          key: 'profile' },
    ];
    return e('nav', {
      className: 'mobile-bottom-nav',
      'aria-label': 'Mobile navigation'
    },
      items.map(item =>
        e('a', {
          key: item.key,
          href: item.href,
          className: 'mobile-nav-btn' + (activePage === item.key ? ' active' : ''),
          'aria-current': activePage === item.key ? 'page' : undefined,
          'aria-label': item.label
        },
          e('span', { className: 'ico', 'aria-hidden': 'true' }, item.icon),
          e('span', null, item.label)
        )
      )
    );
  }

  /* ============================================================
     FEED COMPOSER
     ============================================================ */
  function FeedComposer() {
    return e('section', {
      className: 'feed-composer',
      'aria-label': 'Compose a new post'
    },
      e('div', { className: 'feed-composer__avatar', 'aria-hidden': 'true' },
        e('img', {
          src: 'https://i.pravatar.cc/80?img=33',
          alt: '',
          width: 44, height: 44
        })
      ),
      e('div', { className: 'feed-composer__body' },
        e('label', { htmlFor: 'compose-input', className: 'visually-hidden' },
          'What\'s happening? Compose a new post'
        ),
        e('textarea', {
          id: 'compose-input',
          className: 'feed-composer__input',
          placeholder: 'What\'s happening?',
          rows: 2,
          'aria-label': 'Post content — What\'s happening?'
        }),
        e('div', { className: 'feed-composer__divider', 'aria-hidden': 'true' }),
        e('div', { className: 'feed-composer__actions', role: 'toolbar', 'aria-label': 'Post composition tools' },
          e('button', { className: 'composer-action-btn', 'aria-label': 'Add image', title: 'Add image' }, '🖼'),
          e('button', { className: 'composer-action-btn', 'aria-label': 'Add video', title: 'Add video' }, '🎬'),
          e('button', { className: 'composer-action-btn', 'aria-label': 'Add emoji', title: 'Add emoji' }, '😊'),
          e('button', { className: 'composer-action-btn', 'aria-label': 'Add poll', title: 'Add poll' }, '📊'),
          e('button', { className: 'composer-action-btn', 'aria-label': 'Schedule post', title: 'Schedule' }, '📅'),
          e('button', { className: 'feed-composer__post-btn btn-primary', 'aria-label': 'Publish post' }, 'Post')
        )
      )
    );
  }

  /* ============================================================
     POST CARD
     ============================================================ */
  function PostCard({ post, rootPath }) {
    const r = rootPath || '..';
    const {
      name, handle, time, avatar, text, hasMedia, mediaEmoji,
      likes, comments, shares, views, bookmarks, id
    } = post;

    return e('article', {
      className: 'post-card',
      'aria-label': `Post by ${name}`
    },
      e('a', {
        href: r + '/profile/profile.html',
        className: 'post-card__avatar',
        'aria-label': `View ${name}'s profile`,
        tabIndex: 0
      },
        e('img', {
          src: avatar,
          alt: `${name}'s avatar`,
          width: 44, height: 44,
          loading: 'lazy'
        })
      ),

      e('div', { className: 'post-card__body' },
        e('header', { className: 'post-card__header' },
          e('a', {
            href: r + '/profile/profile.html',
            className: 'post-card__name',
            'aria-label': `${name}'s profile`
          }, name),
          e('span', { className: 'post-card__handle', 'aria-label': `Handle: ${handle}` }, handle),
          e('time', { className: 'post-card__time', dateTime: time }, time)
        ),

        e('p', { className: 'post-card__text' }, text),

        hasMedia
          ? e('div', { className: 'post-card__media', role: 'img', 'aria-label': 'Post media placeholder' },
              e('div', { className: 'post-card__media-placeholder', 'aria-hidden': 'true' }, mediaEmoji || '🖼')
            )
          : null,

        e('footer', {
          className: 'post-card__actions',
          role: 'group',
          'aria-label': `Actions for post by ${name}`
        },
          e('button', {
            className: 'post-action-btn post-action-btn--like',
            'aria-label': `Like this post — ${likes} likes`,
            'aria-pressed': 'false'
          }, '♡ ', likes),
          e('button', {
            className: 'post-action-btn',
            'aria-label': `Comment — ${comments} comments`
          }, '💬 ', comments),
          e('button', {
            className: 'post-action-btn post-action-btn--rt',
            'aria-label': `Repost — ${shares} reposts`,
            'aria-pressed': 'false'
          }, '↻ ', shares),
          e('span', { className: 'post-action-btn', 'aria-label': `${views} views`, 'aria-live': 'polite' },
            '👁 ', views
          ),
          e('button', {
            className: 'post-action-btn post-action-btn--last',
            'aria-label': 'Bookmark this post',
            'aria-pressed': 'false'
          }, '🔖')
        )
      )
    );
  }

  /* ============================================================
     TRENDING CARD (right sidebar)
     ============================================================ */
  function TrendingCard({ rootPath }) {
    const r = rootPath || '..';
    return e('section', { className: 'sidebar-card', 'aria-label': 'Trending topics' },
      e('h2', { className: 'sidebar-card__title' }, '🔥 Trending'),
      e('ul', { role: 'list' },
        TRENDING_DATA.map((item, i) =>
          e('li', { key: i },
            e('a', {
              href: r + '/explore/explore.html',
              className: 'trending-item',
              'aria-label': `Trending: ${item.tag} — ${item.count}`
            },
              e('div', { className: 'trending-item__meta' }, item.category),
              e('div', { className: 'trending-item__tag' }, item.tag),
              e('div', { className: 'trending-item__count' }, item.count)
            )
          )
        )
      ),
      e('a', {
        href: r + '/explore/explore.html',
        style: { display: 'block', padding: '8px', marginTop: '4px', textAlign: 'center', color: 'var(--clr-accent-light)', fontSize: '0.875rem', borderRadius: '8px' },
        className: 'show-more-link',
        'aria-label': 'Show more trending topics'
      }, 'Show more')
    );
  }

  /* ============================================================
     SUGGESTION CARD (right sidebar)
     ============================================================ */
  function SuggestionCard({ rootPath }) {
    const r = rootPath || '..';
    return e('section', { className: 'sidebar-card', 'aria-label': 'Suggested accounts to follow' },
      e('h2', { className: 'sidebar-card__title' }, '✦ Who to follow'),
      e('ul', { role: 'list', style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
        SUGGESTIONS_DATA.map((user, i) =>
          e('li', { key: i },
            e('div', { className: 'suggestion-item' },
              e('a', {
                href: r + '/profile/profile.html',
                className: 'suggestion-item__avatar',
                'aria-label': `View ${user.name}'s profile`,
                tabIndex: 0
              },
                e('img', {
                  src: user.avatar,
                  alt: `${user.name}'s avatar`,
                  width: 40, height: 40,
                  loading: 'lazy'
                })
              ),
              e('div', { className: 'suggestion-item__info' },
                e('a', {
                  href: r + '/profile/profile.html',
                  className: 'suggestion-item__name',
                  'aria-label': `${user.name}'s profile`
                }, user.name),
                e('div', { className: 'suggestion-item__handle' }, user.handle)
              ),
              e('button', {
                className: 'btn-follow',
                'aria-label': `Follow ${user.name}`
              }, 'Follow')
            )
          )
        )
      ),
      e('a', {
        href: r + '/explore/explore.html',
        style: { display: 'block', padding: '8px', marginTop: '8px', textAlign: 'center', color: 'var(--clr-accent-light)', fontSize: '0.875rem', borderRadius: '8px' },
        'aria-label': 'Show more suggested accounts'
      }, 'Show more')
    );
  }

  /* ============================================================
     NEWS CARD (right sidebar)
     ============================================================ */
  function NewsCard() {
    return e('section', { className: 'sidebar-card', 'aria-label': 'News headlines' },
      e('h2', { className: 'sidebar-card__title' }, '📰 Headlines'),
      e('ul', { role: 'list', style: { display: 'flex', flexDirection: 'column', gap: '2px' } },
        NEWS_DATA.map((item, i) =>
          e('li', { key: i },
            e('a', {
              href: '#',
              style: { display: 'block', padding: '8px', borderRadius: '8px', transition: 'background 120ms' },
              className: 'news-item',
              onMouseEnter: ev => ev.currentTarget.style.background = 'var(--clr-surface-2)',
              onMouseLeave: ev => ev.currentTarget.style.background = ''
            },
              e('div', { style: { fontSize: '0.875rem', fontWeight: '500', color: 'var(--clr-text)', marginBottom: '2px', lineHeight: '1.4' } }, item.headline),
              e('div', { style: { fontSize: '0.75rem', color: 'var(--clr-text-3)' } }, item.time)
            )
          )
        )
      )
    );
  }

  /* ============================================================
     PREMIUM CARD (right sidebar)
     ============================================================ */
  function PremiumCard({ rootPath }) {
    const r = rootPath || '..';
    return e('div', { className: 'premium-card', role: 'complementary', 'aria-label': 'Nexus Premium subscription' },
      e('div', { className: 'premium-card__title' }, '✦ Nexus Premium'),
      e('div', { className: 'premium-card__desc' },
        'Unlock advanced analytics, longer posts, edit history, and an ad-free experience.'
      ),
      e('a', {
        href: r + '/settings/settings.html',
        className: 'btn-premium',
        'aria-label': 'Subscribe to Nexus Premium'
      }, '⭐ Upgrade')
    );
  }

  /* ============================================================
     SPONSORED CARD (right sidebar)
     ============================================================ */
  function SponsoredCard() {
    return e('div', { className: 'sponsored-card', role: 'complementary', 'aria-label': 'Sponsored content' },
      e('div', { className: 'sponsored-card__img', 'aria-hidden': 'true' }, '🛒'),
      e('div', { className: 'sponsored-card__body' },
        e('div', { className: 'sponsored-card__label' }, 'Sponsored'),
        e('div', { className: 'sponsored-card__title' }, 'Elevate your workflow with ProTools Suite'),
        e('a', {
          href: '#',
          className: 'sponsored-card__cta',
          'aria-label': 'Learn more about ProTools Suite (sponsored)'
        }, 'Learn more →')
      )
    );
  }

  /* ============================================================
     RIGHT SIDEBAR (assembled)
     ============================================================ */
  function SidebarRight({ rootPath }) {
    return e('aside', {
      className: 'sidebar-right',
      'aria-label': 'Contextual information'
    },
      e(TrendingCard, { rootPath }),
      e(NewsCard),
      e(SuggestionCard, { rootPath }),
      e(PremiumCard, { rootPath }),
      e(SponsoredCard)
    );
  }

  /* ============================================================
     SAMPLE POSTS DATA (used by feed pages)
     ============================================================ */
  const SAMPLE_POSTS = [
    {
      id: 1,
      name: 'Aria Chen',
      handle: '@aria_designs',
      time: '2m',
      avatar: 'https://i.pravatar.cc/80?img=47',
      text: 'Just shipped a major redesign of our design system. The new tokenized approach makes theming so much faster. Open-sourcing it next week! 🚀',
      hasMedia: false,
      likes: '1.2K',
      comments: '84',
      shares: '312',
      views: '28K',
    },
    {
      id: 2,
      name: 'Marcus Webb',
      handle: '@marcuswebb',
      time: '15m',
      avatar: 'https://i.pravatar.cc/80?img=12',
      text: 'Hot take: the best AI UX is the one you don\'t notice. Seamless, contextual, frictionless. We\'re getting closer every month. What do you think?',
      hasMedia: true,
      mediaEmoji: '🤖',
      likes: '847',
      comments: '156',
      shares: '203',
      views: '14K',
    },
    {
      id: 3,
      name: 'Lena Kovacs',
      handle: '@lenakovacs',
      time: '1h',
      avatar: 'https://i.pravatar.cc/80?img=23',
      text: 'Spent the morning at a generative art exhibition. The intersection of algorithms and human emotion is genuinely breathtaking. 🎨',
      hasMedia: true,
      mediaEmoji: '🎨',
      likes: '2.3K',
      comments: '91',
      shares: '445',
      views: '52K',
    },
    {
      id: 4,
      name: 'Dev Sharma',
      handle: '@dev_builds',
      time: '2h',
      avatar: 'https://i.pravatar.cc/80?img=61',
      text: 'The gap between "working code" and "maintainable code" is where most projects live or die. Write for the developer who\'ll read this at 2am.',
      hasMedia: false,
      likes: '4.1K',
      comments: '332',
      shares: '891',
      views: '87K',
    },
    {
      id: 5,
      name: 'Sofia Reyes',
      handle: '@sofiareyes',
      time: '3h',
      avatar: 'https://i.pravatar.cc/80?img=56',
      text: 'New research shows ambient computing interfaces reduce cognitive load by 34% compared to screen-based interactions. The future of UX is spatial.',
      hasMedia: true,
      mediaEmoji: '📊',
      likes: '671',
      comments: '48',
      shares: '187',
      views: '9.4K',
    },
  ];

  /* ============================================================
     EXPORT
     ============================================================ */
  window.NexusComponents = {
    TopHeader,
    SidebarNav,
    SidebarRight,
    FeedComposer,
    PostCard,
    TrendingCard,
    SuggestionCard,
    MobileBottomNav,
    SAMPLE_POSTS,
    NAV_LINKS,
  };

})();
