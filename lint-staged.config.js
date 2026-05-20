module.exports = {
  "frontend/**/*.{ts,tsx,js,jsx}": [
    "pnpm --prefix frontend exec prettier --write",
    "pnpm --prefix frontend exec eslint --max-warnings=0",
  ],
  "frontend/**/*.{json,md,css}": [
    "pnpm --prefix frontend exec prettier --write",
  ],
  // dotnet format requires a full compilation pass and is too slow for a pre-commit hook.
  // Backend style is enforced in CI via `dotnet build -warnaserror` (see .github/workflows/ci.yml).
  // The entry below is intentionally a no-op: it echoes the staged file list so lint-staged
  // still "processes" the pattern and doesn't warn about an empty runner.
  "backend/**/*.cs": ["echo"],
};
