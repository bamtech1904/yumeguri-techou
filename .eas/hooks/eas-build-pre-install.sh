#!/bin/bash

# EAS Build Pre-Install Hook
# Force SwiftUI iOS 16.0+ API compatibility in Docker environment

set -e

echo "🔧 [EAS Hook] Configuring SwiftUI iOS 16.0+ compatibility..."

# Ensure we're in the project root
cd $EAS_BUILD_WORKDIR

# Force iOS deployment target in all relevant configuration files
echo "📱 [EAS Hook] Setting iOS deployment target to 16.0..."

# Update any existing Podfile to enforce iOS 16.0
if [ -f "ios/Podfile" ]; then
    echo "📦 [EAS Hook] Updating Podfile deployment target..."
    sed -i '' "s/platform :ios, '[0-9.]*'/platform :ios, '16.0'/" ios/Podfile
    
    # Add explicit post_install hook to force deployment target
    if ! grep -q "post_install do" ios/Podfile; then
        cat >> ios/Podfile << 'EOF'

post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0'
      config.build_settings['SWIFT_VERSION'] = '5.0'
      
      # Force SwiftUI iOS 16.0+ API availability
      config.build_settings['OTHER_SWIFT_FLAGS'] = '-Xfrontend -enable-experimental-feature -Xfrontend ParserASTGen'
    end
  end
end
EOF
    fi
fi

# Verify app.json has correct deployment target
echo "⚙️ [EAS Hook] Verifying app.json iOS deployment target..."
if command -v node >/dev/null 2>&1; then
    node -e "
        const fs = require('fs');
        const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
        if (!appJson.expo.ios.deploymentTarget || appJson.expo.ios.deploymentTarget < '16.0') {
            appJson.expo.ios.deploymentTarget = '16.0';
            fs.writeFileSync('app.json', JSON.stringify(appJson, null, 2));
            console.log('✅ [EAS Hook] Updated app.json deploymentTarget to 16.0');
        } else {
            console.log('✅ [EAS Hook] app.json deploymentTarget already set to', appJson.expo.ios.deploymentTarget);
        }
    "
fi

# Set environment variables for Swift compilation
export IPHONEOS_DEPLOYMENT_TARGET=16.0
export SWIFT_VERSION=5.0

echo "✅ [EAS Hook] SwiftUI iOS 16.0+ compatibility configuration completed"