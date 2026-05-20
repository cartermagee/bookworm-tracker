module.exports = {
  "frontend/**/*.{ts,tsx,js,jsx}": [
    "pnpm --prefix frontend exec prettier --write",
    "pnpm --prefix frontend exec eslint --max-warnings=0",
  ],
  "frontend/**/*.{json,md,css}": [
    "pnpm --prefix frontend exec prettier --write",
  ],
  // dotnet format on staged C# files. Scopes to backend solution.
  "backend/**/*.cs": [
    "bash -c 'cd backend && dotnet format --include $(printf \"%s \" \"$@\")' --",
  ],
};
