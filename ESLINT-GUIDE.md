# ESLint Guide for Proposal Builder

This guide explains how to use ESLint in the Proposal Builder project to maintain code quality and consistency.

## ESLint Configuration

The project uses ESLint with the following configuration:

- **Configuration File**: `eslint.config.js` (using the new flat config format)
- **Supported File Types**: JavaScript (`.js`), TypeScript (`.ts`), and Vue (`.vue`) files
- **Ignored Paths**: `node_modules`, `dist`, `*.config.js`, and `server` directory

## Running ESLint

You can run ESLint using the following npm scripts:

```bash
# Check for ESLint issues
npm run lint

# Fix ESLint issues automatically where possible
npm run lint:fix
```

## Common ESLint Rules

### TypeScript Rules

- **No Explicit Any**: Using `any` type is allowed but will generate a warning. Try to use more specific types when possible.
  ```typescript
  // Warning
  function process(data: any) { ... }
  
  // Better
  function process(data: Record<string, unknown>) { ... }
  ```

- **Unused Variables**: Variables, parameters, and caught errors that are not used should be prefixed with an underscore (`_`).
  ```typescript
  // Warning
  function calculate(x, y, z) {
    return x + y; // z is unused
  }
  
  // Better
  function calculate(x, y, _z) {
    return x + y;
  }
  ```

### Vue Rules

- **Attribute Order**: Attributes in Vue components should follow a specific order. Directive attributes (like `v-if`, `v-for`) should come before other attributes.
  ```vue
  <!-- Warning -->
  <div class="container" v-if="isVisible">...</div>
  
  <!-- Better -->
  <div v-if="isVisible" class="container">...</div>
  ```

- **Max Attributes Per Line**: In Vue templates, there should be at most 3 attributes on a single line for singleline elements, and 1 attribute per line for multiline elements.

### JavaScript/General Rules

- **Quotes**: Always use double quotes for strings.
  ```javascript
  // Warning
  const name = 'John';
  
  // Better
  const name = "John";
  ```

- **Semicolons**: Always use semicolons at the end of statements.
  ```javascript
  // Warning
  const value = 42
  
  // Better
  const value = 42;
  ```

- **Trailing Commas**: Always use trailing commas in multiline arrays and objects.
  ```javascript
  // Warning
  const items = [
    "item1",
    "item2"
  ];
  
  // Better
  const items = [
    "item1",
    "item2",
  ];
  ```

## Fixing Common Issues

### Fixing Unused Variables

If you have a variable that you're not using but need to keep for future use, prefix it with an underscore:

```typescript
// Before
const result = calculateValue();
// result is not used

// After
const _result = calculateValue();
```

### Fixing 'any' Type Warnings

Replace `any` with more specific types:

```typescript
// Before
function processData(data: any) { ... }

// After
interface DataItem {
  id: string;
  value: number;
}

function processData(data: DataItem) { ... }
```

### Fixing Attribute Order in Vue Components

Ensure that directive attributes come before other attributes:

```vue
<!-- Before -->
<div class="container" ref="myRef" v-if="isVisible">...</div>

<!-- After -->
<div v-if="isVisible" class="container" ref="myRef">...</div>
```

## Customizing ESLint Rules

If you need to customize ESLint rules for your project, you can modify the `eslint.config.js` file. The configuration is organized into sections for different file types:

- Base JS configuration
- TypeScript configuration
- Vue configuration

Each section has its own set of rules that can be adjusted as needed.

## Disabling ESLint for Specific Lines

If you need to disable ESLint for a specific line or section of code, you can use the following comments:

```javascript
// eslint-disable-next-line
const value = 'single quotes';  // This line won't trigger a warning

/* eslint-disable */
// Multiple lines with ESLint disabled
const value1 = 'single quotes';
const value2 = 'more single quotes';
/* eslint-enable */
```

For TypeScript files, you might need to use:

```typescript
// @ts-ignore
const value: any = getSomeValue();  // Ignore TypeScript errors for this line
```

## Conclusion

Following these ESLint rules will help maintain code quality and consistency across the Proposal Builder project. If you have any questions or need to adjust the rules, please discuss with the team before making changes to the ESLint configuration.
