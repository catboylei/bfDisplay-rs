#!/bin/bash
mkdir -p lua
curl -L "https://github.com/catboylei/bfDisplay-rs/releases/latest/download/bfDisplay" -o lua/bfDisplay
curl -L "https://github.com/catboylei/bfDisplay-rs/releases/latest/download/bfDisplay-rs.lua" -o lua/bfDisplay-rs.lua

chmod +x lua/bfDisplay

# this is made for lazy.nvim, not manual use
# if looking for a build script, use the Makefile provided