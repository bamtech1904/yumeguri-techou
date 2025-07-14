import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS, isAdAvailable, getAdMobInitializationStatus } from '@/utils/adMobConfig';
import { MockAdBanner } from './MockAdBanner';

interface AdBannerProps {
  size?: BannerAdSize;
  style?: any;
}

export const AdBanner: React.FC<AdBannerProps> = ({ 
  size = BannerAdSize.BANNER, 
  style 
}) => {
  const [adLoadError, setAdLoadError] = useState<boolean>(false);
  const [showMockAd, setShowMockAd] = useState<boolean>(__DEV__);
  
  useEffect(() => {
    const status = getAdMobInitializationStatus();
    console.log('🎯 AdBanner status:', status);
    
    // 初期化失敗時のみモック広告を表示（開発環境でもTestIds使用で実広告を試行）
    setShowMockAd(!status.isInitialized);
  }, []);

  // 開発環境または AdMob が利用できない場合はモック広告を表示
  if (showMockAd || !isAdAvailable()) {
    return <MockAdBanner style={style} />;
  }

  // 広告読み込みエラー時もモック広告を表示
  if (adLoadError) {
    return <MockAdBanner style={style} />;
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={AD_UNIT_IDS.banner}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true, // プライバシー配慮
        }}
        onAdLoaded={() => {
          console.log('✅ Banner ad loaded successfully');
          setAdLoadError(false);
        }}
        onAdFailedToLoad={(error) => {
          console.log('❌ Banner ad failed to load:', error);
          setAdLoadError(true);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
});