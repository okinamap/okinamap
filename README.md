# OKINAMAP

地元の人がおすすめする沖縄本島のスポットを、スマートフォンの地図から見つける静的Webサイトです。

## 最初の設定

1. `config.js` を開きます。
2. `YOUR_MAPTILER_API_KEY` をMapTilerのAPIキーへ置き換えます。
3. `assets/logo.svg` を正式ロゴへ置き換えます。
4. ローカルサーバーで `index.html` を開いて確認します。

APIキーをコミットする前に、MapTiler側でGitHub Pagesの公開元ドメインに制限してください。

## スポットの追加

`data/spots.js` の配列へオブジェクトを追加します。タグは詳細画面には表示されず、絞り込みにだけ使用されます。

```js
{
  id: "重複しない英数字ID",
  name: "スポット名",
  category: "飲食店",
  tags: ["沖縄そば", "ランチ"],
  description: "短い紹介文",
  notes: "必要な場合だけ備考",
  coordinates: [経度, 緯度],
  googleMapsUrl: "Googleマップの店舗URL",
  photos: [
    { src: "assets/spots/example-1.jpg", position: "center" }
  ],
  groupId: null
}
```

同一地点として重ねるスポットには、同じ `groupId` を設定してください。座標だけでは自動的にまとめません。

写真の `position` には `center`, `top`, `bottom`, `left`, `right`, `50% 30%` などを指定できます。

## 注意

- `data/spots.js` のサンプルはすべて架空です。公開前に削除してください。
- 写真は使用許可を得たものだけを掲載してください。
- 営業時間は掲載せず、Googleマップで確認してもらう仕様です。
