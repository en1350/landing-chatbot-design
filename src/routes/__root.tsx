import type {ReactNode} from "react";
import {HeadContent, Outlet, Scripts, createRootRoute} from "@tanstack/react-router";
import {Toaster} from "@/components/ui/toaster";
import {Toaster as Sonner} from "@/components/ui/sonner";
import {TooltipProvider} from "@/components/ui/tooltip";
import {PLATFORM_META, PLATFORM_SCRIPTS} from "@/platform/scripts.gen";
import {HMR_CLIENT} from "@/platform/dev-hmr";
import appCss from "@/index.css?url";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {useState} from "react";
import NotFound from "@/pages/NotFound";
import VisitTracker from "@/components/VisitTracker";
import ScrollToTop from "@/components/ScrollToTop";
import {UsageProvider} from "@/context/UsageContext";
import {AuthProvider} from "@/context/AuthContext";

const TITLE = "УрокАИ — ИИ-помощник для педагогов";
const DESCRIPTION =
    "УрокАИ — искусственный интеллект, который помогает учителям готовить планы уроков, игры, самоанализ и оценивание за минуты. Плюс интерактивные тренажёры для учеников.";
const OG_DESCRIPTION = "ИИ готовит планы уроков, игры, самоанализ и оценивание за минуты. Плюс интерактивные тренажёры для учеников.";
const OG_IMAGE = "https://cdn.poehali.dev/projects/***/files/4f0fb8d2-79e1-48c8-bb5c-7b2719a7a367.jpg";
const FAVICON = "https://cdn.poehali.dev/projects/***/files/favicon-1784132787772.png";

const TOP_MAIL_RU = `var _tmr = window._tmr || (window._tmr = []);
_tmr.push({id: "3784935", type: "pageView", start: (new Date()).getTime()});
(function (d, w, id) {
  if (d.getElementById(id)) return;
  var ts = d.createElement("script"); ts.type = "text/javascript"; ts.async = true; ts.id = id;
  ts.src = "https://top-fwz1.mail.ru/js/code.js";
  var f = function () { var s = d.getElementsByTagName("script")[0]; s.parentNode.insertBefore(ts, s); };
  if (w.opera == "[object Opera]") { d.addEventListener("DOMContentLoaded", f, false); } else { f(); }
})(document, window, "tmr-code");`;

const YM_OPT_OUT = `(function () {
  var KEY = "ym_opt_out";
  var IDS = [113679744, 101026698];
  var msg = "";
  try {
    var q = new URLSearchParams(location.search);
    if (q.get("ym_off") === "1") { localStorage.setItem(KEY, "1"); msg = "Яндекс.Метрика отключена в этом браузере. Ваши визиты больше не учитываются."; }
    if (q.get("ym_on") === "1") { localStorage.removeItem(KEY); msg = "Яндекс.Метрика снова включена в этом браузере."; }
    if (msg) {
      q.delete("ym_off"); q.delete("ym_on");
      var qs = q.toString();
      history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
      setTimeout(function () { alert(msg); }, 300);
    }
    if (localStorage.getItem(KEY) === "1") {
      IDS.forEach(function (id) { window["disableYaCounter" + id] = true; });
      window.ym = function () {};
    }
  } catch (e) {}
})();`;

const YM_1 = `(function(m,e,t,r,i,k,a){
  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=113679744', 'ym');
ym(113679744, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`;

const YM_2 = `(function (m, e, t, r, i, k, a) {
  m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments) };
  m[i].l = 1 * new Date();
  for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
  k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
})(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
ym(101026698, "init", { trustedDomains: ["poehali.dev"], clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true, trackHash: true });`;

export const Route = createRootRoute({
    head: () => ({
        meta: [
            {charSet: "utf-8"},
            {name: "viewport", content: "width=device-width, initial-scale=1.0"},
            {title: TITLE},
            {name: "description", content: DESCRIPTION},
            {name: "keywords", content: "УрокАИ, ИИ для учителей, план урока, конструктор уроков, образовательные тренажёры, методист, педагог"},
            {name: "author", content: "УрокАИ"},
            {property: "og:type", content: "website"},
            {property: "og:locale", content: "ru_RU"},
            {property: "og:site_name", content: "УрокАИ"},
            {property: "og:title", content: TITLE},
            {property: "og:description", content: OG_DESCRIPTION},
            {property: "og:image:width", content: "1024"},
            {property: "og:image:height", content: "1024"},
            {property: "og:image", content: OG_IMAGE},
            {name: "twitter:card", content: "summary_large_image"},
            {name: "twitter:title", content: TITLE},
            {name: "twitter:description", content: "ИИ готовит планы уроков, игры, самоанализ и оценивание за минуты."},
            {name: "twitter:image", content: OG_IMAGE},
            ...PLATFORM_META,
        ],
        links: [
            {rel: "stylesheet", href: appCss},
            {rel: "icon", type: "image/png", href: FAVICON},
            {rel: "preconnect", href: "https://fonts.googleapis.com"},
            {rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous"},
            {
                rel: "stylesheet",
                href: "https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800&family=Merriweather:ital,wght@0,400;0,700;0,900;1,400&display=swap",
            },
        ],
        // IMPORTANT: DO NOT REMOVE PLATFORM SCRIPTS AND THE DEV HMR CLIENT!
        scripts: [
            ...(import.meta.env.DEV ? [{children: HMR_CLIENT}] : []),
            ...PLATFORM_SCRIPTS,
            {children: TOP_MAIL_RU},
            {children: YM_OPT_OUT},
            {children: YM_1},
            {children: YM_2},
        ],
    }),
    component: RootComponent,
    notFoundComponent: NotFound,
});

function RootComponent() {
    const [queryClient] = useState(() => new QueryClient());
    return (
        <RootDocument>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <UsageProvider>
                        <TooltipProvider>
                            <Toaster/>
                            <Sonner/>
                            <ScrollToTop/>
                            <VisitTracker/>
                            <Outlet/>
                        </TooltipProvider>
                    </UsageProvider>
                </AuthProvider>
            </QueryClientProvider>
        </RootDocument>
    );
}

function RootDocument({children}: { children: ReactNode }) {
    return (
        <html lang="ru">
        <head>
            <HeadContent/>
        </head>
        <body>
        {children}
        <Scripts/>
        </body>
        </html>
    );
}
