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

function readArticle(date, file) {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, date, file), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  return { meta, html: marked.parse(body) };
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
