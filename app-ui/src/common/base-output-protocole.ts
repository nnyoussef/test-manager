import type { MessageLevel } from '@/common/types.ts';

export interface BaseOutputProtocole {
    /**
     * Reports an event to the output protocol.
     * @param message - The message to report.
     * @param eventType - The type of the event.
     * @param tag
     * */
    eventReporter(message: string, eventType: MessageLevel): void;
}
