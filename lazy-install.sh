#!/bin/bash
REPO="catboylei/bfDisplay-rs"
LATEST=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep tag_name | cut -d'"' -f4)

mkdir -p lua
curl -L "https://github.com/$REPO/releases/download/$LATEST/bfDisplay" -o lua/bfDisplay
curl -L "https://github.com/$REPO/releases/download/$LATEST/bfDisplay-rs.lua" -o lua/bfDisplay-rs.lua

chmod +x lua/bfDisplay

# this is made for lazy.nvim, not manual use
# if looking for a build script, use the Makefile provided