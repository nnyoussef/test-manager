<script setup lang="ts">
import VerticalBox from '@/components/layouts/VerticalBox.vue';
import HorizontalBox from '@/components/layouts/HorizontalBox.vue';

defineProps({
    title: String,
});
</script>

<template>
    <VerticalBox class="vertical-layout">
        <HorizontalBox class="title">
            <slot name="title" />
        </HorizontalBox>
        <div class="body">
            <slot name="body" />
        </div>
    </VerticalBox>
</template>
<style>
.vertical-layout > .title {
    line-height: 1;
    background: #eceff1;
    border: 1px solid lightgray;
    height: 40px;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.3);
    color: var(--primary-accent-color);
    font-size: 12pt;
    font-weight: bold;
    margin: 0;
    padding-left: var(--element-gap);
}
.vertical-layout > .body {
    flex-grow: 1;
    border: 1px solid lightgray;
}
</style>
