# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Site-wide **maintenance mode** with a dedicated page; only admins can bypass.
- Expanded **system settings**: SEO/meta, content limits, backup, SMTP test.
- Full **user management** (super admin CRUD; standard admin read-only).
- Reusable neumorphic UI classes (`.btn-icon-neu`, `.btn-outline-neu`,
  `.neu-modal`, `.user-avatar`, etc.).
- Project tooling: ESLint, Prettier, EditorConfig, MIT license.

### Changed
- Migrated from the in-memory `data/store.js` to a MongoDB-backed, layered
  architecture (routes → controllers → services → repositories → models).
- Separated page CSS/JS out of EJS templates into `public/css` and `public/js`.
- Rewrote README and `package.json` to match the real backend.

### Removed
- Sidebar **Branding** section and its routes.
- Security Protocols settings block.
- `ODOC.rar` binary artifact from version control.

## [1.0.0]
- Initial ODOC Digital Archive release.
