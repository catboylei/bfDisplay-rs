.PHONY: build rust lua

rust:
	cargo build --release
	cp target/release/bfDisplay ~/.config/nvim/lua

lua:
	cd plugin && npx tstl
	cp plugin/target/bfDisplay-rs.lua ~/.config/nvim/lua

build: rust lua