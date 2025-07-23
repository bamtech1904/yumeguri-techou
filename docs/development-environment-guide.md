# 湯めぐり手帳 開発環境ガイド

**最終更新**: 2025年1月23日  
**技術基盤**: Expo SDK 53 + ハイブリッド開発環境

---

## 📋 技術環境概要

### 構築された技術スタック
- **Expo SDK**: 53.0.20
- **React**: 19.0.0
- **React Native**: 0.79.5
- **TypeScript**: 5.8.3
- **Xcode**: 16.4 (SwiftUI 6.0完全対応)
- **開発基盤**: ハイブリッド環境 (Expo Go + Development Build)

### 解決された技術課題
- ✅ **SwiftUI onGeometryChangeエラー**: Xcode 16対応で根本解決
- ✅ **Development Build環境**: 実機テスト環境完全構築
- ✅ **型互換性問題**: TypeScript全エラー解消
- ✅ **ハイブリッド開発**: 効率的な開発フロー確立

---

## 🚀 ハイブリッド開発環境

### 環境判定システム
アプリは実行環境を自動判定し、最適な機能を提供します：

```typescript
import Constants from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

if (isExpoGo) {
  // Expo Go: プレースホルダー表示
  return <ExpoGoPlaceholder />;
} else {
  // Development Build: 実際のネイティブ機能
  return <NativeMapView />;
}
```

### 開発フロー別用途

#### 🎨 Expo Go環境
**用途**: UI/UX開発・高速プロトタイピング

**対応機能**:
- ✅ カレンダー画面・ナビゲーション
- ✅ プロフィール・設定画面
- ✅ 状態管理 (Zustand)
- ✅ 位置情報取得 (expo-location)
- ✅ 基本的なGoogle Places API
- ⚠️ マップ表示（プレースホルダー）

**起動方法**:
```bash
npx expo start
# ターミナルで 's' キーを押してExpo Goモードに切り替え
# QRコードをExpo Goアプリで読み取り
```

#### 🔧 Development Build環境
**用途**: ネイティブ機能・実機テスト

**対応機能**:
- ✅ 全てのExpo Go機能
- ✅ react-native-maps完全対応
- ✅ Google Maps統合・マーカー表示
- ✅ 施設詳細情報・ナビゲーション
- ✅ カメラ・画像ピッカー
- ✅ 実機ネイティブ機能

**起動方法**:
```bash
npx expo start --dev-client
# QRコードをDevelopment Buildアプリで読み取り
```

---

## 🔨 Development Build管理

### ビルド作成
```bash
# iOS実機用Development Build作成
eas build --profile development --platform ios --local

# 成果物: .ipaファイル
# インストール: Xcode Device Manager経由
```

### EAS設定（eas.json）
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium",
        "image": "ios-sequoia-16.4-xcode-16.4"
      }
    }
  }
}
```

### 実機インストール方法
1. **Xcode使用（推奨）**:
   - Xcode > Window > Devices and Simulators
   - 実機選択 > Installed Apps > + > .ipaファイル選択

2. **クラウドビルド + QRコード**:
   ```bash
   eas build --profile development --platform ios
   # 完了後、ExpoダッシュボードでQRコード生成
   ```

---

## 🛠️ 開発コマンド一覧

### 基本開発
```bash
# 開発サーバー起動（Expo Go対応）
npx expo start

# Development Build用サーバー起動
npx expo start --dev-client

# TypeScript型チェック
npx tsc --noEmit

# ESLint実行
npx expo lint

# 依存関係更新確認
npx expo-doctor
```

### ビルド・配布
```bash
# 開発用ビルド（ローカル）
eas build --profile development --platform ios --local

# 本番用ビルド（クラウド）
eas build --profile production --platform ios

# TestFlight自動提出
eas submit --platform ios
```

### トラブルシューティング
```bash
# キャッシュクリア
npx expo start --clear

# 完全クリーンアップ
rm -rf node_modules/.cache
rm -rf ios/build
pnpm install

# EAS Buildキャッシュクリア
eas build:clear-cache
```

---

## 📱 機能別対応状況

| 機能 | Expo Go | Development Build | 実装状況 |
|------|---------|-------------------|----------|
| カレンダー表示 | ✅ | ✅ | 完了 |
| 訪問記録管理 | ✅ | ✅ | 完了 |
| 位置情報取得 | ✅ | ✅ | 完了 |
| 施設検索API | ✅ | ✅ | 完了 |
| Google Maps表示 | ❌ | ✅ | 完了（ハイブリッド） |
| マーカー・ナビ | ❌ | ✅ | 完了（ハイブリッド） |
| カメラ・写真 | ✅ | ✅ | 完了 |
| データ永続化 | ✅ | ✅ | 完了 |

---

## 🔍 デバッグ・監視

### ログ監視
```bash
# iOS実機ログ
npx react-native log-ios

# Metro bundlerログ
npx expo start --verbose

# EAS Buildログ
eas build:list --platform ios
```

### 開発ツール
- **React DevTools**: Chrome拡張機能
- **Flipper**: React Native専用デバッガー
- **Expo Dev Tools**: ブラウザベースツール

---

## 📚 参考資料

### 技術ドキュメント
- [`docs/sdk53-migration-summary.md`](./sdk53-migration-summary.md): 詳細な移行記録
- [`docs/requirements.md`](./requirements.md): 技術仕様・アーキテクチャ
- [`docs/build-and-distribute.md`](./build-and-distribute.md): ビルド・配布手順

### 外部リソース
- [Expo SDK 53 Documentation](https://docs.expo.dev/versions/v53.0.0/)
- [React Native 0.79 Release Notes](https://reactnative.dev/blog/2024/12/12/0.79-release)
- [EAS Build Guide](https://docs.expo.dev/build/introduction/)

---

## 🎯 今後の拡張計画

### Phase 2: 機能拡張
- Android Development Build対応
- Firebase統合・クラウド同期
- プッシュ通知機能

### Phase 3: 最適化
- New Architecture段階的導入
- パフォーマンス改善
- ユーザビリティ向上

---

*この開発環境により、効率的でスケーラブルなアプリ開発が可能になりました。*  
*技術的な質問や改善提案があれば、GitHub Issuesまでお寄せください。*