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
      buildNumber: '14',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          '湯めぐり手帳が周辺の銭湯を検索するために位置情報が必要です。',
        NSCameraUsageDescription:
          '湯めぐり手帳が写真を撮影するためにカメラへのアクセスが必要です。',
        NSPhotoLibraryUsageDescription:
          '湯めぐり手帳が写真を選択するためにフォトライブラリへのアクセスが必要です。',
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
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: 'c8d99fb6-6efe-4172-8920-22e92fe7b678',
      },
    },
    owner: 'ryo_koga',
  },
};
