# アプリバリアント設定ガイド

## 概要

湯めぐり手帳プロジェクトでは、**Development** と **Production** の2つのアプリバリアントを設定しており、TestFlightで同時に配布・テストできます。

## バリアント構成

### 設定の詳細

| 項目 | Development | Production |
|------|-------------|------------|
| **アプリ名** | 湯めぐり手帳 (Dev) | 湯めぐり手帳 |
| **Bundle Identifier** | `com.yumeguri.techou.dev` | `com.yumeguri.techou` |
| **Android Package** | `com.yumeguri.techou.dev` | `com.yumeguri.techou` |
| **環境変数** | `APP_VARIANT=development` | 未設定（デフォルト） |
| **ビルドコマンド** | `pnpm run build:dev` | `pnpm run build:prod` |
| **出力ファイル** | `builds/development/app-dev.ipa` | `builds/production/app-prod.ipa` |

## 技術実装

### 1. 設定ファイル構成

**app.config.js** (動的設定):
```javascript
const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: IS_DEV ? '湯めぐり手帳 (Dev)' : '湯めぐり手帳',
    ios: {
      bundleIdentifier: IS_DEV ? 'com.yumeguri.techou.dev' : 'com.yumeguri.techou',
    },
    android: {
      package: IS_DEV ? 'com.yumeguri.techou.dev' : 'com.yumeguri.techou',
    },
    // その他の設定...
  }
};
```

**eas.json** (ビルド設定):
```json
{
  "build": {
    "development": {
      "env": {
        "APP_VARIANT": "development"
      }
    },
    "production": {
      // APP_VARIANT未設定（デフォルト）
    }
  }  
}
```

### 2. ビルドスクリプト

**package.json**:
```json
{
  "scripts": {
    "build:dev": "APP_VARIANT=development eas build --profile development --local",
    "build:prod": "eas build --profile production --local",
    "dev:variant": "APP_VARIANT=development expo start"
  }
}
```

## 使用方法

### 開発時

**Development環境での開発サーバー起動**:
```bash
pnpm run dev:variant
```

**Production環境での開発サーバー起動**:
```bash
pnpm run dev
```

### ビルド・配布

**Development版ビルド**:
```bash
pnpm run build:dev
# → 湯めぐり手帳 (Dev) が生成される
```

**Production版ビルド**:
```bash
pnpm run build:prod
# → 湯めぐり手帳 が生成される
```

### TestFlight配布

各バリアントは**別々のアプリ**としてApp Store Connectに登録・管理されます：

**Development版アプリの作成**:
- **名前**: 湯めぐり手帳 (Dev)
- **Bundle ID**: `com.yumeguri.techou.dev`
- **SKU**: `yumeguri-techou-dev`

**Production版アプリの作成**:
- **名前**: 湯めぐり手帳
- **Bundle ID**: `com.yumeguri.techou`
- **SKU**: `yumeguri-techou-prod`

## 利点とユースケース

### 開発・テストでの利点

1. **並行テスト**
   - 新機能のテスト（Dev版）と安定版のテスト（Production版）を同時実施
   - 異なるフィーチャーブランチでの独立したテスト

2. **リスク分離**
   - Development版でのクラッシュがProduction版テストに影響しない
   - 実験的機能をProduction版に影響させずにテスト可能

3. **段階的展開**
   - Development版で少数テスター向けに限定テスト
   - Production版で大規模なベータテスト

### TestFlightでの管理

- **同時インストール**: 同一デバイスに両バリアントを並行インストール
- **明確な区別**: アプリ名で一目で判別（ホーム画面で区別可能）
- **独立した管理**: 各バリアントの配布・テスター管理が独立

## 設定の確認方法

### コマンドラインでの確認

**Development環境の設定確認**:
```bash
APP_VARIANT=development npx expo config --type public
```

**Production環境の設定確認**:
```bash
npx expo config --type public
```

### 実行時の環境判定

アプリ内で現在の環境を判定する場合：

```javascript
import Constants from 'expo-constants';

// 開発中の判定
const isDev = __DEV__;

// Expoアプリ設定からの判定
const appName = Constants.expoConfig?.name;
const isDevVariant = appName?.includes('(Dev)');

console.log('App Name:', appName);
console.log('Is Development Variant:', isDevVariant);
```

## トラブルシューティング

### 1. バリアントが正しく切り替わらない

**症状**: Development環境なのにProduction設定が使われる

**原因**: 環境変数`APP_VARIANT`が設定されていない

**解決策**:
```bash
# 環境変数を明示的に設定
APP_VARIANT=development pnpm run dev
```

### 2. Bundle Identifier の競合

**症状**: ビルド時にBundle Identifierが重複するエラー

**原因**: 同じBundle Identifierで異なるバリアントをビルドしようとしている

**解決策**:
1. `app.config.js`の設定を確認
2. 環境変数が正しく設定されているか確認
3. 必要に応じてキャッシュクリア

### 3. TestFlightで間違ったアプリに提出

**症状**: Development版をProduction版アプリに提出してしまう

**解決策**:
1. ビルド前にアプリ名とBundle Identifierを確認
2. `eas submit`時に対象アプリを慎重に選択
3. App Store Connectで提出先を再確認

## ベストプラクティス

### 1. 命名規則の統一

- **Development版**: 必ず `(Dev)` サフィックスを付与
- **Bundle Identifier**: `.dev` サフィックスで区別
- **ファイル名**: `app-dev.ipa` / `app-prod.ipa` で明確に区別

### 2. 環境変数の管理

```bash
# 開発時の環境変数設定例
export APP_VARIANT=development
export NODE_ENV=development

# 本番ビルド時は環境変数をクリア
unset APP_VARIANT
export NODE_ENV=production
```

### 3. テスト戦略

```
Development版:
- 内部テスター 3-5名
- 新機能の動作確認
- クラッシュテスト
- 短期間でのイテレーション

Production版:
- 内部テスター 5-10名 + 外部テスター 100-500名
- 安定性・パフォーマンステスト
- ユーザビリティテスト
- リリース前最終確認
```

## 関連ドキュメント

- [ビルド・配布手順](./build-and-distribute.md)
- [TestFlightテスター管理](./testflight-tester-management.md)
- [開発環境セットアップ](./development-environment-guide.md)

---

このアプリバリアント機能により、効率的で安全な並行開発・テストが可能になります。