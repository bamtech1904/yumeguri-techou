import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initializeAdMob } from '@/utils/adMobConfig';

export default function RootLayout() {
  const isReady = useFrameworkReady();

  useEffect(() => {
    // フレームワークの準備が完了してからAdMob初期化
    if (isReady) {
      const initAds = async () => {
        try {
          const success = await initializeAdMob();
          if (success) {
            if (__DEV__) {
              console.log('✅ AdMob ready with TestIds for development');
            } else {
              console.log('✅ AdMob ready for production');
            }
          } else {
            console.log('⚠️ AdMob initialization failed');
          }
        } catch (error) {
          console.log('⚠️ AdMob initialization error:', error);
        }
      };
      
      initAds();
    }
  }, [isReady]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}