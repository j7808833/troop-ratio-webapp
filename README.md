# Whiteout Survival Troop Ratio

純前端 Whiteout Survival 出征比例計算器，可直接部署到 GitHub Pages。

## 檔案

```text
troop-ratio-webapp/
├── index.html
├── style.css
├── app.js
└── README.md
```

## 本機使用

直接雙擊 `index.html`，使用 Chrome、Safari 或 Edge 開啟即可。

## GitHub Pages 部署

1. 在 GitHub 建立一個 repository。
2. 把這 4 個檔案上傳到 repository 根目錄。
3. 打開 GitHub repository 的 `Settings`。
4. 進入 `Pages`。
5. `Build and deployment` 選擇 `Deploy from a branch`。
6. Branch 選 `main`，Folder 選 `/ (root)`。
7. 儲存後即可取得 GitHub Pages 網址。

## 目前預設資料

- 玩家：心碎小狗
- 有英雄出征容量：147,810
- 無英雄出征容量：107,400
- 盾兵：278,686
- 矛兵：230,332
- 射手：314,377
- Joiner 單隊上限：97,000
- 主隊比例：50 / 20 / 30
- Joiner：5 隊
- 無英雄 Joiner：1 隊

## 計算

### 主隊

```text
主隊兵數 = 有英雄容量 + Cyrille Bonus + Pet Skill Bonus
```

再依主隊比例分配。

### Bear Trap Quantity Limit

主隊先使用兵力，剩餘射手平均分配至 Joiner。

每支 Joiner：

```text
盾兵 = Joiner Limit × 盾兵比例
射手 = 剩餘射手 ÷ Joiner 數量
矛兵 = Joiner Limit − 盾兵 − 射手
```

### CJ

保留原 Excel 的 CJ 核心邏輯：

```text
各兵種先 ÷ 6
每隊依序放：
盾兵 → 矛兵 → 射手
每隊不超過有英雄出征容量
```

## 儲存

設定使用瀏覽器 `localStorage` 儲存，不需要資料庫。
