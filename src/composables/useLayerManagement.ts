import { computed } from 'vue';
import type { DocumentElement } from '../types/document';

/**
 * Composable for managing element layers (z-index)
 * Provides functions for sorting elements by z-index and moving elements up/down in the stack
 */
export function useLayerManagement(
  elements: DocumentElement[] | (() => DocumentElement[])
) {
  // Get elements array from function or direct array
  const getElements = (): DocumentElement[] => {
    return typeof elements === 'function' ? elements() : elements;
  };

  // Sort elements by z-index for proper layering
  const sortedElements = computed(() => {
    const elementsArray = getElements();
    if (!elementsArray || elementsArray.length === 0) return [];

    // Make a copy of the elements array to avoid modifying the original
    return [...elementsArray].sort((a, b) => {
      // Default zIndex to 0 if not set
      const zIndexA = a.zIndex ?? 0;
      const zIndexB = b.zIndex ?? 0;
      return zIndexA - zIndexB;
    });
  });

  // Get the index of an element in the sorted array
  const getElementIndex = (element: DocumentElement): number => {
    return sortedElements.value.findIndex(e => e.id === element.id);
  };

  // Check if element is at the top of the stack
  const isTopLayer = (element: DocumentElement): boolean => {
    const index = getElementIndex(element);
    return index === sortedElements.value.length - 1;
  };

  // Check if element is at the bottom of the stack
  const isBottomLayer = (element: DocumentElement): boolean => {
    const index = getElementIndex(element);
    return index === 0;
  };

  // Move an element up one layer
  const moveElementUp = (element: DocumentElement): DocumentElement => {
    const elementsArray = getElements();
    const index = getElementIndex(element);
    
    // If already at the top, do nothing
    if (index === elementsArray.length - 1) return element;
    
    // Get the element above
    const aboveElement = sortedElements.value[index + 1];
    
    // Swap z-indices
    const updatedElement = {
      ...element,
      zIndex: aboveElement.zIndex ?? 0
    };
    
    // If the above element has the same z-index, increment this element's z-index
    if (updatedElement.zIndex === (element.zIndex ?? 0)) {
      updatedElement.zIndex += 1;
    }
    
    return updatedElement;
  };

  // Move an element down one layer
  const moveElementDown = (element: DocumentElement): DocumentElement => {
    const index = getElementIndex(element);
    
    // If already at the bottom, do nothing
    if (index === 0) return element;
    
    // Get the element below
    const belowElement = sortedElements.value[index - 1];
    
    // Swap z-indices
    const updatedElement = {
      ...element,
      zIndex: belowElement.zIndex ?? 0
    };
    
    // If the below element has the same z-index, decrement this element's z-index
    if (updatedElement.zIndex === (element.zIndex ?? 0)) {
      updatedElement.zIndex -= 1;
    }
    
    return updatedElement;
  };

  // Move an element to the top of the stack
  const moveElementToTop = (element: DocumentElement): DocumentElement => {
    const elementsArray = getElements();
    
    // Find the highest z-index
    const highestZIndex = elementsArray.reduce(
      (max, el) => Math.max(max, el.zIndex ?? 0),
      0
    );
    
    // Set this element's z-index to one higher than the highest
    return {
      ...element,
      zIndex: highestZIndex + 1
    };
  };

  // Move an element to the bottom of the stack
  const moveElementToBottom = (element: DocumentElement): DocumentElement => {
    const elementsArray = getElements();
    
    // Find the lowest z-index
    const lowestZIndex = elementsArray.reduce(
      (min, el) => Math.min(min, el.zIndex ?? 0),
      0
    );
    
    // Set this element's z-index to one lower than the lowest
    return {
      ...element,
      zIndex: lowestZIndex - 1
    };
  };

  return {
    sortedElements,
    getElementIndex,
    isTopLayer,
    isBottomLayer,
    moveElementUp,
    moveElementDown,
    moveElementToTop,
    moveElementToBottom
  };
}
