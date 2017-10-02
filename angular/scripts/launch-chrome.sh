#!/bin/sh
D=$(dirname "$0")
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
    --disable-web-security \
    --auto-open-devtools-for-tabs \
    --user-data-dir=$D/../build/chrome.data \
    http://localhost:23745/assets/index.html
