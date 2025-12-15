import type { AsyncComponentLoader } from '@vue/runtime-core';
import type { CommonComponentAttribute, MessageLevel } from '@/common/types.ts';

interface ChipViewProps extends CommonComponentAttribute {
    text: string;
    textColor?: string;
    enableCloseButton?: boolean;
}

interface LazyRendererableProps {
    render: boolean;
}

interface DialogBoxWithDynamicContentProps {
    title: string;
}

interface NoteCardViewProps {
    note?: string;
    type: MessageLevel;
    noteClass?: string;
}

interface TooltipViewProps {
    anchorName: string;
    tooltipShow: boolean;
}

interface ToastViewProps {
    to: string;
    duration?: number;
    clearAll?: boolean;
    content?: {
        message: string;
        type: MessageLevel;
    };
}

export type {
    ChipViewProps,
    LazyRendererableProps,
    DialogBoxWithDynamicContentProps,
    NoteCardViewProps,
    TooltipViewProps,
    ToastViewProps,
};
