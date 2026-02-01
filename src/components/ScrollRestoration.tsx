import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Persist scroll positions by URL so Back/Forward reliably restores the last
// position even if React Router creates a new `location.key`.
const scrollPositions = new Map<string, number>();

const getScrollKey = (loc: { pathname: string; search: string; hash: string }) =>
  `${loc.pathname}${loc.search}${loc.hash}`;

const scrollToInstant = (top: number) => {
  // If the app/theme sets CSS `scroll-behavior: smooth`, programmatic scrolls
  // may animate. Temporarily force auto to avoid visible scrolling.
  const root = document.documentElement;
  const prev = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollTo({ top, left: 0, behavior: "auto" });
  requestAnimationFrame(() => {
    root.style.scrollBehavior = prev;
  });
};

const ScrollRestoration = () => {
  const location = useLocation();
  const navigationType = useNavigationType(); // POP when using back/forward

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
