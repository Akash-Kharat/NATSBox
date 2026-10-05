# CI/CD & Releases

Workflows live in [`.github/workflows`](../.github/workflows).

## CI (`ci.yml`)

Runs on pushes and pull requests to `main`, and manually.

| Job | What it does |
| --- | --- |
| `verify` | `npm ci`, `npm run typecheck`, `npm test` (Ubuntu) |
| `build` | `npm run build` on Ubuntu, Windows and macOS; asserts `dist/` output exists |
| `audit` | `npm audit --omit=dev --audit-level=high` for production dependencies |

Hardening: read-only `contents` permission, concurrency cancellation on non-`main` refs, job timeouts, npm caching, Dependabot for npm and Actions (`.github/dependabot.yml`).

## Release (`release.yml`)

Triggered by pushing a tag matching `v*.*.*` (or manually with an existing tag).

1. **verify**: checks the tag equals `v` + `package.json` version, then typecheck and tests.
2. **package**: builds installers on Windows (`.exe`), macOS (`.dmg`) and Linux (`.AppImage`) with `electron-builder --publish never` and uploads them as artifacts.
3. **publish**: generates `SHA256SUMS.txt` and creates a GitHub Release with auto-generated notes. Tags containing `-` (e.g. `v1.1.0-rc.1`) are marked pre-release. Only this job has `contents: write`.

### Cutting a release

```bash
# 1. update version in package.json and CHANGELOG.md, commit
npm version 1.1.0 --no-git-tag-version
# 2. tag and push
git tag v1.1.0
git push origin main v1.1.0
```

### Code signing (optional)

Without secrets, builds are unsigned. To sign, add repository secrets:

| Secret | Purpose |
| --- | --- |
| `CSC_LINK`, `CSC_KEY_PASSWORD` | macOS signing certificate (base64 `.p12` or URL) and password |
| `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD` | Windows code-signing certificate and password |

macOS notarization is not configured; add `notarize` settings to `electron-builder.yml` plus Apple credentials if needed.

## Recommended repository settings

- Protect `main`: require the `Typecheck & Test` and `Build` checks and a pull request before merging.
- Protect `v*` tags so only maintainers can create releases.
- Enable Dependabot alerts and secret scanning.

## Not yet included

- No linter is configured, so CI has no lint step.
- Auto-update (`electron-updater`) is not set up.
- Custom app icons are absent (electron-builder's default icon is used).
