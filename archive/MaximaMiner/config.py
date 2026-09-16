import os
import shutil
from pathlib import Path

# Auto-detect Maxima executable
DEFAULT_MAXIMA_PATH = r"C:\maxima-5.46.0\bin\maxima.bat"

def get_maxima_executable() -> str:
    # 1. Check explicit default path
    if os.path.exists(DEFAULT_MAXIMA_PATH):
        return DEFAULT_MAXIMA_PATH
    
    # 2. Check PATH
    which_maxima = shutil.which("maxima")
    if which_maxima:
        return which_maxima
        
    which_bat = shutil.which("maxima.bat")
    if which_bat:
        return which_bat

    raise FileNotFoundError(
        "Maxima executable not found! Please set DEFAULT_MAXIMA_PATH in config.py or add Maxima to PATH."
    )
