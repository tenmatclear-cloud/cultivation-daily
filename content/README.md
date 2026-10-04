# B612Daily — 交稿目錄

公開名 **B612Daily**。作者交稿 → 地理學家最多兩輪編審 → 過關後同步上站。

## 路徑

```
/home/box/cultivation-daily/content/_themes/YYYY-Www.json   # 本週主題卡
/home/box/cultivation-daily/content/YYYY-MM-DD/prince.md
/home/box/cultivation-daily/content/YYYY-MM-DD/fox.md
/home/box/cultivation-daily/content/YYYY-MM-DD/editorial.json
```

日期／週次用 Asia/Hong_Kong。`YYYY-Www` 為 ISO 週（例：2026-W40）。

## 本週主題卡（地理學家）

每週日約 **20:08 HKT** 寫入 `_themes/YYYY-Www.json`：一句命題＋哲學／心理學／科學三角度。`status`：`proposed` →（用戶未否決）當週使用；用戶否決則改寫。小王子跟主題寫；**狐狸唔定題**。

範本見 `_templates/theme.json`。

## 小王子 `prince.md`

```yaml
---
title: 文章標題
theme: 哲學   # 或 心理學 / 科學（須對應主題卡其中一角）
week: YYYY-Www
date: YYYY-MM-DD
author: 小王子
---
```

約 2000 字（±200）；寫前讀當週主題卡；香港書面繁體；自備可核實來源。

## 狐狸 `fox.md`

```yaml
---
title: 專欄標題
date: YYYY-MM-DD
author: 狐狸
prince_ref: 當日小王子標題或一句論點摘要
correspondence: match | blank   # match=對應驗證／應用；blank=對應空白＋鄰近可證 idea
---
```

**寫前必讀**當日 `prince.md`。對應＝真實工具／論文／產品／做法，用來驗證或應用當日論點；搵唔到就老實寫「對應空白」＋鄰近可驗證 idea，**禁止硬掰**。

**取消固定六段。** 敘事結構自由。軟檢查項（編審用，缺一可退稿）：

1. 至少一個可點開嘅真實來源（URL／DOI／可定位文獻），來源必須對得上論點  
2. 至少一個可執行下一步  
3. 風險或取捨（可短）  
4. 同當日小王子呼應，或誠實標 `correspondence: blank`

## 編審閘 `editorial.json`

地理學家檢查項（唔用「缺段」過閘）：

**兩欄共用：** 香港繁中；報章文體；fact check；有 footnote／參考。  
**小王子加：** 跟當週主題卡命題／所選角度。  
**狐狸加：** 上列四項軟檢查；來源對唔上論點＝不過。

`status`：`pass`｜`revise`｜`fail`（兩輪制同前）。同步只認 `pass` 且兩邊 `pass=true`。

## 時間鏈（Asia/Hong_Kong）

| 何時 | 邊個 | 做咩 |
|------|------|------|
| 週日 ~20:08 | 地理學家 | 本週主題卡（用戶可否決） |
| 每日 ~05:40 | 小王子 | 跟主題出稿（含週末） |
| 每日 ~05:52 | 狐狸 | 讀王子稿後出稿（含週末） |
| 每日 ~06:06 | 地理學家 | 首輪編審 |
| 每日 ~06:18 | 地理學家 | 再審兜底 |
| 每日 ~06:20 | 飛機師 | 同步（僅 pass）→ Pages，目標 06:30 站上有稿 |
| 每日 ~08:15 | 飛機師 | 隊伍晨檢 |

## 通知

- 主題卡 proposed：簡短知會用戶（可否決）  
- 過關＋同步成功：預設唔打擾  
- 首輪退稿：只找作者  
- 再敗／逾時／同步失敗：通知用戶  

## 公開閱讀

https://tenmatclear-cloud.github.io/cultivation-daily/
