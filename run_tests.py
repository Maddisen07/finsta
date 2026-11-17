import os
import sys
import pytest

if __name__ == "__main__":
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend"))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    exit_code = pytest.main([
        "backend/tests",
        "-v",
        "-p", "no:warnings"
    ])
    sys.exit(exit_code)
