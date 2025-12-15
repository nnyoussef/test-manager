<script setup lang="ts">
import { ref, watch } from 'vue';
import type { LazyRendererableProps } from '@/components/containers/index.ts';

const props = withDefaults(defineProps<LazyRendererableProps>(), {
    render: false,
});

const _render = ref(false);

watch(
    () => props.render,
    () => {
        requestAnimationFrame(() => (_render.value = true));
    },
    {
        once: true,
    },
);
</script>

<template>
    <template v-if="_render && $slots.default">
        <slot v-memo="_render" />
    </template>
</template>
