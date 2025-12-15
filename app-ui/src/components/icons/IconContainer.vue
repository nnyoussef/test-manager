<script setup lang="ts">
import HorizontalBox from '@/components/layouts/HorizontalBox.vue';
import type { IconContainerProps } from '.';
import { computed } from 'vue';
import SvgSprite from '@/assets/icon-interactive.svg';

const props = withDefaults(defineProps<IconContainerProps>(), {
    fill: '',
    size: '24px',
    className: '',
});
const iconHref = computed(() => `${SvgSprite}#${props.icon}`);
</script>

<template>
    <HorizontalBox
        :class="className"
        v-memo="props.icon"
        :data-role="role"
        :data-group="group"
        :data-value="value"
        :style="{ width: size, height: height ?? size }"
    >
        <svg
            ref="iconRef"
            :height="size"
            :width="size"
            :fill="fill"
            :data-role="role"
            :data-value="value"
            :data-group="group"
        >
            <use :data-role="role" :data-value="value" :href="iconHref" :data-group="group" />
        </svg>
    </HorizontalBox>
</template>
<style src="@/assets/styles/component/icon-button.css" />
