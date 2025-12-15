<script lang="ts" setup>
import { onMounted, ref, useTemplateRef, watch } from 'vue';
import DropDownIcon from '@/components/icons/DropDownIcon.vue';
import { getDynamicallyConfiguredFormEventsById } from '@/components/dynamic-form/common/form.events.ts';
import ChipView from '@/components/containers/ChipView.vue';
import type { FormControl, SelectFieldProps } from '@/components/dynamic-form/index.ts';
import { useRequestAnimationFrame } from '@/components/composable/animation-frame.ts';
import { useCollapsibleTransition } from '@/components/composable/transitions.ts';
import IconButton from '@/components/interactive/IconButton.vue';
import { useTooltip } from '@/components/dynamic-form/common/tooltip.ts';

const props = defineProps<SelectFieldProps>();
const formEvent = getDynamicallyConfiguredFormEventsById(props.parentId);
const transitionHooks = useCollapsibleTransition(200, 150);

const isOpen = ref<boolean>(true);
const isValid = ref<boolean>();
const tooltipShow = useTooltip(props.parentId, props.name);
const noItemSelectedChipIsVisible = ref(false);
let selectUnSelectAllCheckbox = useTemplateRef<HTMLInputElement>('selectUnSelectAllCheckbox');
let dropDownHeaderClassName = ref<string>();
let dropDownIsCollapsed = ref(false);
const model = defineModel<FormControl<string[]>>({
    default: {
        data: [],
        isValid: false,
    },
});

const errorMessage = ref<string>();

const close = () => {
    isOpen.value = false;
    dropDownIsCollapsed.value = true;
    useRequestAnimationFrame(() => (dropDownHeaderClassName.value = 'folded'));
};

const open = () => {
    isOpen.value = true;
    dropDownIsCollapsed.value = false;
    useRequestAnimationFrame(() => (dropDownHeaderClassName.value = 'unfolded'));
};

const toggleFunctions: Record<string, () => void> = {
    true: close,
    false: open,
};

const setSelectAllCheckboxState = (selected: string[]) => {
    const checkbox = selectUnSelectAllCheckbox.value;
    if (!checkbox) return;
    if (selected.length === 0) {
        checkbox.checked = false;
        checkbox.indeterminate = false;
    } else if (selected.length === props.options.length) {
        checkbox.checked = true;
        checkbox.indeterminate = false;
    } else {
        checkbox.indeterminate = true;
    }
};

const toggleSelectUnSelectAll = () => {
    const isChecked = selectUnSelectAllCheckbox.value!.checked;
    let data: string[];
    let isValid: boolean;

    data = isChecked ? props.options : [];
    isValid = validate(data);

    model.value = { data, isValid };
};

const validate = (values: string[]) => {
    const selectedOptionsCount = values.length;
    const min = props.minSelection ?? 1;
    const max = props.maxSelections ?? Number.POSITIVE_INFINITY;

    if (isOptional() && selectedOptionsCount === 0) return true;
    if (isRequired() && min * max === 0) return false;

    return selectedOptionsCount >= min && selectedOptionsCount <= max;
};

const isOptional = () => !props.required;
const isRequired = () => props.required;

const getErrorMessage: () => string = () => {
    const minSelection = props.minSelection ?? (isOptional() ? 0 : 1);
    const maxSelection = props.maxSelections ?? Number.POSITIVE_INFINITY;

    if (maxSelection < minSelection)
        throw new Error(
            `Form configuration for ${props.name} is faulty. max should not be less than min`,
        );

    if (minSelection * maxSelection === 0 && isRequired())
        throw new Error(
            `Form configuration for ${props.name} is faulty. minSelection or maxSelection cannot be 0 for a required field`,
        );

    if (minSelection === maxSelection)
        return `You are allowed to select only ${pluralize(minSelection, 'item')} `;
    if (maxSelection === Number.POSITIVE_INFINITY)
        return `You are required to select at least ${pluralize(minSelection, 'item')}`;
    if (minSelection === 0)
        return `You are required to select no more than ${pluralize(maxSelection, 'item')}`;
    return `You are allowed to select at least ${pluralize(minSelection, 'item')} and no more than ${pluralize(maxSelection, 'item')}`;
};

function pluralize(count: number, singularText: string): string {
    const text = count === 1 ? singularText : `${singularText}s`;
    return `${count} ${text}`;
}

const resetFieldToDefault = () => {
    model.value = {
        data: props.defaultValue,
        isValid: validate(props.defaultValue),
        message: validate(props.defaultValue) ? 'Valid' : getErrorMessage(),
    };
};

formEvent.SELECT_FIELD_CHIP_CLOSE_CLICKED.subscribe({
    next: ({ group, value }) => {
        if (group !== props.name) return;
        const newData = model.value.data.filter((item) => item !== value);
        const isValid = validate(newData);
        model.value = {
            data: newData,
            isValid,
            message: isValid ? 'Valid' : getErrorMessage(),
        };
    },
});

onMounted(() => {
    formEvent?.RESET.subscribe(resetFieldToDefault);

    errorMessage.value = getErrorMessage();
    resetFieldToDefault();
    open();
    useRequestAnimationFrame(() => setSelectAllCheckboxState(props.defaultValue));
    watch(
        () => model.value.data,
        (newVal) => {
            isValid.value = validate(newVal);
            useRequestAnimationFrame(() => setSelectAllCheckboxState(model.value!.data));
            model.value = {
                data: newVal,
                isValid: isValid.value,
                message: isValid.value ? 'Valid' : getErrorMessage(),
            };
            errorMessage.value = getErrorMessage();
            noItemSelectedChipIsVisible.value = model.value.data.length === 0;
        },
    );
});
</script>

<template>
    <div class="select-field container">
        <div :class="dropDownHeaderClassName" class="header">
            <p class="unselectable label">
                {{ label }}
                <i v-if="!required" class="unselectable"><small>(Optional)</small></i>
            </p>
            <DropDownIcon
                :is-down="!Boolean(isOpen)"
                class="unselectable icon"
                @click="toggleFunctions[String(isOpen)]"
            ></DropDownIcon>
            <input
                ref="selectUnSelectAllCheckbox"
                class="select-unselect-toggle"
                type="checkbox"
                @click="toggleSelectUnSelectAll"
            />
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
        <transition v-on="transitionHooks">
            <div class="dropdown select-field" v-show="!dropDownIsCollapsed">
                <div v-for="(option, index) in options" :key="option" class="item">
                    <input
                        :id="`${name}_${index}`"
                        v-model="model!.data"
                        :name="name"
                        :value="option"
                        type="checkbox"
                    />
                    <label :for="`${name}_${index}`" class="unselectable">
                        {{ option }}
                    </label>
                </div>
            </div>
        </transition>
        <div class="footer">
            <ChipView
                v-show="noItemSelectedChipIsVisible"
                text="No items selected"
                text-color="var(--error-accent-color)"
            />
            <TransitionGroup name="list">
                <ChipView
                    v-for="item in model.data"
                    :key="item"
                    :text="item"
                    :enableCloseButton="true"
                    :role="'select-field-selection'"
                    :group="name"
                />
            </TransitionGroup>
        </div>
    </div>
</template>
