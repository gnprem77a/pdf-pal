import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Store scroll positions for each route
const scrollPositions: Record<string, number> = {};

const ScrollRestoration = () => {
  const location = useLocation();

  useEffect(() => {
    // Save current scroll position before navigating away
    const saveScrollPosition = () => {
      scrollPositions[location.key] = window.scrollY;
    };

    // Restore scroll position or scroll to top for new pages
    const restoreScrollPosition = () => {
      const savedPosition = scrollPositions[location.key];
      
      if (savedPosition !== undefined) {
        // Restore previous position (going back)
        window.scrollTo(0, savedPosition);
      } else {
        // New page, scroll to top
        window.scrollTo(0, 0);
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(restoreScrollPosition, 0);

    // Save position before leaving
    window.addEventListener("beforeunload", saveScrollPosition);

    return () => {
      clearTimeout(timeoutId);
      saveScrollPosition();
      window.removeEventListener("beforeunload", saveScrollPosition);
    };
  }, [location.key]);

  return null;
};

export default ScrollRestoration;
