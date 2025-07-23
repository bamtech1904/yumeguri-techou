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

**次のステップ**:
1. 環境の完全再同期 (prebuild --clean)
2. 段階的ビルドテスト
3. 必要に応じてBareワークフロー検討

---

## 📚 学習ポイント

この長時間の troubleshooting により、以下が明確になりました：

- **環境整合性の重要性**: ローカル環境とEAS環境の一致が必須
- **最新toolchainの必要性**: Expo SDK の進歩に合わせたXcode更新
- **バージョン依存関係の複雑性**: React Native生態系の相互依存問題
- **段階的アプローチの効果**: 一つずつ問題を切り分ける重要性

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