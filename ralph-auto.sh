#!/bin/bash
# Ralph Auto-Restart Script
# Run: ./ralph-auto.sh

PROJECT_DIR="/Users/emreyildirim/Documents/projects/credit-ledger-on-trust"
cd "$PROJECT_DIR"

echo "🔄 Ralph Auto-Restart Loop Started"
echo "Press Ctrl+C to stop"
echo ""

LOOP_COUNT=0

while true; do
    LOOP_COUNT=$((LOOP_COUNT + 1))
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔄 Ralph Loop #$LOOP_COUNT - $(date '+%H:%M:%S')"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    ralph --monitor

    EXIT_CODE=$?
    echo ""
    echo "⚠️ Ralph stopped with exit code: $EXIT_CODE"
    echo "🔄 Restarting in 3 seconds..."
    sleep 3
done
