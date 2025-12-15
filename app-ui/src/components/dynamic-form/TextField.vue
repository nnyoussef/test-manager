<script setup lang="ts">
import type { FormControl, TextFieldProps } from '@/components/dynamic-form/index.ts';
import { useInputValidation } from '@/components/dynamic-form/common/input-validation.ts';
import IconButton from '@/components/interactive/IconButton.vue';

const props = defineProps<TextFieldProps>();
const model = defineModel<FormControl<string>>({
    default: {
        isValid: false,
        data: '',
    },
});
const { inputRef, tooltipShow } = useInputValidation(props, model);
</script>

<template>
    <div class="input-field flex-row-container centered-content">
        <input
            ref="inputRef"
            type="text"
            :required="required"
            :id="name"
            :autocomplete="autoComplete ? 'on' : 'off'"
            :name="name"
            :placeholder="placeHolder"
            :pattern="pattern"
            v-model="model.data"
            :minlength="minLength"
            :maxlength="maxLength"
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
