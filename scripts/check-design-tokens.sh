#!/usr/bin/env bash
# Design-system guard. Fails if any saas-core source file under src/ uses
# hardcoded Tailwind status-color literals that should be semantic tokens.
#
# Intent: keep the design system propagating from tokens.ts → styles.css →
# components. If you find yourself wanting `bg-red-500`, the right answer is
# almost always `bg-destructive`. If you genuinely need a one-off hue for a
# data-viz identity (a chart color, a payment-method tile), use teal/orange/
# pink/indigo/cyan/neutral — those are explicitly allowed.
#
# Run via: npm run check:tokens
# Exits 1 on first violation.

set -euo pipefail

cd "$(dirname "$0")/.."

# Status hues that MUST go through semantic tokens
# (red, emerald, green, amber, yellow, blue, violet, purple, slate, gray neutral grays).
# Hex shades that count as "status" (the pastel + saturated steps).
# Allowed decorative hues: teal, orange, pink, cyan, indigo, neutral, sky, rose, lime, fuchsia, zinc, stone.

FORBIDDEN_REGEX='(bg|text|border|hover:bg|hover:text|hover:border|focus:bg|focus:ring|active:bg|dark:bg|dark:text|dark:border|dark:hover:bg)-(red|emerald|green|amber|yellow|blue|violet|purple)-(50|100|200|300|400|500|600|700|800|900)(/[0-9]+)?'

# gray-400 is the only gray we still flag (use `bg-muted-foreground`); other gray
# shades sometimes appear in skeletons/animations and aren't worth blocking.
GRAY_REGEX='(bg|text|border)-gray-(400|500|600|700)(/[0-9]+)?'

violations_a=$(grep -rEn "$FORBIDDEN_REGEX" src --include="*.tsx" --include="*.ts" 2>/dev/null || true)
violations_b=$(grep -rEn "$GRAY_REGEX" src --include="*.tsx" --include="*.ts" 2>/dev/null || true)

violations="$violations_a"
if [[ -n "$violations_b" ]]; then
  violations="${violations}${violations:+$'\n'}${violations_b}"
fi

# Raw `bg-primary ... hover:bg-primary/90` (or destructive) className strings
# WITHOUT the Polaris bevel. These are buttons trying to look primary but
# skipping the design system. Bevel comes from <Button variant="default"> or
# from the polaris-bevel codemod's shadow-button-primary class.
# Single-line check — works because className strings on raw buttons in this
# codebase are always on one line.
violations_c=$(grep -rEn 'className=("|`)[^"`]*bg-primary\b[^"`]*hover:bg-primary/90' src --include="*.tsx" --include="*.ts" 2>/dev/null | grep -vE 'shadow-button' || true)
violations_d=$(grep -rEn 'className=("|`)[^"`]*bg-destructive\b[^"`]*hover:bg-destructive/90' src --include="*.tsx" --include="*.ts" 2>/dev/null | grep -vE 'shadow-button' || true)

# Flat outline-style buttons (`rounded-{lg|md|button} border ... hover:bg-muted`)
# masquerading as action buttons but without `shadow-button` or `bg-card`/`bg-background`
# (form-field-shaped, with input bg, are excluded — they're not buttons).
violations_e=$(grep -rEn 'className=("|`)[^"`]*\brounded-(lg|md|button)\s+border\b[^"`]*\bhover:bg-muted' src --include="*.tsx" --include="*.ts" 2>/dev/null | grep -vE 'shadow-button|bg-card|bg-background|bg-primary|bg-destructive|bg-popover|bg-muted/|border-input' || true)
if [[ -n "$violations_e" ]]; then
  violations="${violations}${violations:+$'\n'}${violations_e}"
fi

if [[ -n "$violations_c" ]]; then
  violations="${violations}${violations:+$'\n'}${violations_c}"
fi
if [[ -n "$violations_d" ]]; then
  violations="${violations}${violations:+$'\n'}${violations_d}"
fi

if [[ -n "$violations" ]]; then
  echo "❌ Design-system violation: hardcoded color literal(s) or un-beveled primary button(s) found." >&2
  echo "" >&2
  echo "Use semantic tokens instead:" >&2
  echo "  bg-{red,destructive}-…       → bg-destructive | bg-destructive-soft" >&2
  echo "  bg-{emerald,green}-…         → bg-success     | bg-success-soft" >&2
  echo "  bg-{amber,yellow}-…          → bg-warning     | bg-warning-soft" >&2
  echo "  bg-blue-…                    → bg-info        | bg-info-soft" >&2
  echo "  bg-{violet,purple}-…         → bg-magic       | bg-magic-soft" >&2
  echo "  bg-gray-{400,500,…}          → bg-muted | bg-muted-foreground" >&2
  echo "  dark:bg/text/border-…        → drop entirely  (tokens handle dark)" >&2
  echo "" >&2
  echo "Decorative hues (teal, orange, pink, cyan, indigo, neutral) are allowed when used as data-viz identity." >&2
  echo "" >&2
  echo "For primary/destructive buttons, use <Button variant='default'|'destructive'> instead of a raw <button>" >&2
  echo "with className 'bg-primary ... hover:bg-primary/90'. Or add 'shadow-button-primary active:shadow-button-inset border border-primary'." >&2
  echo "" >&2
  echo "Violations:" >&2
  echo "$violations" >&2
  exit 1
fi

echo "✅ No hardcoded status colors found."
