# Design Tokens (temporal)

Provisional design reference. Light theme only, derived from the palette the
project already used (Tailwind slate/sky). Names follow Material-style roles so
a future dark theme can remap values without touching component classes.

## Rules

- Components reference semantic tokens (`bg-surface`,
  `text-on-surface-variant`), never raw Tailwind colors (`slate-*`, `sky-*`).
- Tokens are declared once in `src/index.css` inside the Tailwind v4 `@theme`
  block, which generates utilities named after each token.
- Disabled controls use ~40% opacity over their normal colors (Material
  convention) instead of dedicated gray tokens.
- Interactive hover/pressed states darken via opacity modifiers
  (`bg-primary/90`) so the token system stays intact.
- Focus visibility: 2px `primary` outline with offset on all interactive
  elements.
- Shape/elevation baseline: cards `rounded-2xl` + `shadow-sm` + 1px
  `outline-variant` ring; controls `rounded-xl`; minimum touch target 44px.

## Neutral roles

| Token                | Value     | Origin   | Usage                                  |
| -------------------- | --------- | -------- | -------------------------------------- |
| `background`         | `#f8fafc` | slate-50 | App background (PWA `background_color`) |
| `on-background`      | `#0f172a` | slate-900 | Primary text (PWA `theme_color`)      |
| `surface`            | `#ffffff` | white    | Cards, sheets, navigation bar          |
| `on-surface`         | `#0f172a` | slate-900 | Text on surfaces                      |
| `on-surface-variant` | `#475569` | slate-600 | Secondary/muted text                  |
| `outline`            | `#94a3b8` | slate-400 | Input borders                         |
| `outline-variant`    | `#e2e8f0` | slate-200 | Dividers, card rings                  |

## Brand roles

| Token                 | Value     | Origin  | Usage                                     |
| --------------------- | --------- | ------- | ----------------------------------------- |
| `primary`             | `#0369a1` | sky-700 | Filled actions, active navigation, accents |
| `on-primary`          | `#ffffff` | —       | Content on primary                        |
| `primary-container`   | `#e0f2fe` | sky-100 | Tinted highlight (active tab pill)        |
| `on-primary-container`| `#075985` | sky-800 | Content on primary-container              |

## State roles

Login needs `error` now. Warning/success tokens arrive together with the
notices feature (`warn`/`info` aviso types).

| Token                 | Value     | Origin  | Usage                            |
| --------------------- | --------- | ------- | -------------------------------- |
| `error`               | `#dc2626` | red-600 | Error text, invalid input border |
| `on-error`            | `#ffffff` | —       | Content on error fills           |
| `error-container`     | `#fee2e2` | red-100 | Error banner background          |
| `on-error-container`  | `#991b1b` | red-800 | Text in error banners            |

Dark mode: TBD — override these variables under `prefers-color-scheme`; no
component class should change.
