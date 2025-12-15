<script setup lang="ts">
import type { FormControl, TemporalFieldProps } from '@/components/dynamic-form/index.ts';
import { useInputValidation } from '@/components/dynamic-form/common/input-validation.ts';
import IconButton from '@/components/interactive/IconButton.vue';

const props = defineProps<TemporalFieldProps>();
const model = defineModel<FormControl<Date>>({
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
            :type="format"
            :required="required"
            :id="name"
            :name="name"
            :placeholder="placeHolder"
            v-model="model.data"
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
