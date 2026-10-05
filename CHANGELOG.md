# Changelog

All notable changes are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).

## [Unreleased]

### Added
- User guide and project documentation under `docs/`.
- GitHub Actions CI (typecheck, tests, cross-platform build, dependency audit) and tag-driven Release workflow.
- `typecheck` npm script, Dependabot configuration, PR template.

### Changed
- Consolidated electron-builder configuration into `electron-builder.yml`; removed references to missing icon files.

## [1.0.0]

- Initial release: connections, Pub/Sub, Request/Reply, JetStream, KV Store, load testing, Docker server management and monitoring.
