import mobileAds, { MaxAdContentRating, TestIds } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

// AdMob初期化状態の管理
let isAdMobInitialized = false;
let initializationPromise: Promise<void> | null = null;

// AdMob初期化（改善版）
export const initializeAdMob = async (): Promise<boolean> => {
  // 既に初期化済みの場合
  if (isAdMobInitialized) {
    return true;
  }
  
  // 初期化中の場合は既存のPromiseを返す
  if (initializationPromise) {
    try {
      await initializationPromise;
      return isAdMobInitialized;
    } catch {
      return false;
    }
  }
  
  // 開発環境でもAdMobを初期化（TestIds使用のため）
  console.log('🚀 AdMob初期化を開始...');
  
  initializationPromise = (async () => {
    try {
      console.log('📱 AdMob初期化を開始...');
      
      // AdMob初期化
      const adapterStatuses = await mobileAds().initialize();
      console.log('✅ AdMob初期化成功:', adapterStatuses);
      
      // 広告コンテンツのレーティング設定（家族向けアプリのため）
      await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.G,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      });
      
      isAdMobInitialized = true;
      console.log('🎯 AdMob設定完了');
    } catch (error) {
      console.error('❌ AdMob初期化失敗:', error);
      isAdMobInitialized = false;
      throw error;
    }
  })();
  
  try {
    await initializationPromise;
    return true;
  } catch (error) {
    console.error('❌ AdMob初期化エラー:', error);
    initializationPromise = null;
    return false;
  }
};

// 広告ユニットID（TestIds使用版）
export const AD_UNIT_IDS = {
  // 開発時はライブラリ提供のTestIds、本番時は実際のIDを使用
  banner: __DEV__ 
    ? TestIds.BANNER  // ライブラリ提供のテスト用バナー広告ID
    : 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy', // 本番用（後で設定）
  
  interstitial: __DEV__
    ? TestIds.INTERSTITIAL  // ライブラリ提供のテスト用インタースティシャル広告ID
    : 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy', // 本番用（後で設定）
    
  rewarded: __DEV__
    ? TestIds.REWARDED  // ライブラリ提供のテスト用リワード広告ID
    : 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy', // 本番用（後で設定）
};

// 広告表示可能かチェック
export const isAdAvailable = (): boolean => {
  // 開発環境でもTestIds使用でAdMobを有効化
  // 本番環境では初期化状態をチェック
  return isAdMobInitialized && mobileAds().isInitialized;
};

// AdMob初期化状態の確認
export const getAdMobInitializationStatus = () => {
  return {
    isInitialized: isAdMobInitialized,
    isNativeInitialized: mobileAds().isInitialized,
    isDev: __DEV__,
  };
};