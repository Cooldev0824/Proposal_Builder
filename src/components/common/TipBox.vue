<template>
  <div class="tip-box" :class="classes">
    <div v-if="title" class="tip-box__title">{{ title }}</div>
    <div class="tip-box__content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  title?: string;
  type?: "info" | "warning" | "error" | "success";
  dense?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  type: "info",
  dense: false,
});

const classes = computed(() => {
  return {
    [`tip-box--${props.type}`]: true,
    "tip-box--dense": props.dense,
  };
});
</script>

<style scoped lang="scss">
.tip-box {
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;

  &__title {
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  &--dense {
    padding: 0.5rem;
  }

  &--info {
    background-color: #e1f5fe;
    border-color: #b3e5fc;
  }

  &--warning {
    background-color: #fff8e1;
    border-color: #ffecb3;
  }

  &--error {
    background-color: #ffebee;
    border-color: #ffcdd2;
  }

  &--success {
    background-color: #e8f5e9;
    border-color: #c8e6c9;
  }
}
</style>