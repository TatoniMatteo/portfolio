# Theme

`main.scss` is the only stylesheet imported by React. Vite compiles SASS at build time.

- `_tokens.scss`: palette, spacing, radii, shadows and breakpoint mixins.
- `_themes.scss`: semantic CSS properties and light/dark modes.
- `_surfaces.scss`: shared glass surface, including opaque fallbacks.
- `_base.scss` and `_layout.scss`: reset, typography and shared page structure.
- `_navigation.scss`, `_hero.scss`, `_content.scss`, `_document.scss`: component rules.
- `_motion.scss`: keyframes and the reduced-motion override, loaded last.

Use semantic properties such as `var(--color-card)` instead of palette values in
components. Change both themes in `_themes.scss`. Use `tokens.down(mobile)` or
`tokens.up(compact)` for media queries; navigation reads the same breakpoint token.
Keep calculated animation transforms and PDF dimensions in React; put static
styles here. New modules belong in `main.scss`, with no component CSS imports.

Motion timings and easing are defined in `_themes.scss` and read by
`useMotionTheme` for React entrances, content changes and native fullscreen.
Entrances run once (12px, 420ms), content changes use 6px/180ms, and pointer
hovers lift at most 2px. The footer stays static. Reduced motion skips these
transitions; the portrait orbits pause whenever Home leaves the viewport.
