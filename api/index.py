import sys
import os

# Đảm bảo Python tìm thấy package `app` từ thư mục gốc project
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app  # noqa: F401  — Vercel dùng biến `app` này
