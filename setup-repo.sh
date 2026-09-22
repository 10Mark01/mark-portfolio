#!/usr/bin/env bash
#
# One-shot: turn this folder into a git repo and push it to GitHub.
#
#   ./setup-repo.sh                 # repo named mark-portfolio
#   ./setup-repo.sh some-other-name
#
# Safe to run twice — it skips anything already done.

set -euo pipefail
cd "$(dirname "$0")"

REPO_NAME="${1:-mark-portfolio}"

if [ ! -f package.json ] || [ ! -d src ]; then
  echo "error: run this from the portfolio project root." >&2
  exit 1
fi

# --- identity -------------------------------------------------------------
# Set per-repo, so your global git config is left alone.
if ! git config user.email >/dev/null 2>&1; then
  echo "git has no author identity configured for this repo."
  read -r -p "  email: " GIT_EMAIL
  read -r -p "  name:  " GIT_NAME
fi

# --- repo -----------------------------------------------------------------
if [ -d .git ]; then
  echo "• git repo already initialised"
else
  git init -q
  git branch -M main
  echo "• git repo initialised on branch main"
fi

if [ -n "${GIT_EMAIL:-}" ]; then
  git config user.email "$GIT_EMAIL"
  git config user.name "$GIT_NAME"
fi

# --- commit ---------------------------------------------------------------
git add -A
if git diff --cached --quiet; then
  echo "• nothing new to commit"
else
  STAGED=$(git diff --cached --name-only | wc -l | tr -d ' ')
  git commit -q -m "Portfolio site with embedded DE1-SoC physics simulator"
  echo "• committed $STAGED files"
fi

# Guard: the compiled simulator must be in the repo. Vercel runs `npm run
# build` and nothing else — it has no Emscripten and cannot rebuild the wasm.
if ! git ls-files --error-unmatch public/physics/physics.wasm >/dev/null 2>&1; then
  echo "warning: public/physics/physics.wasm is not tracked — the live site's" >&2
  echo "         simulator will 404. Check .gitignore for a *.wasm rule." >&2
fi

# --- remote ---------------------------------------------------------------
if git remote get-url origin >/dev/null 2>&1; then
  echo "• remote already set: $(git remote get-url origin)"
  git push -u origin main
  echo
  echo "Pushed."
  exit 0
fi

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  echo "• creating GitHub repo via gh…"
  gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
  echo
  echo "Done: $(gh repo view --json url -q .url 2>/dev/null || echo "pushed")"
  echo "Next: import it at https://vercel.com/new"
  exit 0
fi

# --- fallback: no gh, or gh not signed in ---------------------------------
cat <<EOF

Committed locally, but I can't create the GitHub repo from here.

  Either install the GitHub CLI and re-run this script:
      brew install gh && gh auth login
      ./setup-repo.sh $REPO_NAME

  Or create an empty repo (no README, no .gitignore) at
  https://github.com/new  named "$REPO_NAME", then run:

      git remote add origin https://github.com/<your-username>/$REPO_NAME.git
      git push -u origin main

Then import the repo at https://vercel.com/new — it detects Vite,
no configuration needed.
EOF
