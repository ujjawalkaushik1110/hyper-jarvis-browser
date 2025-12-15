import os
import json
import zipfile
from datetime import datetime

# Create Windows release package with admin attribution
windows_launcher = '''#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Hyper-Jarvis Browser v1.0-beta Launcher"""
# Admins: Ujjawal Kaushik, Jiya Singh

import sys
import subprocess
from pathlib import Path

try:
    from PyQt5.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget
    from PyQt5.QtWebEngineWidgets import QWebEngineView
    from PyQt5.QtCore import QUrl, QThread, pyqtSignal
except ImportError:
    print("Please install PyQt5: pip install PyQt5 PyQtWebEngine")
    sys.exit(1)

class HyperJarvisApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.initUI()
        
    def initUI(self):
        self.setWindowTitle("Hyper-Jarvis Browser v1.0-beta (Admin: Ujjawal Kaushik, Jiya Singh)")
        self.setGeometry(100, 100, 1200, 800)
        
        central_widget = QWidget()
        layout = QVBoxLayout()
        
        self.browser = QWebEngineView()
        self.browser.load(QUrl("https://www.google.com"))
        
        layout.addWidget(self.browser)
        central_widget.setLayout(layout)
        self.setCentralWidget(central_widget)
        self.show()

if __name__ == '__main__':
    app = QApplication(sys.argv)
    browser = HyperJarvisApp()
    sys.exit(app.exec_())
'''

# Write the launcher
with open('releases/windows/HyperJarvisBrowser_launcher.py', 'w', encoding='utf-8') as f:
    f.write(windows_launcher)

# Create Windows installation guide
windows_guide = '''# Hyper-Jarvis Browser v1.0-beta - Windows Installation Guide

## Admin Information
**Admins**: Ujjawal Kaushik, Jiya Singh
**Version**: 1.0-beta
**Type**: AI-Native Browser with Reasoning Capabilities

## System Requirements
- Windows 10/11 (64-bit)
- Python 3.8+
- 4GB RAM minimum
- Internet connection

## Installation Steps

### Method 1: Direct Python Launcher (Recommended)
1. Install Python from https://www.python.org (3.8+)
2. Open Command Prompt and install dependencies:
   ```
   pip install PyQt5 PyQtWebEngine requests
   ```
3. Run the launcher:
   ```
   python HyperJarvisBrowser_launcher.py
   ```

### Method 2: Executable (Coming Soon)
Pre-built .exe files will be available in the next release.

## Features
- AI-powered web browsing with reasoning
- Cloud-based vLLM integration
- Multi-model support (DeepSeek-R1, Qwen, etc.)
- Real-time response streaming
- Cross-platform support

## Troubleshooting

### PyQt5 Installation Issues
If PyQt5 fails to install, try:
```
pip install PyQt5 --no-cache-dir
```

### Port Already in Use
If port 8000 is already in use, modify the vLLM configuration.

## Support
For issues and feedback, please visit: https://github.com/ujjawalkaushik1110/hyper-jarvis-browser
'''

with open('releases/windows/INSTALLATION.md', 'w') as f:
    f.write(windows_guide)

# Create Android APK metadata
apk_metadata = {
    "app_name": "Hyper-Jarvis Browser",
    "version": "1.0-beta",
    "package_name": "com.hyperjarvis.browser",
    "admins": ["Ujjawal Kaushik", "Jiya Singh"],
    "description": "AI-Native browser with reasoning capabilities",
    "min_sdk": 24,
    "target_sdk": 33,
    "permissions": [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE"
    ]
}

with open('releases/android/app_metadata.json', 'w') as f:
    json.dump(apk_metadata, f, indent=2)

# Create comprehensive README
readme_content = '''# Hyper-Jarvis Browser - Beta Release v1.0

## Overview
Hyper-Jarvis Browser is an AI-native web browser with advanced reasoning capabilities, powered by state-of-the-art language models.

## Administrator Information
- **Lead Developer**: Ujjawal Kaushik
- **Co-Developer**: Jiya Singh

## Release Information
- **Version**: 1.0-beta
- **Release Date**: 2024
- **Platform Support**:
  - Windows 10/11 (64-bit)
  - Android 7.0+ (API 24+)
  - Cloud-based deployment

## Features
1. **AI-Powered Reasoning**: Integrated with DeepSeek-R1 and other models
2. **vLLM Server**: High-performance inference server
3. **Multi-Platform**: Windows Desktop, Mobile, and Cloud
4. **Real-time Streaming**: Live response generation
5. **GitHub Codespace Ready**: Cloud development environment

## Installation

### Windows
1. See `releases/windows/INSTALLATION.md`

### Android
1. Install APK file
2. Grant necessary permissions
3. Configure server endpoint

### Cloud Deployment
1. See `CLOUD_DEPLOYMENT.md` in root directory

## Architecture

```
├── desktop_apps/        # Windows PyQt5 application
├── mobile_apps/         # React Native mobile app
├── vllm_server/         # vLLM inference server
├── build_config/        # Build configurations
└── releases/            # Distribution packages
```

## Build Instructions

### Building from Source
```bash
# Windows
python build_windows_exe.py

# Android  
buildozer android release

# Docker (Cloud)
docker build -t hyper-jarvis-browser .
```

## Cloud Deployment
See `CLOUD_DEPLOYMENT.md` for complete cloud deployment instructions.

## Security & Privacy
- All models run locally or on authenticated cloud instances
- No user data is stored without consent
- HTTPS-only communication
- Model outputs are not logged

## License
Open source under MIT License

## Support
Issues and feature requests: https://github.com/ujjawalkaushik1110/hyper-jarvis-browser/issues

## Contributors
- Ujjawal Kaushik (Lead)
- Jiya Singh (Co-Developer)
'''

with open('releases/README.md', 'w') as f:
    f.write(readme_content)

print("✓ Release packages created successfully!")
print(f"\nPackages created:")
print(f"  - Windows Launcher: releases/windows/HyperJarvisBrowser_launcher.py")
print(f"  - Installation Guide: releases/windows/INSTALLATION.md")
print(f"  - Android Metadata: releases/android/app_metadata.json")
print(f"  - Release README: releases/README.md")
