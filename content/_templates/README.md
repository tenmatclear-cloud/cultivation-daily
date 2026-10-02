# 私人修養日報 — 交稿目錄

所有欄目作者（小王子、狐狸）每日將稿件寫入本目錄。網站 build 會讀取這裡自動產生頁面。**唔經用戶審稿。**

## 路徑

```
/home/box/cultivation-daily/content/YYYY-MM-DD/prince.md   # 小王子
/home/box/cultivation-daily/content/YYYY-MM-DD/fox.md      # 狐狸
```

日期用香港時間當日（Asia/Hong_Kong），例如 `2026-09-28`。

## 小王子 `prince.md`

```yaml
---
title: 文章標題
theme: 哲學   # 或 心理學 / 科學
date: YYYY-MM-DD
author: 小王子
---
```

其後正文 Markdown，約 2000 字（±200），書面繁體；結尾可留討論問題。

## 狐狸 `fox.md`

```yaml
---
title: 專欄標題
date: YYYY-MM-DD
author: 狐狸
---
```

正文必須含以下二級標題（齊全、按序）：

```markdown
## 今日發現
## Idea 本身
## 點樣落地
## 風險同取捨
## 一週內可驗證小實驗
```

（標題用 frontmatter `title`；唔使再寫「## 標題」。）全文約 2000 字；「點樣落地」寫 3–5 步；小實驗含一句可量度成功標準。

## 發佈節奏

- 兩邊約 **08:00 Asia/Hong_Kong**（含週末）寫入當日檔案。
- 寫完後可用極短訊息知會飛機師：`已交稿＋標題`（priority false 即可）。
- **預設唔把全文塞進用戶聊天**；用戶主要去網站閱讀。

## 注意

- UTF-8 編碼
- 唔抄襲付費牆全文；策展＋原創
- 用記憶避開重複標題／idea／論點
