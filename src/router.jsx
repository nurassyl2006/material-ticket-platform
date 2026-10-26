import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

/**
 * Enterprise SPA Page Router for EduOps
 * Enables true separate page routing with HTML5 History API, URL synchronization,
 * browser back/forward navigation, direct link loading, and dynamic document titles.
 */

export const ROUTES = {
  dashboard: {
    tab: 'dashboard',
    path: '/dashboard',
    aliases: ['/', '/home', ''],
    titles: {
      en: 'Dashboard — EduOps',
      ru: 'Панель управления — EduOps',
      kk: 'Басқару панелі — EduOps'
    }
  },
  tickets: {
    tab: 'tickets',
    path: '/tickets',
    aliases: ['/requests', '/my-tickets', '/new-ticket'],
    titles: {
      en: 'All Requests & Maintenance — EduOps',
      ru: 'Все заявки и обслуживание — EduOps',
      kk: 'Барлық өтінімдер — EduOps'
    }
  },
  inventory: {
    tab: 'inventory',
    path: '/inventory',
    aliases: ['/warehouse', '/stock'],
    titles: {
      en: 'Warehouse Inventory & Assets — EduOps',
      ru: 'Складской учет и материалы — EduOps',
      kk: 'Қойма есебі және материалдар — EduOps'
    }
  },
  users: {
    tab: 'users',
    path: '/users',
    aliases: ['/staff', '/team', '/roles'],
    titles: {
      en: 'Staff & Roles Administration — EduOps',
      ru: 'Сотрудники и роли — EduOps',
      kk: 'Қызметкерлер мен рөлдер — EduOps'
    }
  },
  'daily-digest': {
    tab: 'daily-digest',
    path: '/daily-digest',
    aliases: ['/daily-report', '/executive-digest', '/daily'],
    titles: {
      en: 'Executive Daily Ticket Digest — EduOps',
      ru: 'Ежедневный отчет по заявкам — EduOps',
      kk: 'Күнделікті өтінімдер есебі — EduOps'
    }
  },
  dailyDigest: {
    tab: 'daily-digest',
    path: '/daily-digest',
    aliases: ['/daily-report', '/executive-digest', '/daily'],
    titles: {
      en: 'Executive Daily Ticket Digest — EduOps',
      ru: 'Ежедневный отчет по заявкам — EduOps',
      kk: 'Күнделікті өтінімдер есебі — EduOps'
    }
  },
  profile: {
    tab: 'profile',
    path: '/profile',
    aliases: ['/account'],
    titles: {
      en: 'User Profile — EduOps',
      ru: 'Профиль пользователя — EduOps',
      kk: 'Пайдаланушы профилі — EduOps'
    }
  }
};

/**
 * Automatically detects whether app is running on root domain or under a subpath
 * (e.g. /material-ticket-platform on GitHub Pages)
 */
export function getBasePath() {
  if (typeof window === 'undefined') return '';
  const pathname = window.location.pathname;
  if (pathname.startsWith('/material-ticket-platform')) {
    return '/material-ticket-platform';
  }
  return '';
}

/**
 * Parses current location (pathname, search query params, hash) into route object
 */
export function parseCurrentRoute() {
  if (typeof window === 'undefined') {
    return { tab: 'dashboard', path: '/dashboard', params: {}, rawSearch: '' };
  }

  const basePath = getBasePath();
  let pathname = window.location.pathname;

  // Strip basePath prefix if present
  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length) || '/';
  }

  // Support hash routing fallback if used (e.g. /#/tickets?id=123)
  let hashQuery = '';
  if (window.location.hash && window.location.hash.startsWith('#/')) {
    const hashContent = window.location.hash.slice(1);
    const [hPath, hQuery] = hashContent.split('?');
    pathname = hPath;
    hashQuery = hQuery || '';
  }

  // Normalize path
  const [cleanPathname, pathQuery] = pathname.split('?');
  const normalizedPath = cleanPathname.replace(/\/+$/, '') || '/';

  // Parse search params
  const fullQueryString = pathQuery || hashQuery || (window.location.search ? window.location.search.slice(1) : '');
  const searchParams = new URLSearchParams(fullQueryString);
  const params = {};
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  // Check aliases and match route
  let matchedTab = 'dashboard';
  for (const [key, config] of Object.entries(ROUTES)) {
    if (config.path === normalizedPath || config.aliases.includes(normalizedPath)) {
      matchedTab = config.tab || key;
      break;
    }
  }

  // Handle direct ticket link by subpath /tickets/:id
  if (normalizedPath.startsWith('/tickets/') && normalizedPath !== '/tickets/new') {
    const subId = normalizedPath.replace('/tickets/', '').trim();
    if (subId) {
      matchedTab = 'tickets';
      params.id = subId;
    }
  }

  // Handle new ticket shortcut /new-ticket or /tickets/new
  if (normalizedPath === '/new-ticket' || normalizedPath === '/tickets/new') {
    matchedTab = 'tickets';
    params.new = '1';
  }

  return {
    tab: matchedTab,
    path: normalizedPath,
    params,
    rawSearch: fullQueryString
  };
}

/**
 * Builds full browser URL for a given tab and optional query params
 */
export function buildUrl(targetTabOrPath, params = {}) {
  const basePath = getBasePath();
  let targetPath = '';

  if (typeof targetTabOrPath === 'string') {
    if (targetTabOrPath.startsWith('/')) {
      targetPath = targetTabOrPath;
    } else if (ROUTES[targetTabOrPath]) {
      targetPath = ROUTES[targetTabOrPath].path;
    } else {
      const found = Object.values(ROUTES).find(r => r.tab === targetTabOrPath);
      targetPath = found ? found.path : `/${targetTabOrPath}`;
    }
  } else {
    targetPath = '/dashboard';
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      searchParams.set(k, String(v));
    }
  });

  const queryStr = searchParams.toString();
  return `${basePath}${targetPath}${queryStr ? `?${queryStr}` : ''}`;
}

/**
 * Programmatic SPA navigation with full history integration
 */
export function navigate(target, options = {}) {
  if (typeof window === 'undefined') return;

  const targetUrl = typeof target === 'string'
    ? (target.startsWith('/') ? `${getBasePath()}${target}` : buildUrl(target, options.params))
    : buildUrl(target.tab, target.params);

  // If already at target URL, avoid duplicate push
  const currentFull = `${window.location.pathname}${window.location.search}`;
  if (currentFull !== targetUrl) {
    if (options.replace) {
      window.history.replaceState({ url: targetUrl }, '', targetUrl);
    } else {
      window.history.pushState({ url: targetUrl }, '', targetUrl);
    }
  }

  // Notify router listeners
  window.dispatchEvent(new Event('popstate'));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/**
 * Updates document.title based on current route and active language
 */
export function updatePageTitle(tab, lang = 'ru') {
  if (typeof document === 'undefined') return;
  const config = ROUTES[tab] || Object.values(ROUTES).find(r => r.tab === tab) || ROUTES.dashboard;
  const titles = config.titles || ROUTES.dashboard.titles;
  const title = titles[lang] || titles.ru || titles.en;
  document.title = title;
}

// Router Context for direct consumption
const RouterContext = createContext(null);

export function RouterProvider({ children, lang = 'ru' }) {
  const [route, setRoute] = useState(() => parseCurrentRoute());

  useEffect(() => {
    const handlePopState = () => {
      const newRoute = parseCurrentRoute();
      setRoute(newRoute);
      updatePageTitle(newRoute.tab, lang);
    };

    window.addEventListener('popstate', handlePopState);
    updatePageTitle(route.tab, lang);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [lang, route.tab]);

  const goTo = useCallback((tabOrPath, params = {}, options = {}) => {
    navigate(tabOrPath, { params, ...options });
  }, []);

  return (
    <RouterContext.Provider value={{ route, currentTab: route.tab, params: route.params, navigate: goTo }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    // Fallback if rendered outside RouterProvider
    const r = parseCurrentRoute();
    return {
      route: r,
      currentTab: r.tab,
      params: r.params,
      navigate
    };
  }
  return context;
}

/**
 * Semantic Link component for navigation. Renders <a> tag with href,
 * preserving middle-click, right-click "Open in new tab", and intercepting
 * normal clicks for seamless instant SPA navigation.
 */
export const Link = ({ to, params, children, onClick, className, style, ...rest }) => {
  const href = buildUrl(to, params);

  const handleClick = (e) => {
    if (onClick) onClick(e);
    // Don't intercept if modifier keys are pressed (e.g. Cmd/Ctrl for new tab)
    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      navigate(to, { params });
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      style={{ textDecoration: 'none', color: 'inherit', ...style }}
      {...rest}
    >
      {children}
    </a>
  );
};
