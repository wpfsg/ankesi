import { createContext, useContext, useEffect } from "react";
import { LANGS, type Lang } from "../i18n";
import { absoluteUrl, assetUrl } from "./site";
import { switchLang } from "./routes";

export interface HeadData {
  /** Page title without the site name. */
  title: string;
  description: string;
  /** App path including the language prefix, e.g. "/ka/spots/lisi". */
  path: string;
  lang: Lang;
  /** Open Graph image path relative to the site root, e.g. "og/ka/lisi.png". */
  image?: string;
  type?: "website" | "article";
  jsonLd?: object[];
  noindex?: boolean;
}

export interface HeadCollector {
  current: HeadData | null;
}

const HeadContext = createContext<HeadCollector | null>(null);
export const HeadProvider = HeadContext.Provider;

const SITE_NAME = "ანკესი · Ankesi";
const OG_LOCALE: Record<Lang, string> = { ka: "ka_GE", en: "en_GB" };

export function fullTitle(h: HeadData): string {
  return `${h.title} · ${h.lang === "ka" ? "ანკესი" : "Ankesi"}`;
}

/** Declares the document head for a page. The server collects it; the
 *  browser applies it to the live document after each navigation. */
export function Head(props: HeadData) {
  const collector = useContext(HeadContext);
  if (collector) collector.current = props;
  const json = JSON.stringify(props.jsonLd ?? []);
  useEffect(() => {
    applyHead(props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.title,
    props.description,
    props.path,
    props.lang,
    props.image,
    props.type,
    props.noindex,
    json,
  ]);
  return null;
}

interface Tag {
  tag: "meta" | "link" | "script";
  attrs: Record<string, string>;
  text?: string;
}

function tags(h: HeadData): Tag[] {
  const url = absoluteUrl(h.path);
  const image = assetUrl(h.image ?? `og/${h.lang}/default.png`);
  const out: Tag[] = [
    { tag: "meta", attrs: { name: "description", content: h.description } },
    { tag: "link", attrs: { rel: "canonical", href: url } },
    ...LANGS.map((l) => ({
      tag: "link" as const,
      attrs: {
        rel: "alternate",
        hreflang: l,
        href: absoluteUrl(switchLang(h.path, l)),
      },
    })),
    {
      tag: "link",
      attrs: {
        rel: "alternate",
        hreflang: "x-default",
        href: absoluteUrl(switchLang(h.path, "ka")),
      },
    },
    { tag: "meta", attrs: { property: "og:site_name", content: SITE_NAME } },
    {
      tag: "meta",
      attrs: { property: "og:type", content: h.type ?? "website" },
    },
    { tag: "meta", attrs: { property: "og:title", content: h.title } },
    {
      tag: "meta",
      attrs: { property: "og:description", content: h.description },
    },
    { tag: "meta", attrs: { property: "og:url", content: url } },
    { tag: "meta", attrs: { property: "og:image", content: image } },
    { tag: "meta", attrs: { property: "og:image:width", content: "1200" } },
    { tag: "meta", attrs: { property: "og:image:height", content: "630" } },
    {
      tag: "meta",
      attrs: { property: "og:locale", content: OG_LOCALE[h.lang] },
    },
    ...LANGS.filter((l) => l !== h.lang).map((l) => ({
      tag: "meta" as const,
      attrs: { property: "og:locale:alternate", content: OG_LOCALE[l] },
    })),
    {
      tag: "meta",
      attrs: { name: "twitter:card", content: "summary_large_image" },
    },
    { tag: "meta", attrs: { name: "twitter:title", content: h.title } },
    {
      tag: "meta",
      attrs: { name: "twitter:description", content: h.description },
    },
    { tag: "meta", attrs: { name: "twitter:image", content: image } },
  ];
  if (h.noindex)
    out.push({
      tag: "meta",
      attrs: { name: "robots", content: "noindex, follow" },
    });
  for (const ld of h.jsonLd ?? []) {
    out.push({
      tag: "script",
      attrs: { type: "application/ld+json" },
      text: JSON.stringify(ld),
    });
  }
  return out;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/** Head markup for the prerenderer. Every tag carries data-head so the
 *  client can replace the set on navigation. */
export function renderHeadTags(h: HeadData): string {
  const lines = [`<title>${escapeAttr(fullTitle(h))}</title>`];
  for (const t of tags(h)) {
    const attrs = Object.entries(t.attrs)
      .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
      .join(" ");
    if (t.tag === "script")
      lines.push(
        `<script ${attrs} data-head>${(t.text ?? "").replace(/</g, "\\u003c")}</script>`,
      );
    else lines.push(`<${t.tag} ${attrs} data-head>`);
  }
  return lines.join("\n    ");
}

/** Replace the managed head tags in the live document. */
export function applyHead(h: HeadData) {
  if (typeof document === "undefined") return;
  document.title = fullTitle(h);
  document.head.querySelectorAll("[data-head]").forEach((el) => el.remove());
  // The template ships a static description; drop it so there is one.
  document.head
    .querySelector('meta[name="description"]:not([data-head])')
    ?.remove();
  const frag = document.createDocumentFragment();
  for (const t of tags(h)) {
    const el = document.createElement(t.tag);
    for (const [k, v] of Object.entries(t.attrs)) el.setAttribute(k, v);
    if (t.text) el.textContent = t.text;
    el.setAttribute("data-head", "");
    frag.appendChild(el);
  }
  document.head.appendChild(frag);
}
