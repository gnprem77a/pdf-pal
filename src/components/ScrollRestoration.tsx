import { useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Persist scroll positions by URL so Back/Forward reliably restores the last
// position even if React Router creates a new `location.key`.
const scrollPositions = new Map<string, number>();

const getScrollKey = (loc: { pathname: string; search: string; hash: string }) =>
  `${loc.pathname}${loc.search}${loc.hash}`;

const scrollToInstant = (top: number) => {
  // If the app/theme sets CSS `scroll-behavior: smooth`, programmatic scrolls
  // can animate. Temporarily force auto (with !important) to avoid any visible motion.
  const html = document.documentElement;
  const body = document.body;

  const prevHtml = html.style.getPropertyValue("scroll-behavior");
  const prevBody = body.style.getPropertyValue("scroll-behavior");

  html.style.setProperty("scroll-behavior", "auto", "important");
  body.style.setProperty("scroll-behavior", "auto", "important");

  // Use the simplest API to avoid any UA behavior differences.
  window.scrollTo(0, top);

  // Some browsers use `scrollingElement`.
  if (document.scrollingElement) document.scrollingElement.scrollTop = top;

  // Restore styles after the scroll has been applied.
  requestAnimationFrame(() => {
    if (prevHtml) html.style.setProperty("scroll-behavior", prevHtml);
    else html.style.removeProperty("scroll-behavior");

    if (prevBody) body.style.setProperty("scroll-behavior", prevBody);
    else body.style.removeProperty("scroll-behavior");
  });
};

const ScrollRestoration = () => {
  const location = useLocation();
  const navigationType = useNavigationType(); // POP when using back/forward

  useEffect(() => {
    // Prevent the browser from doing its own scroll restoration (which can look
    // like a small animated scroll when combined with CSS smooth scrolling).
    const prev = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = prev;
    };
  }, []);

  useLayoutEffect(() => {
    const key = getScrollKey(location);

    // Save position for the current page on cleanup (i.e., before we leave it)
    return () => {
      scrollPositions.set(key, window.scrollY);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, location.hash]);

  useLayoutEffect(() => {
    const key = getScrollKey(location);
    const savedY = scrollPositions.get(key);

    // Wait for layout/paint; some pages change height after mount.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (navigationType === "POP" && typeof savedY === "number") {
          scrollToInstant(savedY);
          return;
        }
        scrollToInstant(0);
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [location.pathname, location.search, location.hash, navigationType]);

  return null;
};

export default ScrollRestoration;
