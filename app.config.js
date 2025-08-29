import 'dotenv/config';

const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: IS_DEV ? '湯めぐり手帳 (Dev)' : '湯めぐり手帳',
    slug: 'yumeguri-techou',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/yumeguri-icon.png',
    scheme: 'yumeguri',
    userInterfaceStyle: 'automatic',
    newArchEnabled: false,
    splash: {
      image: './assets/images/yumeguri-splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0ea5e9',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV
        ? 'com.yumeguri.techou.dev'
        : 'com.yumeguri.techou',
      buildNumber: '16',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'お近くの銭湯・温泉施設を検索し、現在地からの距離を計算するために位置情報を使用します。位置情報は検索目的のみに使用され、記録や共有されることはありません。',
        NSCameraUsageDescription:
          '銭湯・温泉施設の訪問記録に写真を追加するため、カメラで写真を撮影する機能を提供します。撮影した写真はデバイス内にのみ保存され、外部に送信されることはありません。',
        NSPhotoLibraryUsageDescription:
          '銭湯・温泉施設の訪問記録に写真を追加するため、フォトライブラリから写真を選択する機能を提供します。選択した写真はデバイス内にのみ保存され、外部に送信されることはありません。',
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: IS_DEV ? 'com.yumeguri.techou.dev' : 'com.yumeguri.techou',
      versionCode: 1,
      permissions: [
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.RECORD_AUDIO',
      ],
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-web-browser',
      'expo-location',
      'expo-image-picker',
      [
        'expo-build-properties',
        {
          ios: {
            privacyManifests: {
              NSPrivacyAccessedAPITypes: [
                {
                  NSPrivacyAccessedAPIType:
                    'NSPrivacyAccessedAPICategoryUserDefaults',
                  NSPrivacyAccessedAPITypeReasons: ['CA92.1'], // アプリ設定とユーザー記録を保存するため
                },
                {
                  NSPrivacyAccessedAPIType:
                    'NSPrivacyAccessedAPICategoryFileTimestamp',
                  NSPrivacyAccessedAPITypeReasons: ['C617.1'], // ユーザーが選択した写真のタイムスタンプを表示するため
                },
                {
                  NSPrivacyAccessedAPIType:
                    'NSPrivacyAccessedAPICategoryDiskSpace',
                  NSPrivacyAccessedAPITypeReasons: ['E174.1'], // 写真とデータの保存可能容量を確認するため
                },
                {
                  NSPrivacyAccessedAPIType:
                    'NSPrivacyAccessedAPICategorySystemBootTime',
                  NSPrivacyAccessedAPITypeReasons: ['35F9.1'], // システム処理の最適化のため
                },
              ],
            },
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: 'c8d99fb6-6efe-4172-8920-22e92fe7b678',
      },
      // API keys for secure access (hidden from code inspection)
      googlePlacesApiKey: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '',
      googleMapsApiKey:
        process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
        process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
        '',
    },
    owner: 'ryo_koga',
  },
};
