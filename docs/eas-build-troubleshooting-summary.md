# EAS iOS ビルド問題 - 完全経緯まとめ

## 📋 プロジェクト概要

- **アプリ名**: 湯めぐり手帳 (Yumeguri Techou)
- **技術スタック**: React Native + Expo SDK、Google Maps API統合
- **目標**: iOS開発ビルドの成功

---

## 🚨 問題発生の経緯

### 初期状態
- **Expo SDK**: 53.0.0
- **React**: 19.0.0 
- **React Native**: 0.79.5
- **EAS CLI**: 16.15.0
- **Xcode**: 15.4

### 第1段階: SwiftUI API 互換性エラー
```
"value of type 'some View' has no member 'onGeometryChange'"
場所: expo-modules-core/AutoSizingStack.swift:35
```
**根本原因**: SwiftUI 6.0 API (iOS 18+) がEASビルド環境で認識されない

---

## 🔧 試行錯誤の解決プロセス

### アプローチ1: expo-modules-core ダウングレード
- **実施**: package.json に resolutions 追加で ~2.3.0 を強制
- **結果**: ❌ バージョン2.3.13でも同じAPIエラー継続

### アプローチ2: React/React Native バージョン修正
- **修正内容**:
  - React: 19.0.0 → 18.2.0
  - React Native: 0.79.5 → 0.74.7 → 0.73.6
  - @types/react: 19.0.14 → 18.2.79
- **結果**: ❌ 新たなFollyエラー発生

### アプローチ3: CocoaPods環境クリーニング
- **実施**: 全キャッシュ削除 (node_modules, Pods, pnpm store)
- **結果**: ❌ null byte pathname エラー → ✅ 解消後も他エラー継続

### アプローチ4: app.json設定修正
- **修正**: `ios.buildConfiguration: "Debug"` 削除
- **修正**: `newArchEnabled: false` 設定
- **結果**: ❌ Podfile変換エラー継続

### アプローチ5: EAS CLI 最新化
- **更新**: 16.15.0 → 16.17.0
- **結果**: ❌ 同じエラーパターン継続

### アプローチ6: Expo SDK ダウングレード
- **変更**: SDK 53 → SDK 52.0.47
- **結果**: ❌ 異なるFollyエラー (`get_folly_config` 未定義)

---

## 🎭 遭遇した主要エラーパターン

### 1. SwiftUI API エラー (SDK 53)
```swift
.onGeometryChange(for: CGSize.self, of: { proxy in proxy.size })
```
- iOS 18/SwiftUI 6.0 専用APIがビルド環境で未対応

### 2. Folly設定エラー (SDK 52/53)
```ruby
compiler_flags = get_folly_config()[:compiler_flags]
```
- React NativeのFollyライブラリ設定メソッド未定義

### 3. Podfile変換エラー
```ruby
config = use_native_modules!(config_command)
```
- 文字列→整数変換の型エラー

### 4. ローカルビルド出力パスエラー (2025-01-23)
```
Error: Cannot overwrite directory '/Users/.../builds/production' with non-directory '/.../app.ipa'
```
- `--output`オプションにディレクトリパスを指定していたが、EASはファイルパスを期待

---

## 🛠️ 解決済み: ローカルビルド出力パス問題 (2025-01-23)

### 問題の詳細
**エラーメッセージ**:
```
Error: Cannot overwrite directory '/Users/ryo_kogakura/Work/yumeguri-techou/builds/production' with non-directory '/var/folders/qs/fyy3yr496v758vzmt7v_tdkm0000gn/T/eas-build-local-nodejs/286508ef-38f2-42f5-8cd4-f72350acdec9/build/ios/build/app.ipa'.
```

### 根本原因
- **問題**: `--output ./builds/production/` というディレクトリパスを指定
- **EASの期待**: `--output ./builds/production/app.ipa` というファイルパス
- **結果**: ディレクトリをファイルでの上書きを試行してエラー

### 解決策
**修正前のpackage.json**:
```json
{
  "scripts": {
    "build:prod": "mkdir -p builds/production && eas build --profile production --platform ios --local --output ./builds/production/"
  }
}
```

**修正後のpackage.json**:
```json
{
  "scripts": {
    "clean:builds": "rm -rf builds/",
    "prepare:builds": "mkdir -p builds/development builds/preview builds/production",
    "build:dev": "npm run prepare:builds && eas build --profile development --platform ios --local --output ./builds/development/app-dev.ipa",
    "build:preview": "npm run prepare:builds && eas build --profile preview --platform ios --local --output ./builds/preview/app-preview.ipa",
    "build:prod": "npm run prepare:builds && eas build --profile production --platform ios --local --output ./builds/production/app-prod.ipa"
  }
}
```

### 改善点
1. **責任の分離**: ディレクトリ作成(`prepare:builds`)とビルド処理を分離
2. **正しいパス指定**: `--output`に具体的なIPAファイルパスを指定
3. **安全な上書き**: 再ビルド時は既存IPAファイルを正常に上書き
4. **クリーンアップ**: `clean:builds`で簡単にリセット可能

### 検証結果
- ✅ ビルド自体は正常に完了（12.7 MB）
- ✅ IPAファイルが指定パスに正常に出力
- ✅ 再ビルド時の上書きも問題なし

---

## 🔍 根本原因分析

### 構造的互換性問題
1. **Expo SDK 53**: 最新すぎてSwiftUI 6.0依存、環境未対応
2. **Expo SDK 52**: Folly設定の世代間ギャップ
3. **React Native生態系**: バージョン間の複雑な依存関係

### 環境不整合
- EASビルド環境 vs ローカル環境の乖離
- CocoaPods、Ruby、Node.js の複合的相互作用

---

## 💡 Xcode 16 アップデート決断の理由

### Gemini-CLI分析結果
- **SwiftUI 6.0 対応**: Xcode 16でonGeometryChange API正式サポート
- **Expo SDK 52+推奨**: 公式でXcode 16.1+を推奨
- **将来性**: iOS 18 SDK要件 (2025年4月〜)

### 期待される解決効果
1. ✅ SwiftUI API互換性問題の根本解決
2. ✅ EAS環境との整合性向上  
3. ✅ Apple生態系の最新要件対応

---

## 🚀 次期アクション計画

**現在**: Xcode 16アップデート完了 ✅

**解決済み (2025-01-23)**:
1. ✅ 環境の完全再同期 (prebuild --clean)
2. ✅ 段階的ビルドテスト完了
3. ✅ ローカルビルド出力パス問題解決

**最新の状況**:
- ローカルビルドが正常に動作
- package.jsonスクリプトを安全な形式に修正
- `--output`オプションに具体的なファイルパス指定に変更

---

## 🔮 今後の改善事項

### EAS環境変数とローカルビルドの設定分離 (2025-01-24)

**現在の課題**:
- ローカルビルド(`--local`)ではEAS Secretが参照できない
- リモートビルドとローカルビルドで同じ`eas.json`設定を使用している
- 環境変数重複で警告が発生: `"The following environment variables are defined in both..."`

**提案される解決策**:
```json
// eas.json - プロファイル分離アプローチ
{
  "build": {
    "production-local": {
      "env": {
        "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY": "$EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_LOCAL",
        "EXPO_PUBLIC_GOOGLE_PLACES_API_KEY": "$EXPO_PUBLIC_GOOGLE_PLACES_API_KEY_LOCAL"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY": "$EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_REMOTE", 
        "EXPO_PUBLIC_GOOGLE_PLACES_API_KEY": "$EXPO_PUBLIC_GOOGLE_PLACES_API_KEY_REMOTE"
      }
    }
  }
}
```

**環境変数設定**:
- `.env`: `*_LOCAL` suffix付き変数（ローカルビルド用）
- EAS環境変数: `*_REMOTE` suffix付き変数（リモートビルド用）

**期待効果**:
- 完全な環境分離でセキュリティ向上
- 設定の責任分離で保守性向上  
- 警告メッセージの解消

---

## 📚 学習ポイント

この長時間の troubleshooting により、以下が明確になりました：

- **環境整合性の重要性**: ローカル環境とEAS環境の一致が必須
- **最新toolchainの必要性**: Expo SDK の進歩に合わせたXcode更新
- **バージョン依存関係の複雑性**: React Native生態系の相互依存問題
- **段階的アプローチの効果**: 一つずつ問題を切り分ける重要性
- **EAS CLI の仕様理解**: `--output`オプションはファイルパスを期待、ディレクトリパスではない
- **ビルドスクリプト設計**: 責任の分離とエラーハンドリングの重要性
- **gemini-cliとの協働**: 複雑な技術問題での外部知識活用の有効性

---

## 🔗 参考リソース

- [Expo SDK 52 Release Notes](https://docs.expo.dev/versions/v52.0.0/)
- [EAS Build Configuration](https://docs.expo.dev/build/introduction/)
- [React Native Upgrade Guide](https://react-native-community.github.io/upgrade-helper/)
- [Xcode Release Notes](https://developer.apple.com/documentation/xcode-release-notes)

---

*作成日: 2025-01-23*  
*プロジェクト: 湯めぐり手帳*  
*環境: macOS Sonoma 14.6.1, Xcode 16.4*