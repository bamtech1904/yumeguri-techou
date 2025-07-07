# Google Places API設定手順

## 1. Google Cloud Console でのAPI設定

### ステップ1: プロジェクトの作成・選択
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 既存のプロジェクトを選択するか、新しいプロジェクトを作成
3. プロジェクト名は分かりやすい名前（例: `yumeguri-techou`）を設定

### ステップ2: Places API (New) の有効化
1. 左サイドメニューから「APIs & Services」→「Library」を選択
2. 検索バーで「Places API」を検索
3. 「**Places API (New)**」を選択して有効化
4. 「ENABLE」ボタンをクリック

**重要**: このアプリは新しい Places API (New) のみを使用します

### ステップ3: APIキーの作成
1. 「APIs & Services」→「Credentials」を選択
2. 「+ CREATE CREDENTIALS」→「API key」をクリック
3. 作成されたAPIキーをコピーして保存

### ステップ4: APIキーの制限設定（重要！）
1. 作成したAPIキーの名前をクリックして設定画面を開く
2. **Application restrictions**（推奨設定）:
   - 開発中: 「None」
   - 本番環境: 「HTTP referrers (web sites)」でドメインを制限
3. **API restrictions**（必須）:
   - 「Restrict key」を選択
   - 「Places API (New)」にチェック
4. 「SAVE」をクリック

## 2. アプリでの設定

### ステップ1: 環境変数の設定
1. プロジェクトルートの `.env` ファイルを開く
2. 以下の行を編集:
   ```
   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_actual_api_key_here
   ```
3. `your_actual_api_key_here` をGoogle Cloud Consoleで取得したAPIキーに置き換え

### ステップ2: 開発サーバーの再起動
```bash
# 現在のサーバーを停止（Ctrl+C または ⌘+C）
# 環境変数を読み込むため再起動
pnpm dev
```

## 3. 動作確認

### 成功時の表示
- アプリのマップタブで「周辺の銭湯を検索中...」と表示される
- 位置情報許可後、実際の施設データが表示される
- 警告メッセージ「Google Places API key not configured」が消える

### トラブルシューティング

#### エラー: `REQUEST_DENIED` （最も一般的）
**原因と解決方法:**

1. **Places API (New) が有効化されていない**
   ```
   解決: Google Cloud Console > APIs & Services > Library > "Places API (New)" を検索して有効化
   ```

2. **請求設定が未完了**
   ```
   解決: Google Cloud Console > Billing > プロジェクトにクレジットカードを登録
   注意: 無料枠内でも請求設定は必須
   ```

3. **APIキーの制限が厳しすぎる**
   ```
   解決: Google Cloud Console > APIs & Services > Credentials > APIキーを選択
   - Application restrictions: "None" に設定（開発時）
   - API restrictions: "Places API (New)" のみ選択
   ```

#### エラー: `API_KEY_INVALID`
- APIキーが正しくコピーされていることを確認
- 前後にスペースが入っていないか確認
- APIキーが削除または無効化されていないか確認

#### エラー: `OVER_QUERY_LIMIT`
- 1日のAPI使用制限を超過
- Google Cloud Console で使用量を確認
- 請求設定で上限を調整

#### 施設が表示されない（ZERO_RESULTS）
- 位置情報の許可が与えられているか確認
- 周辺5km以内に銭湯・温泉・スパが存在するか確認
- 日本国外の場合、該当施設が少ない可能性

#### デバッグ方法
アプリのコンソールログを確認：
```
🔍 Starting Places API search...
📍 Location: {latitude: xx.xxxx, longitude: xxx.xxxx}
🔑 API Key: AIzaSyxx...xxxx
🌐 Request URL: (詳細なリクエスト内容)
📡 Response status: 200
📊 API Response status: REQUEST_DENIED
```

#### よくある設定ミス
1. **APIキーを `.env` ではなく `.env.example` に設定**
2. **開発サーバーを再起動していない**
3. **Google Cloud Console で間違ったプロジェクトを選択**
4. **Places API (Legacy) を有効化して Places API (New) を有効化していない**

## 4. セキュリティ注意事項

### 本番環境での推奨設定
1. **APIキー制限**: 必ずアプリケーション制限とAPI制限を設定
2. **環境分離**: 開発用と本番用で異なるAPIキーを使用
3. **監視**: Google Cloud ConsoleでAPI使用量を定期的に確認
4. **請求**: 予期しない請求を避けるため、使用量アラートを設定

### 料金について
- Places API (New): 月額200ドルまで無料
- 詳細: [Google Maps Platform Pricing](https://developers.google.com/maps/billing/understanding-cost-of-use)

## 5. 開発用テストデータ

APIキーを設定しない場合、アプリはモックデータを使用します：
- 大江戸温泉物語
- 湯乃泉 草加健康センター
- 桜湯

これにより、APIキーなしでもアプリの基本機能をテストできます。