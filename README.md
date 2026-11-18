# Whiteout Survival Troop Ratio

Whiteout Survival 出征兵力配置計算器，採純前端 HTML / CSS / JavaScript 製作，可直接部署於 GitHub Pages。

目前包含：

- Settings／設定
- Bear Hunt／獵熊行動
- Crazy Joe／瘋狂的喬伊
- English／繁體中文全站切換
- 行動版優先介面
- 瀏覽器 localStorage 自動保存設定

## 網站

GitHub Pages：

https://j7808833.github.io/troop-ratio-webapp/

## 檔案結構

```text
troop-ratio-webapp/
├── index.html
├── bear.html
├── cj.html
├── app.js
├── style.css
├── README.md
└── assets/
    ├── home.png
    ├── bear.png
    └── crazy-joe.png
```

## 頁面

### Settings／設定

集中輸入玩家與容量相關資料，Bear Hunt 與 Crazy Joe 會直接讀取相同設定。

目前可設定：

- Player Name／玩家名稱
- March Capacity with Heroes／有英雄出征容量
- March Capacity without Heroes／無英雄出征容量
- Normal March Queue／一般出征隊數：0～6
- Hero-less Marches／無英雄隊數：0～6
- Joiner Team Limit／Joiner 單隊上限
- Infantry／盾兵總數
- Lancer／矛兵總數
- Marksman／射手總數
- Main Team Ratio／主隊比例
- Joiner Infantry Ratio／Joiner 盾兵比例

### Capacity Buffs／容量加成

目前包含以下容量來源。

#### Cyrille — Ursa's Bane／西里爾—巨熊剋星

```text
Lv.0  = +0
Lv.1  = +3,000
...
Lv.10 = +30,000
```

此項計入單隊出征容量。

#### Snow Ape — Tumbling Power／雪猿—翻滾之力

提供未啟用與各階段容量加成選項。

此項計入單隊出征容量。

#### Minister of Strategy／戰略部長

```text
None / 無                  = +0
Normal / 戰略部長          = +2,500
Supreme / 至高戰略部長     = +3,750
```

此項計入單隊出征容量。

#### Deployment Capacity Boost／出征容量增益

```text
Off / 關閉 = 0%
+10%       = 10%
```

目前程式計算方式：

```text
固定容量
= 有英雄出征容量
+ Cyrille 出征容量加成
+ Snow Ape 出征容量加成
+ Minister of Strategy 加成

最終單隊容量
= floor(固定容量 × (1 + 出征容量增益%))
```

#### Cyrille — Entrapment／西里爾—四方圍獵

```text
Lv.0  = +0
Lv.1  = +30,000
...
Lv.10 = +300,000
```

此項屬於 Rally Capacity／集結容量，不會加到單隊容量。

#### Iron Rhino — Rallying Beasts／板齒犀—集結獸群

此項屬於 Rally Capacity／集結容量，不會加到單隊容量。

設定頁會分別顯示：

```text
March Capacity Bonus
Rally Capacity Bonus
```

避免將兩種容量混在一起。

## 預設資料

```text
玩家名稱：心碎小狗

有英雄出征容量：147,810
無英雄出征容量：107,400

出征隊數：6
無英雄 Joiner 數量：1

Joiner 單隊上限：97,000

盾兵：278,686
矛兵：230,332
射手：314,377

主隊比例：
盾兵 50%
矛兵 20%
射手 30%

Joiner 盾兵比例：10%
```

容量相關 Buff 預設皆為未啟用／0。

## Bear Hunt／獵熊行動

### 隊伍數量

Bear Hunt 的自己發起 Rally 不占一般 March Queue，因此會額外多 1 隊。

```text
Bear Hunt 可用總隊數 = 一般出征隊數 + 1
Joiner 數量 = 一般出征隊數
```

例如：

```text
一般出征隊數 6 → Bear Hunt 7 隊 = 主 Rally 1 + Joiner 6
一般出征隊數 4 → Bear Hunt 5 隊 = 主 Rally 1 + Joiner 4
一般出征隊數 1 → Bear Hunt 2 隊 = 主 Rally 1 + Joiner 1
一般出征隊數 0 → Bear Hunt 1 隊 = 主 Rally 1
```

### 主隊

主隊先依最終單隊容量與設定比例分配：

```text
盾兵 = floor(單隊容量 × 盾兵比例)
矛兵 = floor(單隊容量 × 矛兵比例)
射手 = 單隊容量 − 盾兵 − 矛兵
```

### Joiner

主隊先使用兵力，再將剩餘射手平均分配給 Joiner。

每支 Joiner：

```text
盾兵 = floor(Joiner Limit × Joiner 盾兵比例)

每隊射手
= floor(max(0, 剩餘射手) ÷ Joiner 數量)

實際射手
= min(每隊射手, Joiner Limit − 盾兵)

矛兵
= Joiner Limit − 盾兵 − 射手
```

若 Joiner 數量為 0，程式不進行除法，因此不會出現除以 0 的錯誤。

## Crazy Joe／瘋狂的喬伊

Crazy Joe 不再固定使用 6 隊，而是依 Settings 中的 March Queue／出征隊數計算。

```text
每隊盾兵 = floor(盾兵總數 ÷ 出征隊數)
每隊矛兵 = floor(矛兵總數 ÷ 出征隊數)
每隊射手 = floor(射手總數 ÷ 出征隊數)
```

每隊依序填入：

```text
Infantry／盾兵
→ Lancer／矛兵
→ Marksman／射手
```

且單隊不超過目前計算出的最終單隊容量。

若出征隊數為 0：

- 不建立隊伍
- 不進行除以 0
- 所有兵力維持在 Remaining Troops／剩餘兵力

## Hero-less Marches／無英雄隊數

目前介面提供 0～6 滑塊並保存設定。

Bear Hunt 與 Crazy Joe 都會依此數量，把部分隊伍改用「無英雄出征容量」計算。

Bear Hunt 中，無英雄數量只套用在 Joiner；主 Rally 仍使用有英雄容量。

## 語言

設定頁提供：

```text
EN
中文
```

語言選擇會存入 localStorage。

切換後會套用到：

- Settings
- Bear Hunt
- Crazy Joe
- Banner 標題
- 玩家欄位
- 說明文字
- 摘要
- 表格欄位
- 狀態文字
- Bottom Navigation

預設語言為 English。

## 資料儲存

設定使用瀏覽器：

```text
localStorage
```

主要 key：

```text
troopRatioSettings
troopRatioLanguage
```

不需要資料庫或後端伺服器。

不同瀏覽器、不同裝置的 localStorage 不會自動同步。

## 本機使用

可直接使用瀏覽器開啟：

```text
index.html
```

建議使用：

- Chrome
- Safari
- Edge

## GitHub Pages 部署

1. 將所有檔案放入 GitHub repository。
2. Repository → Settings。
3. 進入 Pages。
4. Build and deployment 選擇 Deploy from a branch。
5. Branch 選 main。
6. Folder 選 / (root)。
7. 儲存後由 GitHub Pages 發布。

## 目前設計原則

- Mobile-first／手機版優先
- Banner 使用 repository 內 PNG 圖片
- 設定集中在 Settings 頁
- 活動頁直接讀取共用設定
- 出征容量與集結容量分開處理
- 不將 Rally Capacity Bonus 誤加至單隊容量
- 所有隊數輸入限制於 0～6
- 英文／中文採全站共用狀態
