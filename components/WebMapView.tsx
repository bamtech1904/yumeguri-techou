import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import { LocationCoords } from '@/services/locationService';

interface Facility {
  place_id: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  formatted_address: string;
  rating?: number;
  price_level?: number;
  types: string[];
  isVisited?: boolean;
}

interface WebMapViewProps {
  currentLocation: LocationCoords;
  facilities: Facility[];
  selectedPlaceId?: string;
  onMarkerPress?: (facility: Facility) => void;
  onError?: (errorMessage: string) => void;
  onMapInitialized?: () => void;
  onMapClicked?: () => void;
  style?: any;
}

const WebMapView = React.forwardRef<any, WebMapViewProps>(function WebMapView({ 
  currentLocation, 
  facilities,
  selectedPlaceId,
  onMarkerPress, 
  onError,
  onMapInitialized,
  onMapClicked,
  style 
}, ref) {
  // Expo Goで実行されているかどうかを判定
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  const webViewRef = useRef<WebView>(null);

  // HTMLを完全に静的化（propsに依存しない）
  const staticMapHTML = useMemo(() => {
    const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
    
    // APIキーの検証
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'your_actual_api_key_here') {
      console.error('Google Maps API Key is not configured properly');
    }
    
    console.log('Using Google Maps API Key:', GOOGLE_MAPS_API_KEY ? `${GOOGLE_MAPS_API_KEY.substring(0, 8)}...` : 'NONE');
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; height: 100vh; }
        #map { height: 100%; width: 100%; }
        .info-window {
            max-width: 220px;
            font-family: Arial, sans-serif;
            padding: 4px;
        }
        .info-title {
            font-weight: bold;
            margin-bottom: 4px;
            color: #1e293b;
            font-size: 14px;
        }
        .info-address {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 8px;
            line-height: 1.3;
        }
        .info-details {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        .info-rating {
            font-size: 12px;
            color: #64748b;
        }
        .info-badge {
            background-color: #10b981;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 500;
        }
        .info-distance {
            font-size: 11px;
            color: #0ea5e9;
            margin-bottom: 8px;
        }
        .detail-button {
            background-color: #0ea5e9;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            width: 100%;
            transition: background-color 0.2s;
        }
        .detail-button:hover {
            background-color: #0284c7;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    
    <script async defer src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap&language=ja&region=JP"></script>
    
    <script>
        let map;
        let infoWindow;
        let markers = [];
        let userMarker; // ユーザーの現在地マーカー
        
        // 位置追従制御のための状態管理
        let userIsInteracting = false; // ユーザーが手動操作中かどうか
        
        // 現在地の管理（静的初期化 - 後でJavaScriptで動的更新）
        let displayCurrentLocation = { lat: 35.6762, lng: 139.6503 }; // 東京駅を初期値
        let actualCurrentLocation = { lat: 35.6762, lng: 139.6503 };
        
        // 施設データ（静的初期化 - 後でJavaScriptで動的更新）
        let facilities = [];
        let selectedPlaceId = null;
        
        // ユーザー操作の開始を検出
        function onUserInteractionStart() {
            console.log('👆 ユーザー操作開始 - 位置追従を停止（リセンターボタンで復帰）');
            userIsInteracting = true;
        }
        
        // 現在地を動的に更新する関数（JavaScriptインジェクション用）
        function updateCurrentLocation(lat, lng) {
            console.log('📍 現在地を動的更新:', { lat, lng });
            
            // 実際の現在地を更新
            actualCurrentLocation = { lat, lng };
            
            // ユーザーマーカーが存在する場合は位置のみ更新
            if (userMarker) {
                userMarker.setPosition(actualCurrentLocation);
                console.log('✅ ユーザーマーカー位置更新完了');
            }
        }
        
        // 施設データを動的に更新する関数（差分更新でマーカー点滅を防止）
        function updateFacilities(newFacilities) {
            console.log('🏗️ 施設データを動的更新:', newFacilities.length, '件');
            
            // 既存の施設と新しい施設のplace_idを比較
            const existingPlaceIds = new Set(markers.map(m => m.placeId));
            const newPlaceIds = new Set(newFacilities.map(f => f.place_id));
            
            // 削除する必要があるマーカーを特定
            const markersToRemove = markers.filter(m => !newPlaceIds.has(m.placeId));
            
            // 追加する必要がある施設を特定
            const facilitiesToAdd = newFacilities.filter(f => !existingPlaceIds.has(f.place_id));
            
            console.log('📊 マーカー差分:', {
                remove: markersToRemove.length,
                add: facilitiesToAdd.length,
                existing: markers.length - markersToRemove.length
            });
            
            // 不要なマーカーを削除
            markersToRemove.forEach(markerData => {
                if (markerData.marker) {
                    markerData.marker.setMap(null);
                }
            });
            
            // markersから削除されたものを取り除く
            markers = markers.filter(m => newPlaceIds.has(m.placeId));
            
            // 施設データを更新
            facilities = newFacilities;
            
            // 新しい施設のマーカーのみ作成
            if (facilitiesToAdd.length > 0) {
                console.log('➕ 新しいマーカーを追加:', facilitiesToAdd.length, '件');
                facilitiesToAdd.forEach(facility => {
                    createSingleFacilityMarker(facility);
                });
            }
            
            console.log('✅ 施設データ更新完了。総マーカー数:', markers.length);
        }
        
        // 現在地マーカーを更新する関数（地図視点は固定）
        function updateCurrentLocationMarker(lat, lng) {
            console.log('📍 現在地マーカーを更新:', { lat, lng });
            
            // 実際の現在地を常に更新
            actualCurrentLocation = { lat, lng };
            
            // ユーザーマーカーが存在する場合は位置のみ更新（地図中心は変更しない）
            if (userMarker) {
                userMarker.setPosition(actualCurrentLocation);
                console.log('✅ ユーザーマーカー位置更新完了（地図視点維持）');
            }
            
            // 注意: 地図の中心は一切変更しない（ユーザーの視点を尊重）
            // マーカーの位置のみ更新することで、滑らかな現在地追従を実現
        }
        
        // 距離計算関数
        function calculateDistance(lat1, lng1, lat2, lng2) {
            const R = 6371; // Earth's radius in kilometers
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLng = (lng2 - lng1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                     Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        }
        
        // 距離フォーマット関数
        function formatDistance(distanceKm) {
            if (distanceKm < 1) {
                return Math.round(distanceKm * 1000) + 'm';
            } else {
                return distanceKm.toFixed(1) + 'km';
            }
        }
        
        // 詳細ポップアップ表示関数
        function showDetailPopup(placeId) {
            console.log('🔍 showDetailPopup called with placeId:', placeId);
            const facility = facilities.find(f => f.place_id === placeId);
            
            if (!facility) {
                console.error('❌ 施設が見つかりません:', placeId);
                console.log('📍 利用可能な施設:', facilities.map(f => f.place_id));
                return;
            }
            
            if (!window.ReactNativeWebView) {
                console.error('❌ ReactNativeWebViewが利用できません');
                return;
            }
            
            console.log('📤 detailPressメッセージを送信:', facility.name);
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'detailPress',
                facility: facility
            }));
            console.log('✅ detailPressメッセージ送信完了');
        }

        // マーカーハイライトとインフォウィンドウをクリアする関数
        function clearHighlight() {
            console.log('🧹 clearHighlight called');
            
            try {
                // インフォウィンドウを閉じる
                if (infoWindow) {
                    infoWindow.close();
                    console.log('✅ InfoWindow closed');
                }
                
                // 全マーカーを通常状態に戻す
                if (markers && markers.length > 0) {
                    console.log('🔄 Resetting', markers.length, 'markers to normal state');
                    
                    markers.forEach((markerData, index) => {
                        if (markerData.marker) {
                            const facility = facilities.find(f => f.place_id === markerData.placeId);
                            if (facility) {
                                // 通常状態のアイコンに戻す
                                markerData.marker.setIcon({
                                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(\`
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="\${facility.isVisited ? '#10b981' : '#ef4444'}" stroke="#ffffff" stroke-width="2"/>
                                            <circle cx="12" cy="9" r="2.5" fill="#ffffff"/>
                                        </svg>
                                    \`),
                                    scaledSize: new google.maps.Size(24, 24),
                                    anchor: new google.maps.Point(12, 24)
                                });
                                console.log(\`✅ Marker \${index + 1} (\${facility.name}) reset to normal state\`);
                            }
                        }
                    });
                    
                    console.log('✅ All markers reset successfully');
                } else {
                    console.log('ℹ️ No markers to reset');
                }
                
            } catch (error) {
                console.error('❌ Error in clearHighlight:', error);
            }
        }

        // 特定の座標に地図をフォーカスする関数
        function focusOnLocation(lat, lng, placeId) {
            console.log('🎯 focusOnLocation called:', { lat, lng, placeId });
            
            if (!map) {
                console.error('❌ Map not initialized');
                return;
            }
            
            try {
                const targetLat = parseFloat(lat);
                const targetLng = parseFloat(lng);
                
                console.log('📍 Setting map center to:', { lat: targetLat, lng: targetLng });
                map.setCenter({ lat: targetLat, lng: targetLng });
                map.setZoom(16);
                console.log('✅ Map center and zoom set successfully');
                
                // 該当するマーカーのインフォウィンドウを開く
                if (placeId) {
                    console.log('🔍 Looking for facility with placeId:', placeId);
                    console.log('📍 Available facilities:', facilities.length);
                    console.log('🏷️ Available markers:', markers.length);
                    
                    const facility = facilities.find(f => f.place_id === placeId);
                    if (!facility) {
                        console.error('❌ Facility not found for placeId:', placeId);
                        return;
                    }
                    
                    console.log('✅ Found facility:', facility.name);
                    
                    const markerData = markers.find(m => m.placeId === placeId);
                    if (!markerData || !markerData.marker) {
                        console.error('❌ Marker not found for placeId:', placeId);
                        console.log('Available marker placeIds:', markers.map(m => m.placeId));
                        return;
                    }
                    
                    console.log('✅ Found marker for facility');
                    
                    try {
                        // インフォウィンドウの内容を生成
                        const distanceKm = actualCurrentLocation ? calculateDistance(
                            actualCurrentLocation.lat,
                            actualCurrentLocation.lng,
                            facility.geometry.location.lat,
                            facility.geometry.location.lng
                        ) : null;
                        
                        const contentString = \`
                            <div class="info-window">
                                <div class="info-title">\${facility.name}</div>
                                <div class="info-address">\${facility.formatted_address}</div>
                                <div class="info-details">
                                    <div class="info-rating">★ \${facility.rating ? facility.rating.toFixed(1) : 'N/A'}</div>
                                    \${facility.isVisited ? '<div class="info-badge">訪問済</div>' : ''}
                                </div>
                                \${distanceKm ? \`<div class="info-distance">距離: \${formatDistance(distanceKm)}</div>\` : ''}
                                <button class="detail-button" onclick="showDetailPopup('\${facility.place_id}')">
                                    詳細を見る
                                </button>
                            </div>
                        \`;
                        
                        console.log('📄 Setting info window content');
                        infoWindow.setContent(contentString);
                        infoWindow.open(map, markerData.marker);
                        console.log('✅ Info window opened successfully');
                        
                    } catch (infoError) {
                        console.error('❌ Error opening info window:', infoError);
                    }
                }
            } catch (error) {
                console.error('❌ Error in focusOnLocation:', error);
            }
        }

        // 単一の施設マーカーを作成する関数
        function createSingleFacilityMarker(facility) {
            const isSelected = selectedPlaceId === facility.place_id;
            console.log(\`📍 Creating single marker: \${facility.name} (selected: \${isSelected})\`);
            
            const marker = new google.maps.Marker({
                position: {
                    lat: facility.geometry.location.lat,
                    lng: facility.geometry.location.lng
                },
                map: map,
                title: facility.name,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(\`
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="\${
                                isSelected ? '#f59e0b' : (facility.isVisited ? '#10b981' : '#ef4444')
                            }" stroke="#ffffff" stroke-width="\${isSelected ? '3' : '2'}"/>
                            <circle cx="12" cy="9" r="2.5" fill="#ffffff"/>
                        </svg>
                    \`),
                    scaledSize: new google.maps.Size(isSelected ? 32 : 24, isSelected ? 32 : 24),
                    anchor: new google.maps.Point(isSelected ? 16 : 12, isSelected ? 32 : 24)
                }
            });
            
            // マーカーを配列に保存
            const markerData = {
                marker: marker,
                placeId: facility.place_id
            };
            markers.push(markerData);
            console.log(\`✅ Single marker added: \${facility.name} (placeId: \${facility.place_id})\`);
            
            // 距離の計算
            const distanceKm = actualCurrentLocation ? calculateDistance(
                actualCurrentLocation.lat,
                actualCurrentLocation.lng,
                facility.geometry.location.lat,
                facility.geometry.location.lng
            ) : null;
            
            const contentString = \`
                <div class="info-window">
                    <div class="info-title">\${facility.name}</div>
                    <div class="info-address">\${facility.formatted_address}</div>
                    <div class="info-details">
                        <div class="info-rating">★ \${facility.rating ? facility.rating.toFixed(1) : 'N/A'}</div>
                        \${facility.isVisited ? '<div class="info-badge">訪問済</div>' : ''}
                    </div>
                    \${distanceKm ? \`<div class="info-distance">距離: \${formatDistance(distanceKm)}</div>\` : ''}
                    <button class="detail-button" onclick="showDetailPopup('\${facility.place_id}')">
                        詳細を見る
                    </button>
                </div>
            \`;
            
            marker.addListener('click', (e) => {
                console.log('🖱️ Marker clicked:', facility.name);
                infoWindow.setContent(contentString);
                infoWindow.open(map, marker);
                // マーカークリック時はイベントの伝播を停止してマップクリックを防ぐ
                e.stop();
            });
        }

        // 施設マーカーを作成する関数（初期化時用）
        function createFacilityMarkers() {
            console.log('🏗️ Creating initial markers for', facilities.length, 'facilities');
            facilities.forEach((facility) => {
                createSingleFacilityMarker(facility);
            });
            console.log(\`✅ Initial marker creation completed. Total: \${markers.length}\`);
        }

        function initMap() {
            console.log('🚀 Initializing map...');
            map = new google.maps.Map(document.getElementById('map'), {
                zoom: 15,
                center: displayCurrentLocation,
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: false,
                styles: [
                    {
                        featureType: 'poi.business',
                        stylers: [{ visibility: 'off' }]
                    }
                ]
            });
            
            infoWindow = new google.maps.InfoWindow();
            
            // マーカー配列を初期化
            markers = [];
            console.log('📍 Markers array initialized');
            
            // ユーザーの現在位置マーカー
            userMarker = new google.maps.Marker({
                position: actualCurrentLocation,
                map: map,
                title: '現在地',
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(\`
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="8" fill="#2563eb" stroke="#ffffff" stroke-width="3"/>
                            <circle cx="12" cy="12" r="3" fill="#ffffff"/>
                        </svg>
                    \`),
                    scaledSize: new google.maps.Size(24, 24),
                    anchor: new google.maps.Point(12, 12)
                }
            });
            
            // 施設マーカーを作成
            createFacilityMarkers();
            
            // 地図の中心を現在地に設定
            map.setCenter(displayCurrentLocation);
            
            // マップクリック時のイベントリスナーを追加（マーカー以外の場所をクリックした時）
            map.addListener('click', () => {
                console.log('🗺️ Map clicked (not on marker), clearing highlight');
                clearHighlight();
                
                // React Nativeに通知
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'mapClicked',
                        message: 'Map area clicked, highlights cleared'
                    }));
                }
            });
            
            // ユーザー操作検出のイベントリスナー
            map.addListener('dragstart', onUserInteractionStart);
            map.addListener('zoom_changed', onUserInteractionStart);
            
            console.log('👆 ユーザー操作検出リスナー設定完了（リセンターボタンで復帰）');
            
            // マーカー作成完了ログ
            console.log(\`🎯 Marker creation completed. Total markers: \${markers.length}\`);
            console.log('🏷️ Marker placeIds:', markers.map(m => m.placeId));
            
            // マップ初期化完了をReact Nativeに通知
            console.log('🗺️ Map initialization completed');
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'mapInitialized',
                    message: 'Map has been initialized and is ready'
                }));
            }
        }
        
        // メッセージハンドラー関数
        function handleMessage(e) {
            console.log('📨 WebView received message:', e.data);
            try {
                const data = JSON.parse(e.data);
                console.log('📨 Parsed message data:', data);
                
                if (data.type === 'recenter') {
                    console.log('🎯 Processing recenter message');
                    // リセンター時は追従を強制的に再開
                    userIsInteracting = false;
                    displayCurrentLocation = { ...actualCurrentLocation };
                    map.setCenter(displayCurrentLocation);
                    map.setZoom(15);
                } else if (data.type === 'focusOnLocation') {
                    console.log('🎯 Processing focusOnLocation message:', data);
                    focusOnLocation(data.latitude, data.longitude, data.placeId);
                } else if (data.type === 'clearHighlight') {
                    console.log('🧹 Processing clearHighlight message');
                    clearHighlight();
                } else if (data.type === 'updateCurrentLocation') {
                    console.log('📍 Processing updateCurrentLocation message:', data.location);
                    updateCurrentLocationMarker(data.location.lat, data.location.lng);
                } else {
                    console.log('❓ Unknown message type:', data.type);
                }
            } catch (error) {
                console.error('❌ Error parsing message:', error);
                console.error('❌ Raw message data:', e.data);
            }
        }

        // React Nativeからのメッセージを受信（複数の方法で試行）
        document.addEventListener('message', handleMessage);
        window.addEventListener('message', handleMessage);
        
        console.log('📨 Message listeners registered');
        
        // 詳細なエラーハンドリング
        window.addEventListener('error', function(e) {
            console.error('Map error:', e);
            // React Nativeにエラーを通知
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'error',
                    message: e.message,
                    filename: e.filename,
                    lineno: e.lineno,
                    colno: e.colno
                }));
            }
        });
        
        // Google Maps API読み込みエラーのハンドリング
        window.gm_authFailure = function() {
            console.error('Google Maps authentication failed');
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'authError',
                    message: 'Google Maps認証が失敗しました。APIキーの設定を確認してください。',
                    details: 'Maps JavaScript APIが有効化されているか、APIキーの制限設定を確認してください。'
                }));
            }
        };
        
        // より詳細なGoogle Maps APIエラーハンドリング
        window.addEventListener('load', function() {
            // Google Maps APIの読み込み状況を確認
            setTimeout(function() {
                if (typeof google === 'undefined') {
                    console.error('Google Maps API script failed to load');
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'loadError',
                            message: 'Google Maps APIスクリプトの読み込みに失敗しました。',
                            details: 'ネットワーク接続またはAPIキーの設定を確認してください。'
                        }));
                    }
                } else if (typeof google.maps === 'undefined') {
                    console.error('Google Maps API loaded but maps object not available');
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'loadError',
                            message: 'Google Maps APIは読み込まれましたが、マップオブジェクトが利用できません。',
                            details: 'Maps JavaScript APIが有効化されているか確認してください。'
                        }));
                    }
                }
            }, 3000); // 3秒後にチェック
        });
        
        // API読み込み完了の通知
        window.onload = function() {
            console.log('WebView loaded');
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'loaded',
                    message: 'WebView loaded successfully'
                }));
            }
        };
    </script>
</body>
</html>
    `;
  }, []); // 依存配列を空にして一度だけ生成

  // 動的更新機構：現在地が変更されたらJavaScriptを注入
  useEffect(() => {
    if (webViewRef.current && currentLocation) {
      const script = `
        if (typeof updateCurrentLocation === 'function') {
          updateCurrentLocation(${currentLocation.latitude}, ${currentLocation.longitude});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [currentLocation]);

  // 動的更新機構：施設が変更されたらJavaScriptを注入
  useEffect(() => {
    if (webViewRef.current && facilities) {
      const facilitiesJson = JSON.stringify(facilities);
      const script = `
        if (typeof updateFacilities === 'function') {
          console.log('🔄 施設データを更新中...', ${facilities.length}, '件');
          updateFacilities(${facilitiesJson});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [facilities]);

  // 初期データ注入（現在地と施設データが揃った時）
  useEffect(() => {
    if (webViewRef.current && currentLocation && facilities) {
      // 少し待ってからデータを注入
      const timer = setTimeout(() => {
        const initScript = `
          if (typeof updateCurrentLocation === 'function' && typeof updateFacilities === 'function') {
            console.log('🚀 初期データを注入中...');
            updateCurrentLocation(${currentLocation.latitude}, ${currentLocation.longitude});
            updateFacilities(${JSON.stringify(facilities)});
            console.log('✅ 初期データ注入完了');
          }
          true;
        `;
        webViewRef.current?.injectJavaScript(initScript);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentLocation, facilities]);

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📨 WebView message:', data.type);
      
      switch (data.type) {
        case 'mapInitialized':
          console.log('✅ WebMapView初期化完了 - React Nativeに通知');
          onMapInitialized?.();
          break;
        case 'mapClicked':
          onMapClicked?.();
          break;
        case 'detailPress':
          console.log('🔍 詳細ボタンがクリックされました:', data.facility?.name);
          if (data.facility && onMarkerPress) {
            // WebViewから受信した施設データでonMarkerPressコールバックを実行
            onMarkerPress(data.facility);
          } else {
            console.error('❌ 施設データまたはonMarkerPressコールバックが見つかりません');
          }
          break;
        case 'authError':
          console.error('Google Maps認証エラー:', data.message);
          onError?.(data.message);
          break;
        case 'error':
          const errorMessage = data?.message || (typeof data === 'string' ? data : 'WebViewエラーが発生しました');
          console.error('WebView エラー:', errorMessage);
          onError?.(errorMessage);
          break;
        default:
          console.log('Unknown WebView message:', data.type);
      }
    } catch (error) {
      console.error('メッセージ処理エラー:', error);
    }
  }, [onMapInitialized, onMapClicked, onError, onMarkerPress]);

  const recenterMap = () => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'recenter' }));
    }
  };

  const clearHighlight = () => {
    console.log('🧹 Clearing map highlights');
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'clearHighlight' }));
      
      // 代替手段としてJavaScriptも直接実行
      const jsCode = `
        try {
          console.log('🧹 Direct JS injection - clearHighlight called');
          if (typeof clearHighlight === 'function') {
            clearHighlight();
          } else {
            console.error('❌ clearHighlight function not found');
          }
        } catch (error) {
          console.error('❌ Error in clearHighlight injection:', error);
        }
        true;
      `;
      webViewRef.current.injectJavaScript(jsCode);
    }
  };

  const focusOnLocation = (latitude: number, longitude: number, placeId?: string) => {
    const message = { 
      type: 'focusOnLocation',
      latitude,
      longitude,
      placeId
    };
    console.log('📤 Sending focusOnLocation message:', message);
    
    if (webViewRef.current) {
      // 方法1: postMessage
      const messageString = JSON.stringify(message);
      console.log('📤 Message string:', messageString);
      webViewRef.current.postMessage(messageString);
      console.log('✅ PostMessage sent successfully');
      
      // 方法2: injectedJavaScript（代替手段）
      const jsCode = `
        try {
          console.log('🚀 Direct JS injection - focusOnLocation called');
          if (typeof focusOnLocation === 'function') {
            focusOnLocation(${latitude}, ${longitude}, '${placeId || ''}');
          } else {
            console.error('❌ focusOnLocation function not found');
          }
        } catch (error) {
          console.error('❌ Error in injected JS:', error);
        }
        true;
      `;
      console.log('📤 Sending injected JavaScript as backup');
      webViewRef.current.injectJavaScript(jsCode);
    } else {
      console.error('❌ WebView ref is null');
    }
  };

  const updateCurrentLocation = (newLocation: LocationCoords) => {
    if (webViewRef.current) {
      console.log('📍 WebMapView現在地更新:', newLocation);
      const message = JSON.stringify({
        type: 'updateCurrentLocation',
        location: {
          lat: newLocation.latitude,
          lng: newLocation.longitude
        }
      });
      webViewRef.current.postMessage(message);
    } else {
      console.error('❌ WebView ref is null for location update');
    }
  };

  // 外部から呼び出せるメソッドを公開
  React.useImperativeHandle(ref, () => ({
    recenter: recenterMap,
    focusOnLocation,
    clearHighlight,
    updateCurrentLocation
  }), []);

  const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

  if (isExpoGo) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.expoGoPlaceholder}>
          <Text style={styles.placeholderTitle}>🗺️ マップ表示</Text>
          <Text style={styles.placeholderSubtitle}>現在地: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}</Text>
          <Text style={styles.placeholderInfo}>
            {facilities.length}件の銭湯が見つかりました
          </Text>
          <Text style={styles.placeholderNote}>
            📱 マップ表示はDevelopment Buildで確認できます
          </Text>
          <Text style={styles.placeholderInstructions}>
            react-native-mapsはExpo Goでは利用できません。{'\n'}
            Development Buildをご利用ください。
          </Text>
        </View>
      </View>
    );
  }
  
  // APIキーが設定されていない場合のフォールバック表示
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'your_actual_api_key_here') {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <View style={styles.errorContent}>
          <Text style={styles.errorIcon}>🗺️</Text>
          <Text style={styles.errorTitle}>Google Maps APIキーが未設定</Text>
          <Text style={styles.errorMessage}>
            地図を表示するにはGoogle Maps APIキーの設定が必要です。{'\n'}
            .envファイルでEXPO_PUBLIC_GOOGLE_MAPS_API_KEYを設定してください。
          </Text>
          <Text style={styles.errorSteps}>
            {'\n'}設定手順:{'\n'}
            1. Google Cloud Console にアクセス{'\n'}
            2. Maps JavaScript API を有効化{'\n'}
            3. APIキーを作成し、.envファイルに設定{'\n'}
            4. アプリを再起動
          </Text>
        </View>
      </View>
    );
  }


  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: staticMapHTML }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="compatibility"
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error: ', nativeEvent);
        }}
        onLoadEnd={() => {
          console.log('Map loaded successfully');
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView HTTP error: ', nativeEvent.statusCode, nativeEvent.description);
        }}
      />
    </View>
  );
});

// React.memoでラップして不要な再レンダリングを防止
export default React.memo(WebMapView);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e2e8f0',
  },
  webview: {
    flex: 1,
  },
  expoGoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    textAlign: 'center',
  },
  placeholderInfo: {
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  placeholderNote: {
    fontSize: 16,
    color: '#0ea5e9',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  placeholderInstructions: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContent: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorSteps: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'left',
    lineHeight: 18,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
});