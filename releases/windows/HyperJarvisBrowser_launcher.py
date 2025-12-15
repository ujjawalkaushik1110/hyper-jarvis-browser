#!/usr/bin/env python
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
