<script setup lang="ts">
import { computed, onUnmounted, ref, toRaw, watch } from 'vue';
import DialogView from '@/components/containers/DialogView.vue';
import NoteCardView from '@/components/containers/NoteCardView.vue';
import HorizontalBox from '@/components/layouts/HorizontalBox.vue';
import VerticalBox from '@/components/layouts/VerticalBox.vue';
import IconButton from '@/components/interactive/IconButton.vue';

import {
    type DynamicallyConfiguredFormProps,
    formComponentsLookup,
    type FormControl,
    type FormControlDataType,
    type FormGroup,
} from './';
import {
    createDynamicallyConfiguredFormEvents,
    destroyDynamicallyConfiguredFormEvents,
} from '@/components/dynamic-form/common/form.events.ts';
import type { CommonComponentAttribute, KeyValueMap } from '@/common/types.ts';

const props = defineProps<DynamicallyConfiguredFormProps>();
const emit = defineEmits<{
    onSubmitClicked: [arg: KeyValueMap<FormControl<FormControlDataType>>];
}>();

const form = ref<FormGroup<FormControlDataType>>({});
const isFormInvalid = ref(false);

const formEvent = createDynamicallyConfiguredFormEvents(props.formId);

const formErrors = computed(() => {
    const errors: { key: string; message: string }[] = [];
    for (const [key, formControl] of Object.entries(form.value)) {
        if (!formControl.isValid) {
            errors.push({ key, message: formControl.message ?? 'Unhandled Error' });
        }
    }
    return errors;
});

const isFormValid = (formValue: KeyValueMap<FormControl<any>>) => {
    if (Object.keys(formValue).length === 0) return true;
    return Object.entries(formValue)
        .map(([, value]) => value.isValid)
        .reduce((prev, curr) => prev && curr, true);
};

const onSubmit = () => {
    if (isFormValid(form.value)) {
        isFormInvalid.value = false;
        emit('onSubmitClicked', toRaw(form.value));
        return;
    }
    isFormInvalid.value = true;
};

const onClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const data = target.dataset as CommonComponentAttribute;
    processForTooltipClick(data);
    processForSelectFieldChipCloseClick(data);
};

const processForTooltipClick = (data: CommonComponentAttribute) => {
    if (data?.role === 'tooltip') {
        formEvent.TOOLTIP_CLICKED.next(data.group);
        return;
    }
    formEvent.TOOLTIP_CLICKED.next(undefined);
};

const processForSelectFieldChipCloseClick = (data: CommonComponentAttribute) => {
    if (data.role === 'select-field-selection-close-button') {
        formEvent.SELECT_FIELD_CHIP_CLOSE_CLICKED.next(data);
    }
};

const getFieldComponentByType = (type: string) => formComponentsLookup[type];

const fieldTypeExists = (fieldType: string) => fieldType in formComponentsLookup;

watch(
    () => props.formConfiguration,
    () => {
        formEvent.RESET.next();
    },
);

onUnmounted(() => destroyDynamicallyConfiguredFormEvents(props.formId));
</script>

<template>
    <div class="dynamic-form-view">
        <VerticalBox @click="onClick" class="section-list-container">
            <section
                v-for="(item, key, index) in formConfiguration"
                :key="key"
                :style="{ zIndex: -index, position: 'relative' }"
            >
                <HorizontalBox>
                    <template v-if="fieldTypeExists(item.type)">
                        <component
                            class="field"
                            v-model="form[key]"
                            :is="getFieldComponentByType(item.type)"
                            :name="key"
                            :parentId="formId"
                            v-bind="item"
                        />
                        <NoteCardView
                            class="notice"
                            :note="form[key]?.message"
                            :type="form[key]?.isValid ? 'success' : 'error'"
                        />
                    </template>

                    <component
                        v-else
                        :is="getFieldComponentByType('field_not_implemented')"
                        :name="key"
                        :type="item.type"
                    />
                </HorizontalBox>
            </section>
        </VerticalBox>
        <IconButton
            v-if="formConfiguration"
            buttonTextColor="var(--success-accent-color)"
            icon="start"
            buttonLabel="Run"
            @click="onSubmit()"
            type="button"
            class="submit-button"
        />
        <h3 v-else style="width: 8em">No Test Selected</h3>
    </div>

    <DialogView
        v-model="isFormInvalid"
        title="The test cannot be launched due to some errors in the Form"
    >
        <NoteCardView v-for="item in formErrors" :key="item.key" type="error">
            <span>
                Input {{ item.key }} is invalid with the following message:
                <strong>{{ item.message }}</strong>
            </span>
        </NoteCardView>
    </DialogView>
</template>

<style src="@/assets/styles/component/dynamic-form.css" />
