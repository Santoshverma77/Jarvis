#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"
PYTHON_BIN="python3"
if [ -f "$DIR/env/bin/python3" ]; then
    PYTHON_BIN="$DIR/env/bin/python3"
fi

echo "========================================================"
echo " 🌟 STARTING KAI NATIVE DESKTOP AI ASSISTANT..."
echo "========================================================"

PYTHONPATH="$DIR:$PYTHONPATH" "$PYTHON_BIN" launch_desktop_app.py
