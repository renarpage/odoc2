# Contributing to ODOC Digital Archive

Thanks for contributing! This guide covers the conventions that keep the
codebase consistent and easy to maintain.

## Getting set up

```bash
npm install
cp .env.example .env    # fill in your values
npm run seed
npm run dev
```

## Architecture

The app follows a layered structure. Respect the boundaries:

```
routes → controllers → services → repositories → models
```

- **routes/** — declare endpoints and attach middleware only.
- **controllers/** — parse the request, call a service, send the response. Keep
  them thin; no business logic or direct DB access.
- **services/** — all business logic lives here.
- **repositories/** — the only layer that touches Mongoose models.
- **helpers/serializers.js** — shape data for views; don't leak raw Mongo docs
  into templates.

## Coding style

- Formatting is enforced by **Prettier** and **ESLint**. Run before committing:
  ```bash
  npm run format
  npm run lint:fix
  ```
- 2-space indentation, LF line endings, UTF-8 (see `.editorconfig`).
- Prefer `const`; use `async/await` over raw promises.
- Wrap async route handlers in `core/asyncHandler` so errors reach the central
  error handler.
- Throw `ApiError` (from `core/`) for expected HTTP errors.

## Front-end conventions

- **No inline `<style>` or `<script>` blocks in EJS.** Put styles in
  `public/css/` and scripts in `public/js/`, then reference them.
- Reuse the neumorphic utility classes in `public/css/admin.css` (e.g.
  `.btn-icon-neu`, `.neu-modal`, `.form-control-odoc`) instead of ad-hoc inline
  styles.
- Because CSP blocks inline `on*` attributes, attach event handlers in JS files,
  never inline in markup.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add webhook delivery retries
fix: correct timezone dropdown overflow
docs: update environment variable table
refactor: extract settings JS to public/js
chore: bump dependencies
```

## Before opening a PR

1. `npm run lint` passes.
2. `npm run format:check` is clean.
3. The app boots (`npm run dev`) and the affected pages render.
4. Update `CHANGELOG.md` under **Unreleased**.
