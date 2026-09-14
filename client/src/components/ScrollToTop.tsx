import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * React Router doesn't reset scroll position on navigation by default —
 * the browser just keeps whatever scroll offset it had, so navigating from
 * the bottom of one page to another page lands you looking at that same
 * scroll offset on the new page (often its footer) instead of the top.
 * Mounted once near the root, below the Router.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
