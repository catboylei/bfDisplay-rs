# Changelog

## [Unreleased]

### Added
- Added global enabled setting in config
- Added command to open config file

### Fixed
- Remove autostart autocmd in cleanup step
- cleaned up debug prints

### Changed 
- Parse settings from external lua config file
- Move logic to backend for a *significant* performance boost

## [1.1.0] - 2026-03-11

### Added 
- ASCII display values in the cell display (1-127)
- lazy.nvim support

### Fixed
- Pointer off-by-one error in cell display
- Mousescroll not being properly set on cell display
- Fixed error on edge case if exiting Lazy

### Changed
- Avoid piling up rpc requests, just skip if pending to makes display feel more responsive

## [1.0.0] - 2026-03-10
- Initial release

### Added
- Live tape display at cursor position
- I/O interpreter
- Infinite loop detection
- Passed compliance tests