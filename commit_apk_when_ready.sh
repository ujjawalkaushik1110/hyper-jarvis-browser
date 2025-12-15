#!/bin/bash

echo "Waiting for APK build to complete..."

# Wait for APK to be created (max 30 minutes)
for i in {1..180}; do
  if [ -f "bin/hyper-jarvis-1.0.0-armeabi-v7a-debug.apk" ]; then
    echo "✓ APK file found!"
    
    # Create releases/android directory
    mkdir -p releases/android
    
    # Copy APK to releases
    cp bin/hyper-jarvis-1.0.0-armeabi-v7a-debug.apk releases/android/
    echo "✓ APK copied to releases/android/"
    
    # Add all files to git
    git add -A
    echo "✓ All files added to git"
    
    # Commit
    git commit -m "feat: Add Android APK beta release v1.0 - AI Agent built app with DeepSeek-R1 integration"
    echo "✓ Files committed"
    
    # Push
    git push origin main
    echo "✓ Pushed to GitHub"
    
    echo ""
    echo "================================================"
    echo "✓ ANDROID APK RELEASE COMPLETE!"
    echo "================================================"
    echo "APK Location: releases/android/hyper-jarvis-1.0.0-armeabi-v7a-debug.apk"
    echo "GitHub: https://github.com/ujjawalkaushik1110/hyper-jarvis-browser"
    echo "================================================"
    
    exit 0
  fi
  
  echo "Waiting... ($i/180) - $(date)"
  sleep 10
done

echo "✗ APK build timeout after 30 minutes"
exit 1
