<template>
  <div ref="container" class="safe-html-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import DOMPurify from "dompurify";

const props = defineProps<{
  html: string;
}>();

const container = ref<HTMLElement | null>(null);

// Function to safely render HTML content
function renderSafeHtml(): void {
  if (!container.value) return;

  // Sanitize HTML content using DOMPurify
  const sanitizedHtml = DOMPurify.sanitize(props.html, {
    ALLOWED_TAGS: ["p", "br", "b", "i", "em", "strong", "u", "span", "div"],
    ALLOWED_ATTR: ["style", "class"],
  });

  // Set the sanitized HTML
  container.value.innerHTML = sanitizedHtml;
}

// Render the HTML when the component is mounted
onMounted(() => {
  renderSafeHtml();
});

// Re-render when the HTML changes
watch(() => props.html, () => {
  renderSafeHtml();
});
</script>

<style scoped>
.safe-html-container {
  display: inline;
}
</style>
