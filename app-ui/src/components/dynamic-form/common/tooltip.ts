import { getDynamicallyConfiguredFormEventsById } from '@/components/dynamic-form/common/form.events.ts';
import { ref } from 'vue';

export function useTooltip(parentId: string, name: string) {
    const formEvent = getDynamicallyConfiguredFormEventsById(parentId);
    const tooltipShow = ref(false);

    formEvent.TOOLTIP_CLICKED.subscribe((target) => {
        if (name === target) {
            tooltipShow.value = !tooltipShow.value;
            return;
        }
        tooltipShow.value = false;
    });
    return tooltipShow;
}
