#!/bin/bash
LATEST="1.0.0" // todo update this every major release lmao

mkdir -p lua
curl -L "https://github.com/catboylei/bfDisplay-rs/releases/download/$LATEST/bfDisplay" -o lua/bfDisplay
curl -L "https://github.com/catboylei/bfDisplay-rs/releases/download/$LATEST/bfDisplay-rs.lua" -o lua/bfDisplay-rs.lua

chmod +x lua/bfDisplay

# this is made for lazy.nvim, not manual use
# if looking for a build script, use the Makefile provided