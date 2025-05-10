import { defineAsyncComponent } from 'vue';
import type { Component } from 'vue';

// Error component for async loading failures
const ErrorComponent = {
  template: '<div class="error-loading">Error loading component</div>',
  props: ['error']
};

// Loading component for async loading
const LoadingComponent = {
  template: '<div class="loading-component">Loading...</div>'
};

// Define async components with error handling
const TextElement = defineAsyncComponent({
  loader: () => import('./TextElementNew.vue'),
  timeout: 3000,
  errorComponent: {
    template: '<div class="error-loading">Error loading text element</div>',
  },
  loadingComponent: LoadingComponent
});

const ImageElement = defineAsyncComponent({
  loader: () => import('./ImageElement.vue'),
  timeout: 3000,
  errorComponent: {
    template: '<div class="error-loading">Error loading image element</div>',
  },
  loadingComponent: LoadingComponent
});

const ShapeElement = defineAsyncComponent({
  loader: () => import('./ShapeElement.vue'),
  timeout: 3000,
  errorComponent: {
    template: '<div class="error-loading">Error loading shape element</div>',
  },
  loadingComponent: LoadingComponent
});

const TableElement = defineAsyncComponent({
  loader: () => import('./SimpleTableElement.vue'),
  timeout: 3000,
  errorComponent: {
    template: '<div class="error-loading">Error loading table element</div>',
  },
  loadingComponent: LoadingComponent
});

const SignatureElement = defineAsyncComponent({
  loader: () => import('./SignatureElement.vue'),
  timeout: 3000,
  errorComponent: {
    template: '<div class="error-loading">Error loading signature element</div>',
  },
  loadingComponent: LoadingComponent
});

const FormElement = defineAsyncComponent({
  loader: () => import('./FormElement.vue'),
  timeout: 3000,
  errorComponent: {
    template: '<div class="error-loading">Error loading form element</div>',
  },
  loadingComponent: LoadingComponent
});

const GroupElement = defineAsyncComponent({
  loader: () => import('./GroupElement.vue'),
  timeout: 3000,
  errorComponent: {
    template: '<div class="error-loading">Error loading group element</div>',
  },
  loadingComponent: LoadingComponent
});

const GridBlockElement = defineAsyncComponent({
  loader: () => import('./GridBlockElement.vue'),
  timeout: 3000,
  errorComponent: {
    template: '<div class="error-loading">Error loading grid element</div>',
  },
  loadingComponent: LoadingComponent
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
  grid: GridBlockElement
};

/**
 * Get the appropriate component for an element type
 * @param type Element type
 * @returns Vue component for the element type
 */
export function getElementComponent(type: string): Component | null {
  return elementComponentRegistry[type] || null;
}

export default {
  elementComponentRegistry,
  getElementComponent
};
