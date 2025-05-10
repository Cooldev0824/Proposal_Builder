/**
 * Element Component Loader
 *
 * This utility provides functions for loading element components asynchronously
 * with consistent error handling and loading states.
 */

import { defineAsyncComponent } from "vue";
import type { Component } from "vue";

// Error component for async loading failures
const ErrorComponent = {
  template: '<div class="error-loading">Error loading component</div>',
  props: ["error"],
};

// Loading component for async loading
const LoadingComponent = {
  template: '<div class="loading-component">Loading...</div>',
};

/**
 * Create an async component with standard error and loading handling
 * @param path Path to the component
 * @param errorMessage Custom error message
 * @returns Async component
 */
export function createAsyncElementComponent(
  path: string,
  errorMessage: string = "Error loading component"
): Component {
  return defineAsyncComponent({
    // @vite-ignore - This dynamic import is handled at runtime
    loader: () => import(/* @vite-ignore */ path),
    timeout: 3000,
    errorComponent: {
      template: `<div class="error-loading">${errorMessage}</div>`,
    },
    loadingComponent: LoadingComponent,
  });
}

// Define async components with error handling
const TextElement = defineAsyncComponent({
  loader: () => import("../components/editor/elements/TextElement.vue"),
  timeout: 3000,
  errorComponent: {
    template: '<div class="error-loading">Error loading text element</div>',
  },
  loadingComponent: LoadingComponent,
});

const ImageElement = defineAsyncComponent({
  loader: () => import("../components/editor/elements/ImageElement.vue"),
  timeout: 3000,
  errorComponent: {
    template: '<div class="error-loading">Error loading image element</div>',
  },
  loadingComponent: LoadingComponent,
});

const ShapeElement = defineAsyncComponent({
  loader: () => import("../components/editor/elements/ShapeElement.vue"),
  timeout: 3000,
  errorComponent: {
    template: '<div class="error-loading">Error loading shape element</div>',
  },
  loadingComponent: LoadingComponent,
});

const TableElement = defineAsyncComponent({
  loader: () => import("../components/editor/elements/SimpleTableElement.vue"),
  timeout: 3000,
  errorComponent: {
    template: '<div class="error-loading">Error loading table element</div>',
  },
  loadingComponent: LoadingComponent,
});

const SignatureElement = defineAsyncComponent({
  loader: () => import("../components/editor/elements/SignatureElement.vue"),
  timeout: 3000,
  errorComponent: {
    template:
      '<div class="error-loading">Error loading signature element</div>',
  },
  loadingComponent: LoadingComponent,
});

const FormElement = defineAsyncComponent({
  loader: () => import("../components/editor/elements/FormElement.vue"),
  timeout: 3000,
  errorComponent: {
    template: '<div class="error-loading">Error loading form element</div>',
  },
  loadingComponent: LoadingComponent,
});

const GroupElement = defineAsyncComponent({
  loader: () => import("../components/editor/elements/GroupElement.vue"),
  timeout: 3000,
  errorComponent: {
    template: '<div class="error-loading">Error loading group element</div>',
  },
  loadingComponent: LoadingComponent,
});

const GridBlockElement = defineAsyncComponent({
  loader: () => import("../components/editor/elements/GridBlockElement.vue"),
  timeout: 3000,
  errorComponent: {
    template: '<div class="error-loading">Error loading grid element</div>',
  },
  loadingComponent: LoadingComponent,
});

// Element registry for component lookup
export const elementComponentRegistry: Record<string, Component> = {
  text: TextElement,
  image: ImageElement,
  shape: ShapeElement,
  table: TableElement,
  signature: SignatureElement,
  form: FormElement,
  group: GroupElement,
  grid: GridBlockElement,
};

/**
 * Get the appropriate component for an element type
 * @param type Element type
 * @returns Vue component for the element type
 */
export function getElementComponent(type: string): Component | null {
  return elementComponentRegistry[type] || null;
}
