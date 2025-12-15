import os
import shutil
from pathlib import Path

# Create a temporary copy of the app with admin attribution
app_content = open('desktop_apps/windows_desktop_app.py', 'r').read()

# Add admin attribution in the title bar
app_content = app_content.replace(
    'Hyper-Jarvis Browser',
    'Hyper-Jarvis Browser v1.0-beta (Admin: Ujjawal Kaushik, Jiya Singh)'
)

# Write modified app to temp file
with open('temp_app.py', 'w') as f:
    f.write(app_content)

# Create build directory
os.makedirs('releases/windows', exist_ok=True)

# Run PyInstaller
os.system('pyinstaller --onefile --windowed --name HyperJarvisBrowser temp_app.py')

# Move the exe to a release folder
if os.path.exists('dist/HyperJarvisBrowser.exe'):
    shutil.copy('dist/HyperJarvisBrowser.exe', 'releases/windows/HyperJarvisBrowser_v1.0-beta.exe')
    print("\u2713 Windows EXE built successfully!")
else:
    print("\u2717 Build failed - executable not found")

# Clean up
os.remove('temp_app.py')
shutil.rmtree('build', ignore_errors=True)
