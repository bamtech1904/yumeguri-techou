# 湯めぐり手帳 iOS配布 - 次のステップ

## 現在の状況

✅ **完了済み**
- アプリ基本設定（app.json, eas.json）
- EAS CLI インストール・ログイン
- テスター向けドキュメント作成
- ビルド・配布手順書作成

⏳ **未完了（手動作業が必要）**
- アプリアイコン・スプラッシュスクリーンの設置
- Expo プロジェクト初期化
- Apple Developer Account との連携

## 次に行うべき作業

### 1. アセット（アイコン・スプラッシュ）の設置

現在HTMLファイルでアイコン・スプラッシュスクリーンのジェネレーターを作成済み：

1. **アイコン生成**
   ```bash
   open generate-icon.html    # ← 既に実行済み
   ```
   - ブラウザでアイコンを確認
   - 「ダウンロード」でicon.pngを保存
   - `assets/images/icon.png` に上書き

2. **スプラッシュスクリーン生成**
   ```bash
   open create-splash.html    # ← 既に実行済み
   ```
   - ブラウザでスプラッシュスクリーンを確認
   - 「ダウンロード」でsplash.pngを保存
   - `assets/images/splash.png` として保存

### 2. Expo プロジェクト初期化

対話式で実行が必要：

```bash
eas init
# プロンプトで "y" を選択してプロジェクト作成
```

この手順で自動的に：
- Expo プロジェクトID が生成される
- app.json に projectId が追加される

### 3. Apple Developer Account 設定

**⚠️ 重要**: EAS資格情報設定は対話式で行う必要があります。**必ずシステムのTerminal.app（またはiTerm等）から実行してください**：

```bash
# iOS用の資格情報設定（対話式）
# ⚠️ IDE内のターミナル（VS Code等）ではなく、システムのTerminal.appから実行
eas credentials:configure-build --platform ios --profile preview
```

実行時のプロンプト対応：
1. **Apple アカウントログイン**: "Do you want to log in to your Apple account?" → `y`
2. **Apple ID入力**: Developer Program登録済みのApple ID
3. **パスワード入力**: Apple IDのパスワード
4. **二段階認証**: SMS/アプリで受信したコード入力
5. **Team選択**: 複数チームがある場合は該当チームを選択

必要な情報：
- Apple ID（Developer Program 登録済み）
- Apple IDパスワード
- 二段階認証アクセス
- Team ID（自動選択される）
- Bundle Identifier: `com.yumeguri.techou`（自動設定済み）

**代替方法**: 直接ビルドコマンドを実行しても資格情報設定が開始されます：
```bash
# ⚠️ これもシステムのTerminal.appから実行
eas build --platform ios --profile preview
# 初回実行時に同様の対話式資格情報設定が開始
```

**実行環境について**: 
- **必須**: システムのTerminal.app、iTerm、またはコマンドラインから実行
- **NG**: VS Code、Xcode、WebStorm等のIDE内ターミナルでは `stdin is not readable` エラーが発生
- **理由**: EAS CLIの対話式入力がIDE環境では正常に動作しないため

### 4. 初回ビルド（内部配布用）

```bash
# ⚠️ これもシステムのTerminal.appから実行
eas build --platform ios --profile preview
```

このコマンドで：
- iOS用のアプリファイル(.ipa)が生成される
- 内部配布用のURLが発行される
- 最大100デバイスまで配布可能

### 5. テスター招待

1. **デバイスUDID収集**
   - テスターに「設定 > 一般 > 情報」からデバイスIDをコピーしてもらう
   
2. **Apple Developer Console でデバイス登録**
   - [developer.apple.com](https://developer.apple.com)
   - Certificates, Identifiers & Profiles > Devices
   - 各UDIDを登録

3. **配布URL共有**
   - EAS Build 完了時に表示されるURLをテスターに送付

## トラブルシューティング

### よくある問題

1. **Bundle Identifier が既に使用されている**
   - Bundle IDを変更: `com.yourname.yumeguri-techou`
   
2. **Apple Developer Account の権限不足**
   - Account Holder または Admin 権限が必要
   
3. **ビルドエラー**
   ```bash
   # キャッシュクリア
   eas build:clear-cache
   
   # 再ビルド
   eas build --platform ios --profile preview --clear-cache
   ```

### サポートリソース

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Internal Distribution Guide](https://docs.expo.dev/build/internal-distribution/)
- プロジェクト内ドキュメント:
  - `docs/build-and-distribute.md` - 詳細な手順
  - `docs/beta-tester-guide.md` - テスター向けガイド
  - `docs/google-api-setup.md` - API設定手順

## 予想される所要時間

- アセット準備: 10分
- Expo設定: 5分
- Apple Developer設定: 15分（初回のみ）
- 初回ビルド: 15-30分
- 合計: **約1時間**

## 配布後の管理

### アップデート時
1. app.json でバージョン番号を更新
2. 再ビルド・配布
3. テスターに新しいURLを共有

### フィードバック収集
- GitHub Issues
- メール
- 専用フォーム（必要に応じて作成）

---

これらの手順を完了すると、知人にiOSアプリとして「湯めぐり手帳」を配布できます。