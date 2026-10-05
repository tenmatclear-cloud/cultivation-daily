#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR =
  process.env.CONTENT_DIR ||
  "/home/box/cultivation-daily/content";
const OUT = path.join(__dirname, "dist");
const BASE = (process.env.BASE_PATH || "").replace(/\/$/, "");

function href(p) {
  const clean = p.startsWith("/") ? p : `/${p}`;
  return `${BASE}${clean}` || clean;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) return { meta: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return { meta: {}, body: raw };
  const fm = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\n/, "");
  const meta = {};
  for (const line of fm.split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  return { meta, body };
}

function listDates() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .filter((d) => {
      const dir = path.join(CONTENT_DIR, d);
      return (
        fs.existsSync(path.join(dir, "prince.md")) &&
        fs.existsSync(path.join(dir, "fox.md"))
      );
    })
    .sort()
    .reverse();
}

function publishArticleImages(date) {
  const dir = path.join(CONTENT_DIR, date);
  let names;
  try {
    names = fs.readdirSync(dir);
  } catch {
    return;
  }
  for (const name of names) {
    if (!/\.(?:jpe?g|png|gif|webp)$/i.test(name)) continue;
    const destDir = path.join(OUT, "media", date);
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(path.join(dir, name), path.join(destDir, name));
  }
}

function decodeAttr(value) {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function placeImages(html, date) {
  return html.replace(
    /(<img\b[^>]*\bsrc=")([^"]+)(")/g,
    (match, open, src, close) => {
      if (/^(?:https?:|data:|\/)/.test(src)) return match;
      const name = path.basename(decodeAttr(src));
      if (!name || !fs.existsSync(path.join(CONTENT_DIR, date, name))) return match;
      return `${open}${href(`/media/${date}/${name}`)}${close}`;
    }
  );
}

function warnFigure(date, message) {
  console.warn(`[figures] ${date}: ${message}`);
}

function paragraphPlainText(innerHtml) {
  const decoded = decodeAttr(
    String(innerHtml)
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, "")
  );
  return decoded.replace(/\[\^[^\]]+\]/g, "").replace(/\s+/g, " ").trim();
}

function princeProseEnd(html) {
  const re = /<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/gi;
  let match;
  while ((match = re.exec(html))) {
    const text = paragraphPlainText(match[0]);
    if (/註腳|注腳|參考文獻|footnotes?/i.test(text)) return match.index;
  }
  return html.length;
}

function figureLabel(figure, index) {
  if (figure && typeof figure.file === "string" && figure.file.trim()) {
    return figure.file.trim();
  }
  return `figure ${index + 1}`;
}

function loadFigures(date) {
  const file = path.join(CONTENT_DIR, date, "figures.json");
  if (!fs.existsSync(file)) return null;
  let data;
  try {
    const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
    data = JSON.parse(raw);
  } catch (err) {
    warnFigure(date, `figures.json is not valid JSON; skipping the file (${err.message})`);
    return null;
  }
  if (!data || typeof data !== "object" || Array.isArray(data) || !Array.isArray(data.figures)) {
    warnFigure(date, "figures.json must contain a figures array; skipping the file");
    return null;
  }
  if ("date" in data && data.date !== date) {
    warnFigure(
      date,
      `date ${JSON.stringify(data.date)} does not match folder ${date}`
    );
  }
  return data.figures;
}

function resolveAlign(date, label, align) {
  if (align == null || align === "") return "right";
  if (align === "left" || align === "right") return align;
  warnFigure(
    date,
    `"${label}" align ${JSON.stringify(align)} is not left or right; using right`
  );
  return "right";
}

function resolveWidth(date, label, width) {
  if (width == null || width === "") return "66%";
  const text = String(width).trim();
  const match = text.match(/^(\d+(?:\.\d+)?)%$/);
  const size = match ? Number(match[1]) : NaN;
  if (!match || size < 40 || size > 100) {
    warnFigure(
      date,
      `"${label}" width ${JSON.stringify(width)} is not a percentage from 40% to 100%; using 66%`
    );
    return "66%";
  }
  return `${match[1]}%`;
}

function issueImageName(file) {
  if (typeof file !== "string") return "";
  const name = file.trim();
  if (!name || name !== path.basename(name) || name === "." || name === "..") return "";
  if (!/\.(?:jpe?g|png|gif|webp)$/i.test(name)) return "";
  return name;
}

function insertPrinceFigures(html, date) {
  const figures = loadFigures(date);
  if (!figures) return html;

  const regionEnd = princeProseEnd(html);
  const paragraphs = [];
  const re = /<p\b[^>]*>[\s\S]*?<\/p>/g;
  let match;
  while ((match = re.exec(html.slice(0, regionEnd)))) {
    const inner = match[0].replace(/^<p\b[^>]*>/i, "").replace(/<\/p>$/i, "");
    paragraphs.push({
      end: match.index + match[0].length,
      text: paragraphPlainText(inner),
    });
  }

  const insertions = [];
  figures.forEach((figure, index) => {
    const label = figureLabel(figure, index);
    if (!figure || typeof figure !== "object" || Array.isArray(figure)) {
      warnFigure(date, `skip ${label}: not a figure object`);
      return;
    }
    const after =
      typeof figure.after === "string"
        ? figure.after.replace(/\s+/g, " ").trim()
        : "";
    if (after.length < 8) {
      warnFigure(date, `skip "${label}": after is missing or shorter than 8 characters`);
      return;
    }
    const name = issueImageName(figure.file);
    const imagePath = name ? path.join(CONTENT_DIR, date, name) : "";
    if (!name || !fs.existsSync(imagePath)) {
      warnFigure(date, `skip "${label}": image file not found`);
      return;
    }
    const hits = paragraphs.filter((paragraph) => paragraph.text.startsWith(after));
    if (hits.length === 0) {
      warnFigure(date, `skip "${label}": after "${after}" matches no prince paragraph`);
      return;
    }
    if (hits.length > 1) {
      warnFigure(
        date,
        `skip "${label}": after "${after}" matches ${hits.length} prince paragraphs`
      );
      return;
    }
    const align = resolveAlign(date, label, figure.align);
    const width = resolveWidth(date, label, figure.width);
    const tag = `<img class="figure float-${align}" src="${escapeHtml(name)}" alt="" style="--figure-width: ${width}">`;
    insertions.push({ at: hits[0].end, html: `\n${tag}\n`, order: index });
  });

  insertions.sort((a, b) => b.at - a.at || b.order - a.order);
  let out = html;
  for (const insertion of insertions) {
    out = out.slice(0, insertion.at) + insertion.html + out.slice(insertion.at);
  }
  return out;
}

const articleCache = new Map();

function readArticle(date, file) {
  const key = `${date}/${file}`;
  const cached = articleCache.get(key);
  if (cached) return cached;
  const raw = fs.readFileSync(path.join(CONTENT_DIR, date, file), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  let html = marked.parse(body);
  if (file === "prince.md") html = insertPrinceFigures(html, date);
  const article = { meta, html: placeImages(html, date) };
  articleCache.set(key, article);
  return article;
}

function readProposition(week) {
  const id = String(week || "").trim();
  if (!/^\d{4}-W\d{2}$/.test(id)) return "";
  const file = path.join(CONTENT_DIR, "_themes", `${id}.json`);
  if (!fs.existsSync(file)) return "";
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return "";
  }
  if (!data || typeof data.proposition !== "string") return "";
  return data.proposition.trim();
}

function layout({ title, body }) {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC&family=Noto+Serif+TC:wght@500;600;700&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="${href("/styles.css")}"/>
</head>
<body>
<div class="read-progress" aria-hidden="true"></div>
<header class="masthead">
  <div class="inner">
    <h1 class="logo"><a href="${href("/")}">B612Daily</a></h1>
    <a class="masthead-link" href="${href("/archive.html")}">過往</a>
  </div>
</header>
<main class="inner">
${body}
</main>
<footer class="site-foot inner">
  <p>© 2026 TenmaWong Studio. SeeThinkMake</p>
</footer>
<script>
(function () {
  var bar = document.querySelector(".read-progress");
  if (!bar) return;
  var ticking = false;
  function paint() {
    ticking = false;
    var root = document.documentElement;
    var max = root.scrollHeight - root.clientHeight;
    var ratio = max > 0 ? root.scrollTop / max : 0;
    bar.style.transform = "scaleY(" + ratio + ")";
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(paint);
  }
  paint();
  document.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
})();
</script>
</body>
</html>`;
}

function articlePage(date, prince, fox, title) {
  const proposition = readProposition(prince.meta.week);
  const theme = (prince.meta.theme || "").trim();
  const themeHtml = theme
    ? `<p class="theme">${escapeHtml(theme)}</p>\n`
    : "";
  const propositionHtml = proposition
    ? `<p class="proposition"><span class="proposition-label">本週命題</span>${escapeHtml(proposition)}</p>\n`
    : "";
  return layout({
    title,
    body: `<p class="issue-date">${escapeHtml(date)}</p>
${propositionHtml}<article class="essay">
  <header>
    <p class="eyebrow">第一欄 · 小王子</p>
    ${themeHtml}<h2>${escapeHtml(prince.meta.title || "（無標題）")}</h2>
  </header>
  <div class="prose">${prince.html}</div>
</article>
<details class="fox-fold">
  <summary>揭開第二欄</summary>
  <article class="essay">
    <header>
      <p class="eyebrow">第二欄 · 狐狸</p>
      <h2>${escapeHtml(fox.meta.title || "（無標題）")}</h2>
    </header>
    <div class="prose">${fox.html}</div>
  </article>
</details>`,
  });
}

function archivePage(dates) {
  return layout({
    title: "過往｜B612Daily",
    body: `<h2 class="page-title">過往刊號</h2>
<ul class="archive-list">
${dates.map((d) => `<li><a href="${href(`/day/${d}.html`)}">${escapeHtml(d)}</a></li>`).join("\n")}
</ul>`,
  });
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "day"), { recursive: true });

const dates = listDates();
if (!dates.length) {
  console.error("No complete dates in", CONTENT_DIR);
  process.exit(1);
}

const css = fs.readFileSync(path.join(__dirname, "styles.css"), "utf8");
fs.writeFileSync(path.join(OUT, "styles.css"), css);

for (const date of dates) {
  publishArticleImages(date);
  const prince = readArticle(date, "prince.md");
  const fox = readArticle(date, "fox.md");
  fs.writeFileSync(
    path.join(OUT, "day", `${date}.html`),
    articlePage(date, prince, fox, `${date}｜B612Daily`)
  );
}

const latest = dates[0];
const prince = readArticle(latest, "prince.md");
const fox = readArticle(latest, "fox.md");
const indexHtml = articlePage(latest, prince, fox, "B612Daily");
fs.writeFileSync(path.join(OUT, "index.html"), indexHtml);
fs.writeFileSync(path.join(OUT, "archive.html"), archivePage(dates));

// For GitHub project Pages: also write 404 → index
fs.writeFileSync(path.join(OUT, "404.html"), indexHtml);

console.log(`Built ${dates.length} issue(s). Latest: ${latest}`);
console.log(`Out: ${OUT}`);
