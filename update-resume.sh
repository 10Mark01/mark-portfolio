#!/usr/bin/env bash
#
# Put a new résumé on the live site.
#
#   ./update-resume.sh ~/Desktop/resume.pdf
#   ./update-resume.sh                          (finds it on the Desktop or in ~/Downloads)
#
# Copies it over public/resume.pdf, commits, pushes. Vercel redeploys on its
# own, so the site is current roughly 30 seconds later.

set -euo pipefail
cd "$(dirname "$0")"

SRC="${1:-}"

# No argument: look on the Desktop and in ~/Downloads, newest first. `ls -t`
# given file operands sorts them all together, so this is one ranking across
# both folders rather than one folder winning by default.
if [ -z "$SRC" ]; then
  CANDIDATES=$(ls -t "$HOME/Desktop"/*.pdf "$HOME/Downloads"/*.pdf 2>/dev/null || true)
  [ -n "$CANDIDATES" ] || {
    echo "no PDF on the Desktop or in ~/Downloads — pass the path explicitly" >&2
    exit 1
  }

  # Both folders collect unrelated PDFs — transcripts, forms, whatever was
  # downloaded last — so prefer a filename that looks like a résumé, and only
  # fall back to "newest of everything" when nothing matches.
  NAMED=$(printf '%s\n' "$CANDIDATES" | grep -iE '(resume|cv|mark_?samuel)' || true)
  SRC=$(printf '%s\n' "${NAMED:-$CANDIDATES}" | head -1)

  echo "picked: $SRC"
  echo "  (wrong one? pass the path: ./update-resume.sh ~/Desktop/whatever.pdf)"
fi

[ -f "$SRC" ] || { echo "no such file: $SRC" >&2; exit 1; }

# Guard against committing something that isn't a PDF, or a zero-length file
# left behind by a failed download.
head -c 4 "$SRC" | grep -q '%PDF' || { echo "not a PDF: $SRC" >&2; exit 1; }
[ -s "$SRC" ] || { echo "file is empty: $SRC" >&2; exit 1; }

PAGES=$(command -v mdls >/dev/null && mdls -raw -name kMDItemNumberOfPages "$SRC" 2>/dev/null || echo "?")
SIZE=$(du -h "$SRC" | cut -f1)
echo "• ${SIZE}, ${PAGES} page(s)"

cp "$SRC" public/resume.pdf

# Stage first, then compare against HEAD — `git diff` alone ignores untracked
# files, so a brand-new resume.pdf would look like "no change".
git add public/resume.pdf
if git diff --cached --quiet -- public/resume.pdf; then
  echo "• identical to the one already published — nothing to do"
  exit 0
fi

git commit -q -m "Update résumé"
git push -q

echo "• pushed. Live in ~30s at /resume.pdf"
