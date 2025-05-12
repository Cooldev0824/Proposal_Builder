# ESLint Improvement Plan for Proposal Builder

This document outlines a phased approach to fixing ESLint issues in the Proposal Builder project. The goal is to gradually improve code quality while minimizing disruption to ongoing development.

## Current State

As of the initial ESLint analysis, the project has:
- **511 problems** (469 errors, 42 warnings)
- Major categories of issues:
  - TypeScript type safety issues (missing return types, any usage)
  - Vue component issues (naming, attribute order, unused properties)
  - Performance and security issues (console statements, alert usage)
  - Code style issues (inconsistent formatting)

## Phased Improvement Plan

### Phase 1: Setup and Configuration (Completed)

- [x] Set up ESLint with appropriate configuration
- [x] Configure pre-commit hooks with lint-staged
- [x] Set up Prettier for consistent code formatting
- [x] Temporarily downgrade critical errors to warnings to allow gradual fixing

### Phase 2: Critical Security and Performance Issues (1 week)

**Focus areas:**
- Fix XSS vulnerabilities (v-html usage with untrusted content)
- Remove alert() calls in production code
- Improve error handling in catch blocks
- Add radix parameters to parseInt() calls

**Files to prioritize:**
- `src/components/editor/GridLayout.vue` (v-html usage)
- `src/components/editor/elements/TableElement.vue` (v-html usage)
- `src/components/editor/PdfExportDialog.vue` (alert usage)
- `src/components/editor/AdvancedColorPicker.vue` (missing radix parameters)

### Phase 3: TypeScript Type Safety (2-3 weeks)

**Focus areas:**
- Replace `any` types with proper type definitions
- Add explicit return types to functions
- Prefix unused variables with underscore
- Fix non-null assertions

**Files to prioritize:**
- `src/types/document.ts` (improve type definitions)
- `src/utils/selectionManager.ts` (many any usages)
- `src/views/EditorView.vue` (many missing return types)
- `src/components/editor/elements/DataGridElement.vue` (type issues)

### Phase 4: Vue Component Issues (2 weeks)

**Focus areas:**
- Rename components to follow multi-word naming convention
- Fix attribute ordering in templates
- Remove unused properties and refs
- Fix component naming in templates

**Files to prioritize:**
- `src/components/editor/Ruler.vue` (single-word component name)
- `src/components/editor/elements/DataGridElement.vue` (component naming)
- `src/components/editor/ElementLayerControls.vue` (unused properties)
- `src/components/editor/EditorView.vue` (unused refs)

### Phase 5: Code Style and Consistency (1 week)

**Focus areas:**
- Ensure consistent code style across the codebase
- Fix remaining ESLint warnings
- Run Prettier on all files

## Implementation Strategy

### For Each Phase:

1. **Create a branch** for the phase (e.g., `fix/eslint-phase-2`)
2. **Focus on one category** of issues at a time
3. **Run targeted ESLint** on specific files or directories
   ```bash
   npm run lint -- src/components/editor/PdfExportDialog.vue
   ```
4. **Fix issues** in the targeted files
5. **Run tests** to ensure functionality is preserved
6. **Create a pull request** for review
7. **Merge** after approval

### Automated Checks

- Pre-commit hooks will prevent committing code with new ESLint errors
- CI/CD pipeline will run ESLint checks on all pull requests

## Metrics and Tracking

We'll track progress using the following metrics:

1. **Total number of ESLint issues** (target: 0)
2. **Number of `any` types** in the codebase (target: 0)
3. **Percentage of functions with explicit return types** (target: 100%)
4. **Number of console.log statements** in production code (target: 0)

## Conclusion

By following this phased approach, we'll gradually improve the code quality of the Proposal Builder project while minimizing disruption to ongoing development. The end result will be a codebase that is more maintainable, reliable, and secure.

## References

- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Vue Style Guide](https://vuejs.org/style-guide/)
- [ESLint Rules](https://eslint.org/docs/rules/)
