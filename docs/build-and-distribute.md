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

### Option B: TestFlight配布（2024年推奨）
**特徴:**
- 最大10,000名の外部テスター + 100名の内部テスター
- App Store Connect経由での配布
- EAS Submitによる自動化対応
- より本番環境に近いテスト環境
- Apple の軽微な審査プロセス有り

**適用場面:**
- 正式リリース前の最終テスト
- 大規模なベータテスト
- Apple Store 審査準備
- 継続的な配布・更新が必要な場合

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
# ⚠️ 必ずシステムのTerminal.app（またはiTerm等）から実行
eas credentials:configure-build --platform ios
```

以下の情報が必要：
- Apple ID（Developer Account）
- Team ID
- App Bundle Identifier: `com.yumeguri.techou`

### Step 3: ビルド実行

#### Internal Distribution ビルド（推奨）
```bash
# プレビュービルド作成
# ⚠️ 必ずシステムのTerminal.app（またはiTerm等）から実行
eas build --platform ios --profile preview

# ビルド完了後、共有URLが生成される
```

#### TestFlight配布用ビルド（2024年推奨）
```bash
# プロダクションビルド作成
# ⚠️ 必ずシステムのTerminal.app（またはiTerm等）から実行
eas build --platform ios --profile production

# EAS Submit で自動提出（推奨）
eas submit --platform ios

# または、ビルドと提出を同時実行
eas build --platform ios --profile production --auto-submit
```

#### 従来の手動アップロード（代替手段）
```bash
# プロダクションビルド作成のみ
eas build --platform ios --profile production

# 手動でTransporter使用（後述）
```

### Step 4: 配布

#### Internal Distribution の場合
1. ビルド完了時に表示されるURLをコピー
2. テスターにURLを共有
3. テスターはSafariでURLを開いてインストール

#### TestFlight の場合（EAS Submit使用 - 推奨）

**事前準備:**
1. **App Store Connect でアプリ作成**
   - [App Store Connect](https://appstoreconnect.apple.com) にログイン
   - 「マイApp」→「新しいApp」で基本情報入力
   - Bundle ID: `com.yumeguri.techou` を選択

2. **EAS Submit 実行**
   ```bash
   # ⚠️ システムのTerminal.appから実行
   eas submit --platform ios
   ```
   
   初回実行時のプロンプト対応:
   - Apple ID とパスワード入力
   - App Store Connect API キー生成（推奨）
   - アプリ選択（作成済みのアプリを選択）

**App Store Connect での設定:**
1. **ビルド処理待ち**
   - 提出後5-15分でApp Store Connectに反映
   - 「TestFlight」タブでビルド確認

2. **暗号化コンプライアンス設定**
   - ビルド横の「Missing Compliance」をクリック
   - 暗号化使用の有無を選択（通常は「いいえ」）
   - 「内部テストを開始」をクリック

3. **テスター招待**
   - 「内部テスト」→「テスターを追加」
   - メールアドレスでテスターを招待
   - テスターにTestFlightアプリでのインストール案内

**テスター側の手順:**
1. TestFlightアプリをインストール
2. 招待メールのリンクをタップ
3. TestFlightアプリでアプリをインストール

## テスターの事前準備

### Internal Distribution の場合
1. **デバイスUDID の収集**
   - テスターに設定 > 一般 > 情報 > デバイスID をコピーしてもらう
   - または配布用ページで自動収集

2. **Apple Developer Console でデバイス登録**
   - Certificates, Identifiers & Profiles > Devices
   - 各UDIDを手動登録

### TestFlight の場合
- テスターのApple IDメールアドレスのみ必要（UDIDの事前登録不要）
- TestFlightアプリ（無料）のインストールが必要

#### 手動Transporter使用の場合（代替手段）
**前提条件:**
- プロダクションビルドが完了済み
- App Store Connectでアプリが作成済み

**手順:**
1. **IPAファイルのダウンロード**
   - EAS Build ダッシュボードからIPAファイルをダウンロード
   
2. **Transporterアプリでアップロード**
   - Mac App StoreからTransporterアプリをインストール
   - Transporterを開き、Apple IDでログイン
   - IPAファイルをドラッグ&ドロップ
   - 「配信」ボタンをクリックしてアップロード
   
3. **App Store Connectで確認**
   - アップロード後、App Store Connectの「TestFlight」タブで確認
   - 以降の手順はEAS Submit使用時と同様

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
# ⚠️ 必ずシステムのTerminal.app（またはiTerm等）から実行
eas credentials:configure-build --platform ios
# 新しいProvisioning Profile を作成
```

#### 4. EAS CLI 対話式コマンドの実行エラー
```
Error: Input is required, but stdin is not readable
```
**原因:** IDE内のターミナル（VS Code、Xcode等）で実行している
**解決方法:**
- **必須**: システムのTerminal.app、iTerm、またはコマンドプロンプトから実行
- **NG**: VS Code、Xcode、WebStorm等のIDE内ターミナルでは正常動作しない
- **理由**: EAS CLIの対話式入力がIDE環境では制限されるため

#### 5. Expo Prebuild エラー
```
Error: ENOENT: no such file or directory, open './assets/images/splash.png'
```
**原因:** app.jsonで参照されているアセットファイルが存在しない
**解決方法:**
```bash
# 不足しているsplash.pngを作成（一時的にicon.pngをコピー）
cp assets/images/icon.png assets/images/splash.png

# iosディレクトリが破損している場合は削除して再生成
rm -rf ios
pnpm expo prebuild --no-install --platform ios
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
   # ⚠️ 必ずシステムのTerminal.app（またはiTerm等）から実行
   eas build --platform ios --profile preview
   ```

### 継続的配布
- GitHub Actions との連携でCI/CD構築可能
- `eas submit` コマンドで自動App Store 提出

## 自動化とCI/CD

### EAS Submit のワンコマンド化
```bash
# ビルド完了後に自動でTestFlightに提出
eas build --platform ios --profile production --auto-submit

# さらに効率化：環境変数で認証情報を管理
export EXPO_APPLE_ID="your-apple-id"
export EXPO_APPLE_ID_PASSWORD="your-app-specific-password"
eas build --platform ios --auto-submit --non-interactive
```

### App Store Connect API キー設定（推奨）
```bash
# 一度設定すれば以降の提出が自動化される
eas credentials --platform ios

# プロンプトで「App Store Connect API Key」を選択
# Key ID、Issuer ID、.p8ファイルを設定
```

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