<script setup lang="ts">
import type { ChipViewProps } from '@/components/containers/index.ts';
import IconContainer from '@/components/icons/IconContainer.vue';
import HorizontalBox from '@/components/layouts/HorizontalBox.vue';

withDefaults(defineProps<ChipViewProps>(), {
    textColor: 'var(--primary-color)',
    enableCloseButton: false,
});
</script>

<template>
    <HorizontalBox :title="text" class="chip layout-containment" :style="{ '--color': textColor }">
        <p class="label unselectable">
            {{ text }}
        </p>
        <IconContainer
            class="close-button"
            v-if="enableCloseButton"
            size="24px"
            icon="close"
            :fill="textColor"
            :role="`${role}-close-button`"
            :group="group"
            :value="value ?? text"
        />
    </HorizontalBox>
</template>

<style scoped>
.chip {
    --color: none;
    display: inline-flex;
    font-size: 0.875rem;
    border-radius: 8px;
    color: var(--color);
    width: auto;
    background-color: #eeeeee;
    margin: 4px;
    white-space: nowrap;
    overflow: hidden;
    place-content: center;
    padding-inline: 4px;
    justify-content: space-between;

    & > .close-button {
        cursor: pointer;
    }

    & > .label {
        padding: 0;
        margin: 0;
        height: 28px;
        display: flex;
        justify-content: center;
        align-items: center;
        line-height: 1;
    }
}
</style>
