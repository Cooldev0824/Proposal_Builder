import { ref, computed, onBeforeUnmount } from 'vue';
import type { DocumentElement, Position, Size } from '../types/document';
import type { CSSProperties } from 'vue';

/**
 * Composable for handling common element functionality
 * Provides drag, resize, and selection functionality for document elements
 */
export function useElement(
  props: {
    element: DocumentElement;
    isSelected: boolean;
    isPreview?: boolean;
  },
  emit: {
    (e: 'update:element', element: DocumentElement): void;
    (e: 'click', element: DocumentElement): void;
  }
) {
  // Element state
  const isDragging = ref(false);
  const startX = ref(0);
  const startY = ref(0);
  const startLeft = ref(0);
  const startTop = ref(0);
  const contentElement = ref<HTMLElement | null>(null);

  // Computed styles
  const elementStyle = computed<CSSProperties>(() => {
    const { position, size, zIndex } = props.element;
    const rotation = props.element.style?.rotation || 0;

    return {
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${size.width}px`,
      height: `${size.height}px`,
      position: 'absolute' as const,
      zIndex: zIndex || 0,
      transform: rotation ? `rotate(${rotation}deg)` : undefined,
      transformOrigin: rotation ? 'center center' : undefined,
    };
  });

  // Handle element click
  function handleClick(event: MouseEvent) {
    // Stop propagation to prevent document click from deselecting
    event.stopPropagation();

    // Don't do anything if we're in preview mode
    if (props.isPreview) return;

    // Emit click event to select this element
    emit('click', props.element);
  }

  // Drag functionality
  function startDrag(event: MouseEvent) {
    // Don't start drag if we're in preview mode
    if (props.isPreview) return;

    isDragging.value = true;
    startX.value = event.clientX;
    startY.value = event.clientY;
    startLeft.value = props.element.position.x;
    startTop.value = props.element.position.y;

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
  }

  function onDrag(event: MouseEvent) {
    if (!isDragging.value) return;

    const dx = event.clientX - startX.value;
    const dy = event.clientY - startY.value;

    // Calculate new position with grid snapping
    const gridSize = 10;
    const newLeft = Math.round((startLeft.value + dx) / gridSize) * gridSize;
    const newTop = Math.round((startTop.value + dy) / gridSize) * gridSize;

    // Update element position
    const updatedElement = {
      ...props.element,
      position: {
        x: newLeft,
        y: newTop,
      },
    };

    emit('update:element', updatedElement);
  }

  function stopDrag() {
    isDragging.value = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
  }

  // Handle resize
  function handleResize(newSize: Size, newPosition: Position) {
    const updatedElement = {
      ...props.element,
      position: newPosition,
      size: newSize,
    };

    emit('update:element', updatedElement);
  }

  // Rotation functionality
  const isRotating = ref(false);
  const startAngle = ref(0);

  function startRotate(event: MouseEvent) {
    isRotating.value = true;
    const rect = (event.target as HTMLElement)
      .closest('.element')
      ?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    startAngle.value = Math.atan2(event.clientY - centerY, event.clientX - centerX);

    document.addEventListener('mousemove', onRotate);
    document.addEventListener('mouseup', stopRotate);
  }

  function onRotate(event: MouseEvent) {
    if (!isRotating.value) return;

    const rect = (event.target as HTMLElement)
      .closest('.element')
      ?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);

    let newRotation =
      ((angle - startAngle.value) * (180 / Math.PI) +
        (props.element.style?.rotation || 0)) %
      360;
    if (newRotation < 0) newRotation += 360;

    const updatedElement = {
      ...props.element,
      style: {
        ...props.element.style,
        rotation: newRotation,
      },
    };

    emit('update:element', updatedElement);
  }

  function stopRotate() {
    isRotating.value = false;
    document.removeEventListener('mousemove', onRotate);
    document.removeEventListener('mouseup', stopRotate);
  }

  // Clean up event listeners
  onBeforeUnmount(() => {
    stopDrag();
    stopRotate();
  });

  return {
    elementStyle,
    contentElement,
    handleClick,
    startDrag,
    handleResize,
    startRotate,
  };
}
