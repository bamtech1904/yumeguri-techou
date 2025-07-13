# 湯めぐり手帳 ビルド・配布手順

## 前提条件

### 必要なアカウント・ツール
- Apple Developer Account（有料：$99/年）
- Expo アカウント（無料）
- EAS CLI（インストール済み）

### 事前準備
- `eas.json` 設定ファイル作成済み
- `app.json` でアプリ情報設定済み
- アプリアイコンとスプラッシュスクリーン準備

## 配布方法の選択

### Option A: Expo Internal Distribution（推奨）
**特徴:**
- 最大100デバイス/年
- 即座に配布可能
- URL共有で簡単インストール
- App Store Connect不要

**適用場面:**
- 少数のベータテスター
- 迅速なフィードバック収集
- 開発中の頻繁な更新

### Option B: TestFlight Internal Testing
**特徴:**
- 最大100名の内部テスター
- App Store Connect経由
- より本番環境に近い
- Apple の審査プロセス有り

**適用場面:**
- 正式リリース前の最終テスト
- Apple Store 審査準備

## 実際のビルド手順

### Step 1: Expo プロジェクト初期化

```bash
# EAS プロジェクト初期化（まだの場合）
eas init

# Expo アカウントにログイン
eas login
```

### Step 2: Apple Developer Account 設定

```bash
# Apple Developer credentials 設定
eas credentials:configure
```

以下の情報が必要：
- Apple ID（Developer Account）
- Team ID
- App Bundle Identifier: `com.yumeguri.techou`

### Step 3: ビルド実行

#### Internal Distribution ビルド（推奨）
```bash
# プレビュービルド作成
eas build --platform ios --profile preview

# ビルド完了後、共有URLが生成される
```

#### App Store Connect 用ビルド
```bash
# プロダクションビルド作成
eas build --platform ios --profile production

# 自動でApp Store Connect にアップロード
```

### Step 4: 配布

#### Internal Distribution の場合
1. ビルド完了時に表示されるURLをコピー
2. テスターにURLを共有
3. テスターはSafariでURLを開いてインストール

#### TestFlight の場合
1. App Store Connect でアプリ情報を入力
2. 内部テスターグループを作成
3. テスターをメールアドレスで招待
4. TestFlight アプリからインストール

## テスターの事前準備

### Internal Distribution の場合
1. **デバイスUDID の収集**
   - テスターに設定 > 一般 > 情報 > デバイスID をコピーしてもらう
   - または配布用ページで自動収集

2. **Apple Developer Console でデバイス登録**
   - Certificates, Identifiers & Profiles > Devices
   - 各UDIDを手動登録

### TestFlight の場合
- テスターのApple IDメールアドレスのみ必要

## 注意事項とトラブルシューティング

### ビルド時の一般的な問題

#### 1. Bundle Identifier の重複
```
Error: Bundle identifier 'com.yumeguri.techou' already exists
```
**解決方法:** 
- 別のBundle ID に変更（例: `com.yourname.yumeguri-techou`）
- または既存のアプリを削除

#### 2. Apple Developer Account の権限不足
```
Error: Insufficient permissions for Apple Developer account
```
**解決方法:**
- Account Holder または Admin 権限が必要
- チームメンバーの場合は適切な権限を要求

#### 3. Provisioning Profile エラー
```
Error: No matching provisioning profile found
```
**解決方法:**
```bash
eas credentials:configure
# 新しいProvisioning Profile を作成
```

### 配布時の問題

#### 1. "App cannot be installed" エラー
**原因:** デバイスUDIDが登録されていない（Internal Distribution）
**解決方法:** Apple Developer Console でUDIDを確認・追加

#### 2. "Untrusted Developer" 警告
**解決方法:** 設定 > 一般 > VPNとデバイス管理 で開発者を信頼

## 更新とバージョン管理

### アプリ更新時
1. `app.json` でバージョン番号を更新
   ```json
   {
     "expo": {
       "version": "1.0.1",
       "ios": {
         "buildNumber": "2"
       }
     }
   }
   ```

2. 再ビルド・配布
   ```bash
   eas build --platform ios --profile preview
   ```

### 継続的配布
- GitHub Actions との連携でCI/CD構築可能
- `eas submit` コマンドで自動App Store 提出

## セキュリティ・ベストプラクティス

### 環境変数の管理
```bash
# 本番用のAPIキーを設定
eas secret:create --scope project --name GOOGLE_PLACES_API_KEY --value "your-production-key"
```

### ビルド設定の分離
```json
// eas.json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_GOOGLE_PLACES_API_KEY": "test-api-key"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_GOOGLE_PLACES_API_KEY": "prod-api-key"
      }
    }
  }
}
```

## 配布完了後のモニタリング

### フィードバック収集
- Crash報告の監視（Expo Dashboard）
- ユーザーフィードバックの整理
- 使用統計の確認

### 次期バージョンの準備
- バグ修正の優先順位付け
- 新機能の検討
- パフォーマンス改善

---

このドキュメントを参考に、安全で効率的なアプリ配布を行ってください。