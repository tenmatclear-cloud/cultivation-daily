# 私人修養日報 — 交稿目錄

作者（小王子、狐狸）每日交稿 → **地理學家**最多兩輪編審 → 過關後飛機師同步上站。

## 路徑

```
/home/box/cultivation-daily/content/YYYY-MM-DD/prince.md      # 小王子
/home/box/cultivation-daily/content/YYYY-MM-DD/fox.md         # 狐狸
/home/box/cultivation-daily/content/YYYY-MM-DD/editorial.json # 總編閘（必須）
```

日期用香港時間當日（Asia/Hong_Kong）。

## 小王子 `prince.md`

```yaml
---
title: 文章標題
theme: 哲學   # 或 心理學 / 科學
date: YYYY-MM-DD
author: 小王子
---
```

約 2000 字（±200），香港書面繁體；建議自備可核實來源。

## 狐狸 `fox.md`

```yaml
---
title: 專欄標題
date: YYYY-MM-DD
author: 狐狸
---
```

正文二級標題按序齊全：

```markdown
## 今日發現
## Idea 本身
## 點樣落地
## 風險同取捨
## 一週內可驗證小實驗
```

## 編審閘 `editorial.json`

由**地理學家**寫入。同步只喺：

- 檔案存在
- `"status": "pass"`
- `prince.pass` 與 `fox.pass` 皆為 `true`

`status` 取值：

| status | 含義 |
|--------|------|
| `pass` | 可上站 |
| `revise` | 首輪退稿，等作者改（唔推站、通常未通知用戶） |
| `fail` | 再審仍不過／逾時未改 → 今日唔上站，留第二日（通知用戶） |

範例（退稿）：

```json
{
  "date": "YYYY-MM-DD",
  "status": "revise",
  "round": 1,
  "prince": { "pass": true, "notes": "OK" },
  "fox": { "pass": false, "notes": "1) 補來源 2) 收斂口語" },
  "reviewed_by": "地理學家",
  "reviewed_at": "2026-10-03T08:12:00+08:00"
}
```

退稿時地理學家 priority 交返作者；作者改完覆寫 md，priority 回「已改稿」。當日最多兩輪。

## 時間鏈（Asia/Hong_Kong，含週末）

1. ~07:53 小王子出稿  
2. ~08:00 狐狸出稿  
3. ~08:10 地理學家首輪編審（不過 → revise＋退稿改稿）  
4. ~08:15 飛機師隊伍晨檢  
5. ~08:22 地理學家再審兜底（或收到「已改稿」即審）  
6. ~08:35 飛機師同步（**僅 status=pass**）→ GitHub Pages  

## 通知

- 過關＋同步成功：預設唔打擾用戶  
- 首輪退稿：只找作者（＋飛機師），唔打擾用戶  
- 再審不過／逾時仍 revise／同步失敗：通知用戶  

## 注意

- UTF-8；作者唔自行推 GitHub  
- 唔抄襲付費牆；用記憶避重複  

## 公開閱讀

https://tenmatclear-cloud.github.io/cultivation-daily/
