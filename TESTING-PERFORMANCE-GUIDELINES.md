# Testing and Performance Guidelines for Proposal Builder

This document outlines the testing and performance guidelines for the Proposal Builder project. Following these guidelines will help ensure that the codebase remains maintainable, reliable, and performant.

## Table of Contents

1. [Testing Guidelines](#testing-guidelines)
   - [Unit Testing](#unit-testing)
   - [Component Testing](#component-testing)
   - [Integration Testing](#integration-testing)
   - [Test Coverage](#test-coverage)
2. [Performance Guidelines](#performance-guidelines)
   - [Component Optimization](#component-optimization)
   - [State Management](#state-management)
   - [DOM Manipulation](#dom-manipulation)
   - [Memory Management](#memory-management)
3. [Implementation Examples](#implementation-examples)

## Testing Guidelines

### Unit Testing

Unit tests should be written for all utility functions and services. These tests should:

- Test each function in isolation
- Mock dependencies
- Cover edge cases
- Be fast and deterministic

**Example:**

```typescript
// src/tests/services/optimizedImageProcessor.test.ts
import { describe, it, expect } from 'vitest';
import { processImages } from '@/services/optimizedImageProcessor';

describe('processImages', () => {
  it('should apply correct styles for "cover" object-fit', () => {
    const mockImg = document.createElement('img');
    // Test implementation
    expect(mockImg.style.objectFit).toBe('cover');
  });
});
```

### Component Testing

Component tests should verify that:

- Components render correctly
- Props are handled properly
- Events are emitted correctly
- User interactions work as expected

**Example:**

```typescript
// src/tests/components/common/TipBox.test.ts
import { mount } from '@vue/test-utils';
import TipBox from '@/components/common/TipBox.vue';

describe('TipBox.vue', () => {
  it('renders the title when provided', () => {
    const title = 'Test Title';
    const wrapper = mount(TipBox, {
      props: { title }
    });
    expect(wrapper.text()).toContain(title);
  });
});
```

### Integration Testing

Integration tests should verify that:

- Components work together correctly
- User flows function as expected
- API interactions work correctly

**Example:**

```typescript
// src/tests/integration/documentEditing.test.ts
import { mount } from '@vue/test-utils';
import EditorView from '@/views/EditorView.vue';

describe('Document Editing', () => {
  it('should update document when text is edited', async () => {
    // Test implementation
  });
});
```

### Test Coverage

- Aim for at least 80% test coverage for all new code
- Focus on critical paths and complex logic
- Use coverage reports to identify untested code

## Performance Guidelines

### Component Optimization

- Break down large components into smaller, focused components
- Use computed properties for derived state
- Use `shallowRef` for large objects when deep reactivity isn't needed
- Implement proper cleanup in `onBeforeUnmount` lifecycle hooks

**Example of Component Optimization:**

```typescript
// Before
const state = ref({ 
  largeData: [...], 
  ui: { ... } 
});

// After
const largeData = shallowRef([...]);
const ui = ref({ ... });
```

### State Management

- Avoid deep cloning large objects
- Use structural sharing when possible
- Implement pagination for large datasets
- Optimize store actions for performance

**Example of State Management Optimization:**

```typescript
// Before
function pushState(document: Document) {
  undoStack.value.push(JSON.parse(JSON.stringify(document)));
}

// After
function pushState(document: Document) {
  // Only clone the changed section
  const { sections, ...rest } = document;
  const clonedSections = sections.map(s => 
    s.id === changedSectionId ? { ...s } : s
  );
  undoStack.value.push({ ...rest, sections: clonedSections });
}
```

### DOM Manipulation

- Minimize direct DOM manipulation
- Use Vue's reactivity system instead of manual DOM updates
- Batch DOM updates
- Use `requestAnimationFrame` instead of `setTimeout` for DOM updates

**Example of DOM Manipulation Optimization:**

```typescript
// Before
setTimeout(() => {
  element.style.transform = `translate(${x}px, ${y}px)`;
}, 0);

// After
requestAnimationFrame(() => {
  element.style.transform = `translate(${x}px, ${y}px)`;
});
```

### Memory Management

- Clean up event listeners in `onBeforeUnmount`
- Dispose of large objects when no longer needed
- Use WeakMap/WeakSet for caching when appropriate
- Avoid closure memory leaks

**Example of Memory Management:**

```typescript
// Before
onMounted(() => {
  window.addEventListener('resize', handleResize);
});

// After
onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});
```

## Implementation Examples

The project includes several examples of optimized implementations:

1. **TextElement.vue**: Optimized text editing with proper event listener cleanup
2. **optimizedImageProcessor.ts**: Extracted image processing logic for better maintainability
3. **optimizedTextProcessor.ts**: Extracted text processing logic for better maintainability

These implementations demonstrate the principles outlined in this document and should be used as references for future development.

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in a specific file
npm run test -- src/tests/components/common/TipBox.test.ts

# Run tests with coverage
npm run test:coverage
```

## Performance Profiling

Use the following tools for performance profiling:

1. Vue DevTools Performance tab
2. Chrome DevTools Performance panel
3. Memory panel for detecting memory leaks

Regular performance profiling should be part of the development process to identify and address performance issues early.
