# Changelog

All notable changes to this project will be documented in this file.

## [2.1.1] - 2025-08-13

### Fixed
- Remove `poolAlias` from MySQL2 connection config to eliminate deprecation warning
- Fixed: "Ignoring invalid configuration option passed to Connection: poolAlias" warning
- Internal: Clean configuration object before passing to mysql.createPool()

### Technical Details
- The `poolAlias` property is now properly extracted before creating MySQL2 connection pool
- No breaking changes - all functionality remains the same
- Backward compatible with existing code

## [2.1.0] - Previous release
- Previous features and functionality
