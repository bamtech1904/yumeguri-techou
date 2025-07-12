import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
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
  isVisited?: boolean;
}

interface WebMapViewProps {
  currentLocation: LocationCoords;
  facilities: Facility[];
  onMarkerPress?: (facility: Facility) => void;
  style?: any;
}

const WebMapView = React.forwardRef<any, WebMapViewProps>(function WebMapView({ 
  currentLocation, 
  facilities, 
  onMarkerPress, 
  style 
}, ref) {
  const webViewRef = useRef<WebView>(null);

  const generateMapHTML = () => {
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
            max-width: 200px;
            font-family: Arial, sans-serif;
        }
        .info-title {
            font-weight: bold;
            margin-bottom: 4px;
            color: #1e293b;
        }
        .info-address {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 8px;
        }
        .info-details {
            display: flex;
            justify-content: space-between;
            align-items: center;
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
    </style>
</head>
<body>
    <div id="map"></div>
    
    <script async defer src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap&language=ja&region=JP"></script>
    
    <script>
        let map;
        let infoWindow;
        
        const currentLocation = {
            lat: ${currentLocation.latitude},
            lng: ${currentLocation.longitude}
        };
        
        const facilities = ${JSON.stringify(facilities)};
        
        function initMap() {
            map = new google.maps.Map(document.getElementById('map'), {
                zoom: 15,
                center: currentLocation,
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
            
            // ユーザーの現在位置マーカー
            const userMarker = new google.maps.Marker({
                position: currentLocation,
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
            
            // 銭湯施設のマーカー
            facilities.forEach(facility => {
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
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="\${facility.isVisited ? '#10b981' : '#ef4444'}" stroke="#ffffff" stroke-width="2"/>
                                <circle cx="12" cy="9" r="2.5" fill="#ffffff"/>
                            </svg>
                        \`),
                        scaledSize: new google.maps.Size(24, 24),
                        anchor: new google.maps.Point(12, 24)
                    }
                });
                
                const contentString = \`
                    <div class="info-window">
                        <div class="info-title">\${facility.name}</div>
                        <div class="info-address">\${facility.formatted_address}</div>
                        <div class="info-details">
                            <div class="info-rating">★ \${facility.rating ? facility.rating.toFixed(1) : 'N/A'}</div>
                            \${facility.isVisited ? '<div class="info-badge">訪問済</div>' : ''}
                        </div>
                    </div>
                \`;
                
                marker.addListener('click', () => {
                    infoWindow.setContent(contentString);
                    infoWindow.open(map, marker);
                    
                    // React Nativeにマーカータップを通知
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'markerPress',
                            facility: facility
                        }));
                    }
                });
            });
            
            // 地図の中心を現在地に設定
            map.setCenter(currentLocation);
        }
        
        // React Nativeからのメッセージを受信
        document.addEventListener('message', function(e) {
            const data = JSON.parse(e.data);
            if (data.type === 'recenter') {
                map.setCenter(currentLocation);
                map.setZoom(15);
            }
        });
        
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
                    message: 'Google Maps authentication failed. Please check your API key.'
                }));
            }
        };
        
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
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'markerPress':
          if (onMarkerPress) {
            onMarkerPress(data.facility);
          }
          break;
        case 'error':
          console.error('WebView JavaScript Error:', data.message);
          console.error('File:', data.filename, 'Line:', data.lineno, 'Column:', data.colno);
          break;
        case 'authError':
          console.error('Google Maps Auth Error:', data.message);
          break;
        case 'loaded':
          console.log('WebView loaded:', data.message);
          break;
        default:
          console.log('Unknown WebView message:', data);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  const recenterMap = () => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'recenter' }));
    }
  };

  // 外部から呼び出せるメソッドを公開
  React.useImperativeHandle(ref, () => ({
    recenter: recenterMap
  }), []);

  const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
  
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
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHTML() }}
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

export default WebMapView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e2e8f0',
  },
  webview: {
    flex: 1,
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
});