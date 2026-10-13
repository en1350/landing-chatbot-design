import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { adminPost } from "@/lib/adminApi";

const VISITOR_KEY = "urokai_visitor_id";

const getVisitorId = () => {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
};

const VisitTracker = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    let ref = "";
    try {
      if (document.referrer) {
        const host = new URL(document.referrer).hostname;
        if (host !== window.location.hostname) ref = host;
      }
    } catch {
      ref = "";
    }
    adminPost("track", { visitor_id: getVisitorId(), path: pathname, referrer: ref }).catch(() => {});
  }, [pathname]);

  return null;
};

export default VisitTracker;
