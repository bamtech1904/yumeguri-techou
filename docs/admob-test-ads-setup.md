# AdMob テスト広告表示実装ガイド

## 概要

「湯めぐり手帳」アプリでAdMobテスト広告を安全に表示するための実装ガイドです。Development Build環境でのクラッシュ問題を解決し、Google公式TestIdsを使用した安定したテスト広告表示を実現しています。

## 背景・解決した問題

### 発生していた問題
1. **AdMob SDK クラッシュ**: Development Build環境でアプリが起動時に即座にクラッシュ
2. **app.json設定エラー**: expo-doctorで「No 'androidAppId' was provided」エラー
3. **テスト用App ID不正**: 実際のApp IDを使用していたためクラッシュリスクが高い

### 解決までの経緯
1. **設定キー名の修正**: `android_app_id` → `androidAppId`、`ios_app_id` → `iosAppId`
2. **Google公式テスト用App IDの採用**: 両プラットフォームで統一されたテスト用IDを使用
3. **TestIds実装**: ライブラリ提供の安全なテスト用Ad Unit IDを使用
4. **完全キャッシュクリア**: node_modules、ios/ディレクトリ、EAS Buildキャッシュをクリア

## 正しい設定方法

### 1. app.json設定

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-3940256099942544~3347511713",
          "iosAppId": "ca-app-pub-3940256099942544~1458002511"
        }
      ]
    ]
  }
}
```

**重要ポイント:**
- ✅ `androidAppId`、`iosAppId`（アンダースコアなし）
- ✅ Google公式のテスト用App IDを使用
- ❌ `android_app_id`、`ios_app_id`（古い形式）
- ❌ 実際のプロダクション用App IDの使用

### 2. 設定の検証

```bash
# 設定エラーがないかチェック
npx expo-doctor

# 成功例の出力:
# ✓ 14/15 checks passed. 1 checks failed.
# （AdMob関連のエラーが出力されなければOK）
```

## 実装コード

### AdMob設定ファイル (utils/adMobConfig.ts)

```typescript
import mobileAds, { MaxAdContentRating, TestIds } from 'react-native-google-mobile-ads';

// AdMob初期化
export const initializeAdMob = async (): Promise<boolean> => {
  try {
    const adapterStatuses = await mobileAds().initialize();
    
    // 家族向けアプリ設定
    await mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.G,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
    
    return true;
  } catch (error) {
    console.error('AdMob初期化エラー:', error);
    return false;
  }
};

// TestIds使用による安全なテスト広告
export const AD_UNIT_IDS = {
  banner: __DEV__ 
    ? TestIds.BANNER  // Google提供のテスト用ID
    : 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy', // 本番用（後で設定）
    
  interstitial: __DEV__
    ? TestIds.INTERSTITIAL
    : 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy',
    
  rewarded: __DEV__
    ? TestIds.REWARDED
    : 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy',
};
```

### バナー広告コンポーネント (components/AdBanner.tsx)

```typescript
import React, { useState, useEffect } from 'react';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS, isAdAvailable } from '@/utils/adMobConfig';
import { MockAdBanner } from './MockAdBanner';

export const AdBanner: React.FC<AdBannerProps> = ({ size = BannerAdSize.BANNER, style }) => {
  const [adLoadError, setAdLoadError] = useState<boolean>(false);

  // AdMobが利用できない場合はMock広告を表示
  if (!isAdAvailable() || adLoadError) {
    return <MockAdBanner style={style} />;
  }

  return (
    <BannerAd
      unitId={AD_UNIT_IDS.banner}
      size={size}
      requestOptions={{
        requestNonPersonalizedAdsOnly: true, // プライバシー配慮
      }}
      onAdLoaded={() => setAdLoadError(false)}
      onAdFailedToLoad={(error) => {
        console.log('バナー広告読み込み失敗:', error);
        setAdLoadError(true);
      }}
    />
  );
};
```

### アプリ初期化 (app/_layout.tsx)

```typescript
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initializeAdMob } from '@/utils/adMobConfig';

export default function RootLayout() {
  const isReady = useFrameworkReady();

  useEffect(() => {
    if (isReady) {
      const initAds = async () => {
        const success = await initializeAdMob();
        if (success) {
          console.log('✅ AdMob ready with TestIds for development');
        }
      };
      initAds();
    }
  }, [isReady]);

  return (
    // JSX
  );
}
```

## TestIds の利点

### 1. 安全性
- Google公式提供のテスト専用ID
- 実際の広告配信システムと分離されている
- クラッシュリスクが最小限

### 2. 開発効率
- 即座にテスト広告が表示される
- AdMobアカウント設定前でもテスト可能
- 実装の検証がスムーズ

### 3. 種類別対応
```typescript
TestIds.BANNER          // バナー広告
TestIds.INTERSTITIAL    // インタースティシャル広告
TestIds.REWARDED        // リワード広告
TestIds.NATIVE          // ネイティブ広告
TestIds.REWARDED_INTERSTITIAL  // リワードインタースティシャル
```

## トラブルシューティング

### 1. アプリ起動時のクラッシュ

**症状:** Development Buildでアプリが即座にクラッシュ
```
GADApplicationVerifyPublisherInitializedCorrectly
Exception Type: EXC_CRASH, SIGABRT
```

**対処法:**
1. app.jsonの設定キー名を確認
2. Google公式テスト用App IDを使用
3. 完全キャッシュクリア後にEAS Build

```bash
# 完全キャッシュクリア手順
rm -rf node_modules pnpm-lock.yaml
rm -rf ios/
pnpm install
eas build --platform ios --profile preview --clear-cache
```

### 2. expo-doctor エラー

**症状:**
```
No 'androidAppId' was provided. The native Google Mobile Ads SDK will crash on Android without it.
No 'iosAppId' was provided. The native Google Mobile Ads SDK will crash on iOS without it.
```

**対処法:**
app.jsonのキー名を修正
```json
// ❌ 間違い
"android_app_id": "...",
"ios_app_id": "..."

// ✅ 正しい
"androidAppId": "...",
"iosAppId": "..."
```

### 3. 広告が表示されない

**確認項目:**
1. AdMob初期化が成功しているか
2. TestIdsが正しく使用されているか
3. ネットワーク接続状況
4. Mock広告へのフォールバック動作

**デバッグログ例:**
```javascript
// 正常な初期化
✅ AdMob初期化成功: {...}
✅ AdMob設定完了
✅ Banner ad loaded successfully

// エラー時
❌ AdMob初期化失敗: [error details]
❌ Banner ad failed to load: [error details]
```

### 4. EAS Build エラー

**よくある問題:**
- `splash.png`ファイル不足
- 破損したios/ディレクトリ
- プラグイン設定の不整合

**解決手順:**
```bash
# アセットファイル作成
cp assets/images/icon.png assets/images/splash.png

# ios/ディレクトリクリーンアップ
rm -rf ios/

# クリーンビルド
eas build --platform ios --profile preview --clear-cache
```

## 本番環境への移行

### 1. AdMobアカウント設定

1. **Google AdMobアカウント作成**
   - [AdMob Console](https://apps.admob.com)でアカウント作成
   - アプリを追加してApp IDを取得

2. **Ad Unit作成**
   - 各広告タイプ用のAd Unit IDを作成
   - 適切な広告フォーマットを選択

### 2. 設定の更新

**app.json:**
```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
          "iosAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
        }
      ]
    ]
  }
}
```

**adMobConfig.ts:**
```typescript
export const AD_UNIT_IDS = {
  banner: __DEV__ 
    ? TestIds.BANNER
    : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // 実際のAd Unit ID
    
  interstitial: __DEV__
    ? TestIds.INTERSTITIAL
    : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    
  rewarded: __DEV__
    ? TestIds.REWARDED
    : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
};
```

### 3. 段階的リリース戦略

1. **ステージング環境**: TestIds使用のままでテスト
2. **限定リリース**: 実際のAd Unit IDで少数ユーザーテスト
3. **全体リリース**: 問題ないことを確認後に全体配布

## セキュリティ・プライバシー考慮事項

### 1. プライバシー配慮の実装
```typescript
// 個人情報を使用しない広告リクエスト
requestOptions={{
  requestNonPersonalizedAdsOnly: true,
}}
```

### 2. 家族向けアプリ設定
```typescript
await mobileAds().setRequestConfiguration({
  maxAdContentRating: MaxAdContentRating.G, // 全年齢対象
  tagForChildDirectedTreatment: false,
  tagForUnderAgeOfConsent: false,
});
```

### 3. iOS プライバシー設定
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSUserTrackingUsageDescription": "このアプリは広告の個人化のためにデータを使用する場合があります。"
      }
    }
  }
}
```

## 継続的な改善

### 1. パフォーマンス監視
- 広告読み込み時間の測定
- エラー率の追跡
- ユーザー体験への影響評価

### 2. A/Bテスト
- 広告配置の最適化
- 表示頻度の調整
- 収益性の向上

### 3. アップデート戦略
- AdMob SDK のアップデート追従
- Expo/React Nativeバージョンとの互換性確認
- 新しい広告フォーマットの検討

---

このガイドに従うことで、安全で安定したAdMobテスト広告の実装が可能になります。問題が発生した場合は、トラブルシューティングセクションを参照してください。