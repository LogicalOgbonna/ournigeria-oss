// Ambient declaration for side-effect stylesheet imports, e.g. `import "./globals.css"`.
//
// Under `moduleResolution: "bundler"` TypeScript needs a module declaration for
// `.css` side-effect imports. Next provides one via its own types, but only once
// `.next/types` is generated — so a fresh checkout, a cleared build cache, or an
// editor that type-checks before `next dev` runs reports:
//   "Cannot find module or type declarations for side-effect import of './globals.css'."
// Committing this makes the declaration always present, independent of `.next`.
//
// `*.module.css` (CSS Modules) is matched more specifically by any typed
// declaration, so this does not weaken CSS Module typing.
declare module "*.css";
