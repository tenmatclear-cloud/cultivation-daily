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

function layout({ title, body, activeDate }) {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<link rel="stylesheet" href="${href("/styles.css")}"/>
</head>
<body>
<header class="masthead">
  <div class="inner">
    <p class="kicker">Private Cultivation Daily</p>
    <h1 class="logo"><a href="${href("/")}">私人修養日報</a></h1>
    <p class="tagline">兩欄・每日自動上線・唔經審稿</p>
  </div>
</header>
<main class="inner">
${body}
</main>
<footer class="site-foot inner">
  <p>小王子 · 狐狸　｜　出稿約 08:00（香港時間）</p>
</footer>
</body>
</html>`;
}

function dayPage(date, prince, fox) {
  return layout({
    title: `${date}｜私人修養日報`,
    activeDate: date,
    body: `
<nav class="crumb"><a href="${href("/")}">今日</a> · <a href="${href("/archive.html")}">過往</a> · <span>${date}</span></nav>
<div class="columns">
  <article class="col prince">
    <header>
      <p class="col-label">第一欄 · 小王子</p>
      <p class="theme">${prince.meta.theme || ""}</p>
      <h2>${prince.meta.title || "（無標題）"}</h2>
    </header>
    <div class="prose">${prince.html}</div>
  </article>
  <article class="col fox">
    <header>
      <p class="col-label">第二欄 · 狐狸</p>
      <h2>${fox.meta.title || "（無標題）"}</h2>
    </header>
    <div class="prose">${fox.html}</div>
  </article>
</div>`,
  });
}

function indexPage(latest, prince, fox, dates) {
  const others = dates.filter((d) => d !== latest).slice(0, 7);
  return layout({
    title: "私人修養日報",
    activeDate: latest,
    body: `
<p class="issue-date">今日／最新　<strong>${latest}</strong></p>
<div class="columns">
  <article class="col prince">
    <header>
      <p class="col-label">第一欄 · 小王子</p>
      <p class="theme">${prince.meta.theme || ""}</p>
      <h2>${prince.meta.title || ""}</h2>
    </header>
    <div class="prose">${prince.html}</div>
  </article>
  <article class="col fox">
    <header>
      <p class="col-label">第二欄 · 狐狸</p>
      <h2>${fox.meta.title || ""}</h2>
    </header>
    <div class="prose">${fox.html}</div>
  </article>
</div>
${
  others.length
    ? `<section class="recent"><h3>最近幾期</h3><ul>${others
        .map((d) => `<li><a href="${href(`/day/${d}.html`)}">${d}</a></li>`)
        .join("")}</ul><p><a href="${href("/archive.html")}">全部過往 →</a></p></section>`
    : ""
}`,
  });
}

function archivePage(dates) {
  return layout({
    title: "過往｜私人修養日報",
    body: `
<nav class="crumb"><a href="${href("/")}">今日</a> · <span>過往</span></nav>
<h2 class="page-title">過往刊號</h2>
<ul class="archive-list">
${dates.map((d) => `<li><a href="${href(`/day/${d}.html`)}">${d}</a></li>`).join("\n")}
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
  fs.writeFileSync(path.join(OUT, "day", `${date}.html`), dayPage(date, prince, fox));
}

const latest = dates[0];
const prince = readArticle(latest, "prince.md");
const fox = readArticle(latest, "fox.md");
fs.writeFileSync(path.join(OUT, "index.html"), indexPage(latest, prince, fox, dates));
fs.writeFileSync(path.join(OUT, "archive.html"), archivePage(dates));

// For GitHub project Pages: also write 404 → index
fs.writeFileSync(path.join(OUT, "404.html"), indexPage(latest, prince, fox, dates));

console.log(`Built ${dates.length} issue(s). Latest: ${latest}`);
console.log(`Out: ${OUT}`);
