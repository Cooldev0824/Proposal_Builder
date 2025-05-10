<template>
  <div class="property-group">
    <div class="property-group-title">Form Properties</div>

    <v-select
      v-model="formType"
      label="Form Type"
      :items="formTypes"
      density="compact"
      variant="outlined"
      hide-details
      class="mb-4"
      @update:model-value="updateFormType"
    ></v-select>

    <v-text-field
      v-if="['textfield', 'textarea', 'select'].includes(formType)"
      v-model="label"
      label="Label"
      density="compact"
      variant="outlined"
      hide-details
      class="mb-4"
      @update:model-value="updateLabel"
    ></v-text-field>

    <template v-if="formType === 'textfield'">
      <v-select
        v-model="inputType"
        label="Input Type"
        :items="inputTypes"
        density="compact"
        variant="outlined"
        hide-details
        class="mb-4"
        @update:model-value="updateInputType"
      ></v-select>
    </template>

    <template v-if="['checkbox', 'radio', 'select'].includes(formType)">
      <div class="property-group-subtitle mb-2">Options</div>
      <draggable
        v-model="options"
        item-key="id"
        handle=".drag-handle"
        class="options-list mb-4"
      >
        <template #item="{ element: option }">
          <div class="option-row">
            <v-icon size="small" class="drag-handle" color="grey"
              >mdi-drag</v-icon
            >
            <v-text-field
              v-model="option.text"
              density="compact"
              hide-details
              variant="outlined"
              class="option-input"
              @update:model-value="updateOptions"
            ></v-text-field>
            <v-btn
              icon
              size="small"
              color="error"
              @click="removeOption(option)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </div>
        </template>
      </draggable>

      <v-btn block @click="addOption" class="mb-4">
        <v-icon left>mdi-plus</v-icon>
        Add Option
      </v-btn>

      <v-switch
        v-if="formType === 'radio'"
        v-model="inline"
        label="Inline Layout"
        density="compact"
        hide-details
        class="mb-4"
        @update:model-value="updateInline"
      ></v-switch>
    </template>
    <!--     
    <v-divider class="my-4"></v-divider>
    
    <div class="property-group-subtitle mb-2">Style</div>
    <v-text-field
      v-model="backgroundColor"
      label="Background Color"
      type="color"
      density="compact"
      variant="outlined"
      hide-details
      class="mb-4"
      @update:model-value="updateBackgroundColor"
    ></v-text-field> -->
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import draggable from "vuedraggable";
import type { DocumentElement } from "../../../types/document";

const props = defineProps<{
  element: DocumentElement;
}>();

const emit = defineEmits<{
  (e: "update:element", element: DocumentElement): void;
}>();

const formTypes = ["checkbox", "radio", "select", "textfield", "textarea"];
const inputTypes = ["text", "email", "number", "tel", "url", "password"];

const formType = ref(props.element.content.type);
const label = ref(props.element.content.label || "");
const options = ref(
  (props.element.content.options || []).map((text: string) => ({
    id: crypto.randomUUID(),
    text,
  }))
);
const inline = ref(props.element.content.inline || false);
const inputType = ref(props.element.content.inputType || "text");
const backgroundColor = ref(props.element.style?.backgroundColor || "white");

watch(
  () => props.element,
  (newValue) => {
    formType.value = newValue.content.type;
    label.value = newValue.content.label || "";
    options.value = (newValue.content.options || []).map((text: string) => ({
      id: crypto.randomUUID(),
      text,
    }));
    inline.value = newValue.content.inline || false;
    inputType.value = newValue.content.inputType || "text";
    backgroundColor.value = newValue.style?.backgroundColor || "white";
  },
  { deep: true }
);

function updateElement(updates: Partial<typeof props.element.content>) {
  emit("update:element", {
    ...props.element,
    content: {
      ...props.element.content,
      ...updates,
    },
  });
}

function updateStyle(updates: Partial<typeof props.element.style>) {
  emit("update:element", {
    ...props.element,
    style: {
      ...props.element.style,
      ...updates,
    },
  });
}

function updateFormType() {
  const newContent: any = { type: formType.value };

  if (["checkbox", "radio", "select"].includes(formType.value)) {
    newContent.options = ["Option 1"];
  }
  if (["textfield", "textarea", "select"].includes(formType.value)) {
    newContent.label = "Label";
  }
  if (formType.value === "radio") {
    newContent.inline = false;
  }
  if (formType.value === "textfield") {
    newContent.inputType = "text";
  }

  emit("update:element", {
    ...props.element,
    content: newContent,
  });
}

function updateLabel() {
  updateElement({ label: label.value });
}

function updateOptions() {
  updateElement({ options: options.value.map((opt) => opt.text) });
}

function addOption() {
  options.value.push({
    id: crypto.randomUUID(),
    text: `Option ${options.value.length + 1}`,
  });
  updateOptions();
}

function removeOption(option: { id: string; text: string }) {
  options.value = options.value.filter((opt) => opt.id !== option.id);
  updateOptions();
}

function updateInline() {
  updateElement({ inline: inline.value });
}

function updateInputType() {
  updateElement({ inputType: inputType.value });
}

function updateBackgroundColor() {
  updateStyle({ backgroundColor: backgroundColor.value });
}
</script>

<style scoped lang="scss">
.property-group-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}

.property-group-subtitle {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 8px;

  .drag-handle {
    cursor: move;
  }

  .option-input {
    flex: 1;
  }
}
</style>
