declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

export const META_PIXEL_ID = "1358861453059805";

export function initMetaPixel() {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/admin")) return;
  if (window.fbq) return;

  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    "script",
    "https://connect.facebook.net/en_US/fbevents.js"
  );

  if (window.fbq) {
    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
  }
}

export function trackMetaPageView() {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/admin")) return;

  if (typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  } else {
    initMetaPixel();
  }
}

export function trackMetaEvent(event: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/admin")) return;

  if (typeof window.fbq === "function") {
    if (params) {
      window.fbq("track", event, params);
    } else {
      window.fbq("track", event);
    }
  }
}
