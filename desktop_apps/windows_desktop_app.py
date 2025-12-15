#!/usr/bin/env python3
"""
Hyper-Jarvis Windows Desktop Application
PyQt5-based GUI for browser automation with DeepSeek LLM integration
"""

import sys
import os
import json
import asyncio
import requests
from typing import Optional
from pathlib import Path
from datetime import datetime

import PyQt5.QtWidgets as QtWidgets
import PyQt5.QtCore as QtCore
import PyQt5.QtGui as QtGui
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtCore import QThread, pyqtSignal

# Configuration
LLM_SERVER_URL = os.environ.get("LLM_SERVER_URL", "http://localhost:8000")
APP_VERSION = "1.0.0"

class LLMWorker(QThread):
    """Worker thread for LLM API calls"""
    finished = pyqtSignal(str)
    error = pyqtSignal(str)
    
    def __init__(self, prompt: str):
        super().__init__()
        self.prompt = prompt
    
    def run(self):
        try:
            response = requests.post(
                f"{LLM_SERVER_URL}/v1/completions",
                json={
                    "prompt": self.prompt,
                    "max_tokens": 512,
                    "temperature": 0.7,
                },
                timeout=60
            )
            response.raise_for_status()
            data = response.json()
            result = data["choices"][0]["text"]
            self.finished.emit(result)
        except Exception as e:
            self.error.emit(f"Error: {str(e)}")

class MainWindow(QtWidgets.QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle(f"Hyper-Jarvis Browser - v{APP_VERSION}")
        self.setGeometry(100, 100, 1200, 800)
        self.setStyleSheet(self.get_stylesheet())
        self.llm_worker = None
        self.init_ui()
        self.check_llm_server()
    
    def init_ui(self):
        """Initialize UI components"""
        central_widget = QtWidgets.QWidget()
        self.setCentralWidget(central_widget)
        layout = QtWidgets.QVBoxLayout()
        
        # Top toolbar
        toolbar_layout = QtWidgets.QHBoxLayout()
        
        # Server status
        self.status_label = QtWidgets.QLabel("LLM Server: Checking...")
        self.status_label.setStyleSheet("color: orange; font-weight: bold;")
        toolbar_layout.addWidget(self.status_label)
        toolbar_layout.addStretch()
        
        # Settings button
        settings_btn = QtWidgets.QPushButton("⚙ Settings")
        settings_btn.clicked.connect(self.show_settings)
        toolbar_layout.addWidget(settings_btn)
        
        layout.addLayout(toolbar_layout)
        
        # Main content splitter
        splitter = QtWidgets.QSplitter(QtCore.Qt.Horizontal)
        
        # Left panel - Input
        left_panel = QtWidgets.QWidget()
        left_layout = QtWidgets.QVBoxLayout(left_panel)
        
        left_layout.addWidget(QtWidgets.QLabel("Browser Task"))
        self.prompt_input = QtWidgets.QTextEdit()
        self.prompt_input.setPlaceholderText(
            "Enter your browser automation task here...\n\n"
            "Example: 'Navigate to google.com and search for python tutorials'"
        )
        left_layout.addWidget(self.prompt_input)
        
        # Execute button
        execute_btn = QtWidgets.QPushButton("Execute Task")
        execute_btn.clicked.connect(self.execute_task)
        execute_btn.setStyleSheet("background-color: #4CAF50; color: white; padding: 10px; font-weight: bold;")
        left_layout.addWidget(execute_btn)
        
        left_panel.setMaximumWidth(400)
        splitter.addWidget(left_panel)
        
        # Right panel - Output/Browser
        right_panel = QtWidgets.QWidget()
        right_layout = QtWidgets.QVBoxLayout(right_panel)
        right_layout.addWidget(QtWidgets.QLabel("Response / Browser"))
        
        # Tab widget for output types
        self.tabs = QtWidgets.QTabWidget()
        
        # Output tab
        self.output_text = QtWidgets.QTextEdit()
        self.output_text.setReadOnly(True)
        self.tabs.addTab(self.output_text, "LLM Response")
        
        # Browser tab
        self.browser_view = QWebEngineView()
        self.tabs.addTab(self.browser_view, "Browser")
        
        right_layout.addWidget(self.tabs)
        splitter.addWidget(right_panel)
        
        splitter.setStretchFactor(0, 1)
        splitter.setStretchFactor(1, 2)
        
        layout.addWidget(splitter)
        
        # Status bar
        self.progress_bar = QtWidgets.QProgressBar()
        self.progress_bar.setVisible(False)
        layout.addWidget(self.progress_bar)
        
        central_widget.setLayout(layout)
    
    def check_llm_server(self):
        """Check if LLM server is running"""
        try:
            response = requests.get(f"{LLM_SERVER_URL}/health", timeout=5)
            if response.status_code == 200:
                self.status_label.setText("LLM Server: Connected ✓")
                self.status_label.setStyleSheet("color: green; font-weight: bold;")
                return True
        except:
            pass
        
        self.status_label.setText("LLM Server: Disconnected ✗")
        self.status_label.setStyleSheet("color: red; font-weight: bold;")
        self.show_error(f"Cannot connect to LLM Server at {LLM_SERVER_URL}")
        return False
    
    def execute_task(self):
        """Execute browser task using LLM"""
        prompt = self.prompt_input.toPlainText().strip()
        if not prompt:
            self.show_error("Please enter a task description")
            return
        
        self.progress_bar.setVisible(True)
        self.progress_bar.setValue(0)
        self.output_text.setText("Processing...")
        
        self.llm_worker = LLMWorker(prompt)
        self.llm_worker.finished.connect(self.on_llm_response)
        self.llm_worker.error.connect(self.on_llm_error)
        self.llm_worker.start()
    
    def on_llm_response(self, response: str):
        """Handle LLM response"""
        self.output_text.setText(response)
        self.progress_bar.setVisible(False)
    
    def on_llm_error(self, error: str):
        """Handle LLM error"""
        self.output_text.setText(error)
        self.progress_bar.setVisible(False)
    
    def show_settings(self):
        """Show settings dialog"""
        dialog = QtWidgets.QDialog(self)
        dialog.setWindowTitle("Settings")
        dialog.setGeometry(400, 300, 400, 200)
        
        layout = QtWidgets.QVBoxLayout()
        layout.addWidget(QtWidgets.QLabel("LLM Server URL:"))
        
        url_input = QtWidgets.QLineEdit()
        url_input.setText(LLM_SERVER_URL)
        layout.addWidget(url_input)
        
        save_btn = QtWidgets.QPushButton("Save")
        save_btn.clicked.connect(lambda: self.save_settings(url_input.text()))
        layout.addWidget(save_btn)
        
        dialog.setLayout(layout)
        dialog.exec_()
    
    def save_settings(self, url: str):
        """Save settings"""
        global LLM_SERVER_URL
        LLM_SERVER_URL = url
        os.environ["LLM_SERVER_URL"] = url
        self.check_llm_server()
    
    def show_error(self, message: str):
        """Show error dialog"""
        dlg = QtWidgets.QMessageBox(self)
        dlg.setWindowTitle("Error")
        dlg.setText(message)
        dlg.setIcon(QtWidgets.QMessageBox.Warning)
        dlg.exec_()
    
    @staticmethod
    def get_stylesheet() -> str:
        return """
        QMainWindow, QWidget {
            background-color: #f5f5f5;
            color: #333;
        }
        QPushButton {
            background-color: #2196F3;
            color: white;
            border: none;
            padding: 8px;
            border-radius: 4px;
            font-weight: bold;
        }
        QPushButton:hover {
            background-color: #1976D2;
        }
        QTextEdit, QLineEdit {
            background-color: white;
            border: 1px solid #ccc;
            padding: 5px;
            border-radius: 4px;
        }
        QLabel {
            color: #333;
            font-weight: bold;
        }
        """

def main():
    app = QtWidgets.QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()
