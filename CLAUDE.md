Please see .cursor/rules/ for a comprehensive overview of this project and its stack

To do:

- ✅ Upgrade to tailwind 4 (COMPLETED)
- Update the color palette in `src/app/globals.css`

## Tailwind 4 Upgrade Assessment

**Complexity: LOW-MEDIUM** (4-6 hours estimated)

**Current State:**
- Tailwind 3.4.1 with standard shadcn/ui setup
- 114 class occurrences across 10+ files
- HeroUI component library integration
- Extensive CSS variables in globals.css

**Key Breaking Changes:**
- CSS-first configuration (no more JS config)
- `@import "tailwindcss"` instead of `@tailwind` directives
- Important modifier syntax: `!h-10` → `h-10!`
- CSS variable syntax: `mr-[var(--x)]` → `mr-(--x)`
- Border utility no longer defaults to gray-200
- Requires Node.js 20+ for migration tool

**Migration Steps:**
1. Create upgrade branch
2. Update to Node.js 20+
3. Run `pnpm add tailwindcss@^4.0.0`
4. Use Tailwind's automated migration tool
5. Convert tailwind.config.ts to CSS-first approach
6. Update globals.css imports
7. Fix syntax breaking changes
8. Test HeroUI compatibility
9. Visual regression testing

**Risk Factors:**
- HeroUI compatibility needs verification
- Custom CSS variables may need adjustment
- Drops support for older browsers (Safari <16.4, Chrome <111)

## ✅ Upgrade Completed Successfully

**Date:** 2025-08-02  
**Actual Time:** ~1 hour  
**Branch:** tailwind-v4-upgrade

**Changes Made:**
1. ✅ Updated Tailwind CSS to v4.1.11
2. ✅ Installed @tailwindcss/postcss plugin  
3. ✅ Converted tailwind.config.ts to simplified v4 format
4. ✅ Migrated theme configuration to CSS @theme blocks in globals.css
5. ✅ Updated PostCSS configuration
6. ✅ Replaced @tailwind directives with @import "tailwindcss"
7. ✅ Added dark mode theme with @theme reference(dark)
8. ✅ Verified build process works correctly
9. ✅ Confirmed HeroUI compatibility
10. ✅ Passed linting

**Performance Improvements:**
- Build process now uses Tailwind v4's high-performance engine
- Expected 5x faster full builds, 100x faster incremental builds

**Next Steps:**
- Merge to main branch when ready
- Monitor for any visual regressions in production
