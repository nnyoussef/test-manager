<script lang="ts" setup>
import HorizontalBox from '@/components/layouts/HorizontalBox.vue';
import IconContainer from '@/components/icons/IconContainer.vue';
import { ref, watchEffect } from 'vue';
import type { IconButtonProps } from '@/components/interactive/index.ts';
import TooltipView from '@/components/containers/TooltipView.vue';

const props = withDefaults(defineProps<IconButtonProps>(), {
    iconClassName: '',
    isDarkTheme: false,
    disabled: false,
    disableHoverCss: false,
    tooltipShow: false,
    tooltipContent: '',
});

const anchorName: Readonly<string> = `--${props.buttonId ?? ''}`;

const iconContainerClassName = ref([props.iconClassName]);
watchEffect(() => {
    if (props.animationInProgress) {
        iconContainerClassName.value = [props.iconClassName, props.animationName ?? ''];
    } else {
        iconContainerClassName.value = [props.iconClassName];
    }
});
</script>
<template>
    <div :data-role="role" :data-value="value">
        <button
            :disabled="disabled"
            class="icon-button anchor"
            :class="disableHoverCss ? ' no-hover' : ''"
            :style="{
                '--color': buttonTextColor,
                anchorName,
            }"
            :title="buttonLabel"
            :data-role="role"
            :data-group="group"
            :data-value="value"
            type="button"
            :id="buttonId"
        >
            <HorizontalBox
                style="gap: 4px"
                :data-role="role"
                :data-group="group"
                :data-value="value"
            >
                <IconContainer
                    :fill="iconColor ?? buttonTextColor"
                    :icon="icon"
                    :class-name="iconContainerClassName"
                    :size="iconSize"
                    :role="role"
                    :data-value="value"
                    :group="group"
                />
                {{ buttonLabel }}
            </HorizontalBox>
        </button>
        <TooltipView :anchorName="anchorName" :tooltipShow="tooltipShow">
            {{ tooltipContent }}
        </TooltipView>
    </div>
</template>
<style src="@/assets/styles/component/icon-button.css" />
