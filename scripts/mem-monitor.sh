#!/bin/zsh
# Samples RSS of OUR processes only — puppeteer-headless Chrome (the eval
# browsers, identified by the --headless/--no-sandbox flags the user's GUI
# Chrome never carries) plus node — every 8s into eval-results/mem.log.
# This is the throttle signal for the "keep our footprint under ~8GB" guard.
LOG="$(dirname "$0")/../eval-results/mem.log"
while true; do
  CHROME_KB=$(ps -axww -o rss,command | grep -i "Google Chrome" | grep -E -- "--headless|--no-sandbox" | grep -v grep | awk '{s+=$1} END{print s+0}')
  NODE_KB=$(ps -axww -o rss,command | grep -E "[ /]node " | grep -v grep | awk '{s+=$1} END{print s+0}')
  TOTAL_KB=$((CHROME_KB + NODE_KB))
  CHROME_GB=$(echo "scale=2; $CHROME_KB/1048576" | bc)
  TOTAL_GB=$(echo "scale=2; $TOTAL_KB/1048576" | bc)
  NPROC=$(ps -axww -o command | grep -i "Google Chrome" | grep -E -- "--headless|--no-sandbox" | grep -vc grep)
  echo "$(date +%H:%M:%S) ourChromeGB=$CHROME_GB ourTotalGB=$TOTAL_GB headlessProcs=$NPROC" >> "$LOG"
  sleep 8
done
