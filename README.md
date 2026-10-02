# 私人修養日報

兩欄靜態報章：小王子（文史哲修養）＋ 狐狸（AI idea 專欄）。

## 內容

Bot 寫入（本機 box）：

`/home/box/cultivation-daily/content/YYYY-MM-DD/{prince,fox}.md`

本 repo 的 `content/` 需與上述同步後再 push（見下方 deploy）。

## 本機建置／預覽

```bash
cd /workspace/cultivation-daily
npm install
CONTENT_DIR=/home/box/cultivation-daily/content npm run build
# 預覽
python3 -m http.server 8765 --directory dist
# 開 http://127.0.0.1:8765/
```

## GitHub Pages

1. 建立 repo（建議名 `cultivation-daily`）
2. Settings → Pages → Source: GitHub Actions
3. 同步 content 後 push `main`；workflow 會 build 並上線
4. URL：`https://<user>.github.io/cultivation-daily/`

同步指令：

```bash
rsync -a --delete /home/box/cultivation-daily/content/ /workspace/cultivation-daily/content/
```
