<script setup lang="ts">
import type { FormControl, NumberFieldProps } from '@/components/dynamic-form/index.ts';
import { useInputValidation } from '@/components/dynamic-form/common/input-validation.ts';
import IconButton from '@/components/interactive/IconButton.vue';

const props = defineProps<NumberFieldProps>();
const model = defineModel<FormControl<number>>({
    default: {
        isValid: false,
        data: undefined,
    },
});
const { inputRef, tooltipShow } = useInputValidation(props, model);
</script>

<template>
    <div class="input-field flex-row-container centered-content">
        <input
            type="number"
            :id="name"
            ref="inputRef"
            :name="name"
            :required="required"
            :placeholder="placeHolder"
            v-model="model.data"
            :min="minValue"
            :max="maxValue"
            :step="step"
        />
        <label :for="name">
            {{ label }}
            <i v-if="!required" class="unselectable"><small>(Optional)</small></i>
        </label>
        <IconButton
            :tooltipShow="tooltipShow"
            :tooltipContent="description"
            :buttonId="`${parentId}-${name}-tooltip`"
            buttonTextColor="var(--neutral-accent-color)"
            icon="question"
            :role="'tooltip'"
            :value="name"
            :group="name"
        />
    </div>
</template>
