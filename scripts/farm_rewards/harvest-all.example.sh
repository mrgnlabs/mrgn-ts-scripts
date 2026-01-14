#!/bin/bash

# Example batch script to harvest multiple farm rewards
# 
# Usage:
#   chmod +x harvest-all.sh
#   ./harvest-all.sh

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🌾 Starting batch farm rewards harvest..."
echo ""

# Array of config files to process
CONFIG_FILES=(
  "$SCRIPT_DIR/usdc-kmno-0.json"
  "$SCRIPT_DIR/sol-kmno-0.json"
  "$SCRIPT_DIR/usdt-kmno-0.json"
)

SUCCESS_COUNT=0
FAIL_COUNT=0

for config_file in "${CONFIG_FILES[@]}"; do
  if [ ! -f "$config_file" ]; then
    echo "⚠️  Skipping $config_file (file not found)"
    continue
  fi
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Processing: $(basename $config_file)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if cd "$ROOT_DIR" && ts-node scripts/harvest_farm_rewards.ts "$config_file"; then
    echo "✅ Successfully harvested: $(basename $config_file)"
    ((SUCCESS_COUNT++))
  else
    echo "❌ Failed to harvest: $(basename $config_file)"
    ((FAIL_COUNT++))
  fi
  
  echo ""
  
  # Optional: Add a delay between harvests
  # sleep 2
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Batch harvest complete!"
echo "   Successful: $SUCCESS_COUNT"
echo "   Failed: $FAIL_COUNT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

