<script lang="ts" setup>
import {
    defineAsyncComponent,
    inject,
    onMounted,
    onUnmounted,
    ref,
    shallowRef,
    triggerRef,
    useTemplateRef,
} from 'vue';
import LoaderView from '@/components/loading/LoaderView.vue';
import VerticalBox from '@/components/layouts/VerticalBox.vue';
import DialogView from '@/components/containers/DialogView.vue';
import { APP_EVENTS_INJECTION_KEY, type AppEvents } from '@/app/app.events.ts';
import { useTestLogsInteractor } from '@/app/test-logs/test-logs.interactor.ts';
import { useRoute } from 'vue-router';
import HorizontalBox from '@/components/layouts/HorizontalBox.vue';
import IconButton from '@/components/interactive/IconButton.vue';
import {
    type TestLogHistoryViewModel,
    type TestLogPropertiesViewModel,
    type TestLogViewModel,
} from '@/app/test-logs/test-logs.protocol.ts';
import LazyRenderableView from '@/components/containers/LazyRenderableView.vue';
import { useErrorHandler } from '@/components/composable/error-handler.ts';
import { useRequestAnimationFrame } from '@/components/composable/animation-frame.ts';

let selectableItemsTable = defineAsyncComponent(
    () => import('@/components/interactive/SelectableItemsTable.vue'),
);
useErrorHandler();
const testLogsContainerIsLoaded = ref(false);
const testLogs = shallowRef<TestLogViewModel[]>([]);
const testLogsSummary = shallowRef<string>();
const testRunsHistory = ref<any[]>([]);
const selectedTestLogParam = ref();
const selectedTestLogParamDialogBoxOpened = ref(false);
const selectedTestLabel = ref('');
const testRunHistoryDialogBoxOpened = ref(false);
const isStreamCurrentlyActive = ref(false);
const isTestRunsHistoryNotEmpty = ref(false);

let selectedTestUuid: string;
let chunkedTestLogs: TestLogViewModel[][] = [];
let eventHandlerPaused = false;
const testLogsInputInteractor = useTestLogsInteractor(<string>useRoute().query.uuid);
const appEvents = inject<AppEvents>(APP_EVENTS_INJECTION_KEY);
const logContainer = useTemplateRef<HTMLDivElement>('logContainer');
const eventCssClassMap: Record<TestLogViewModel['type'], string> = {
    HTML_REPORT: 'html-report',
    TEST_END: '',
    PROGRESS_EVENT_MESSAGE: '',
    PROGRESS_EVENT_PERCENTAGE: '',
    ERROR: '',
};
let renderingAnimationFrameId: number;

const onTestLogStreamReceived = (logChunk: TestLogViewModel[]) => {
    chunkedTestLogs.push(logChunk);
    if (eventHandlerPaused) {
        eventHandlerPaused = false;
        renderTestEvent();
    }
};

/**
 *  requestAnimationFrame is very important, it allows us to render elements with size defined by
 *  env.maxElementToRenderPerRenderingCycle as soon as they enter the buffer and synchronized with frame rate,
 *  without it we will have to wait for the entire recursion to be finished to render, meaning rendering all at once and in one frame.
 * */
const renderTestEvent = () => {
    if (chunkedTestLogs.length === 0) {
        eventHandlerPaused = true;
        return;
    }
    renderingAnimationFrameId = requestIdleCallback(() => {
        const arrayToRender = chunkedTestLogs.shift();
        if (!arrayToRender || arrayToRender.length === 0) {
            eventHandlerPaused = true;
            return;
        }
        eventHandlerPaused = true;
        const lastEvent = arrayToRender[arrayToRender.length - 1];
        switch (lastEvent?.type) {
            case 'TEST_END':
                testLogsSummary.value = arrayToRender.pop()!.data;
                testLogs.value.push(...arrayToRender);
                triggerRef(testLogs);
                isStreamCurrentlyActive.value = false;
                appEvents?.POPUP.next({
                    type: 'success',
                    message: 'Test execution completed successfully',
                });
                break;
            case 'ERROR':
                appEvents?.POPUP.next({
                    type: 'error',
                    message: lastEvent.data,
                });
                isStreamCurrentlyActive.value = false;
                break;
            default:
                testLogs.value.push(...arrayToRender);
                triggerRef(testLogs);
                renderTestEvent();
        }
    });
};

const clearTestLogView = () => {
    testLogs.value = [];
    chunkedTestLogs = [];
    eventHandlerPaused = true;
};

const onTestLogsSelectionChange = (selection: any) => {
    selectedTestUuid = selection.value as string;
    selectedTestLabel.value = selection.label;
    testLogsInputInteractor.stopListeningToTestLogs();
    useRequestAnimationFrame(() =>
        testLogsInputInteractor.startListeningToTestLogs(clearTestLogView, selectedTestUuid),
    );
    testLogsInputInteractor.setUuidAsSelected(selectedTestUuid);
};

const onSelectedUuidFetched = (uuid: string): void => {
    selectedTestUuid = uuid;
};

const onStreamSourceChecked = (isStreamFromServer: boolean): void => {
    isStreamCurrentlyActive.value = isStreamFromServer;
};

const onTestLogFetched = (testLogProperties: TestLogPropertiesViewModel): void => {
    selectedTestLabel.value = `${testLogProperties.testName} @ ${testLogProperties?.createdAt}`;
};

const onTestLogParamsFetched = (data?: Record<string, any>): void => {
    selectedTestLogParam.value = Object.entries(data ?? {});
};

const onTestLogsHistoryFetched = (history: TestLogHistoryViewModel[]): void => {
    testRunsHistory.value = history;
    isTestRunsHistoryNotEmpty.value = testRunsHistory.value.length !== 0;
};

const reportError = (error: Error): void => {
    appEvents?.POPUP.next({
        type: 'error',
        message: ` 'Error while fetching test reports: ${error.message}`,
    });
};

testLogsInputInteractor.outputProtocol = {
    onSelectedUuidFetched,
    onStreamSourceChecked,
    onTestLogFetched,
    onTestLogParamsFetched,
    onTestLogStreamReceived,
    onTestLogsHistoryFetched,
    reportError,
};

const onInfoButtonClicked = () => {
    testLogsInputInteractor.fetchTestLogParams(selectedTestUuid);
    selectedTestLogParamDialogBoxOpened.value = true;
};

const onTestRepeatClicked = () => {
    isStreamCurrentlyActive.value = true;
    requestAnimationFrame(() =>
        testLogsInputInteractor.startListeningToTestLogs(clearTestLogView, selectedTestUuid),
    );
    testLogsInputInteractor.repeatLastTestRun();
};

const onTestRunsHistoryClicked = () => {
    testRunHistoryDialogBoxOpened.value = true;
};

const testRunsHistoryRowMapper = function (arg: any) {
    return [arg.label, arg.creationDate];
};
const testRunsHistorySelectedRowValueGetter = function (arg: any) {
    return arg.value;
};
const testRunsHistorySelectedRowLabelGetter = function (arg: any) {
    return `${arg.label} @ ${arg.creationDate}`;
};

onMounted(() => {
    testLogsContainerIsLoaded.value = true;
    requestAnimationFrame(() => {
        testLogsInputInteractor.fetchSelectedUuid();
        testLogsInputInteractor.fetchTestLogsHistory();
        testLogsInputInteractor.fetchTestLogsByUuid(selectedTestUuid);
        testLogsInputInteractor.checkIfStreamIsFromServer(selectedTestUuid);
        testLogsInputInteractor.startListeningToTestLogs(clearTestLogView, selectedTestUuid);
    });
});

onUnmounted(() => {
    testLogsInputInteractor.destroy();
    cancelIdleCallback(renderingAnimationFrameId);
});
</script>
<template>
    <VerticalBox style="height: 100%">
        <HorizontalBox
            v-if="isTestRunsHistoryNotEmpty"
            style="gap: var(--element-gap); border-bottom: 1px solid black; height: 55px"
        >
            <p style="font-weight: bold">{{ selectedTestLabel }}</p>
            <IconButton
                id="test-replay-button"
                :disabled="isStreamCurrentlyActive"
                button-label="Repeat"
                button-text-color="var(--primary-color)"
                icon="repeat"
                @click="onTestRepeatClicked"
            />
            <IconButton
                id="history-button"
                button-label="History"
                button-text-color=" #5f6368"
                icon="history"
                @click="onTestRunsHistoryClicked"
            />
            <IconButton
                id="info-button"
                button-label="Test Configuration"
                button-text-color="green"
                icon="info"
                @click="onInfoButtonClicked"
            />
            <LoaderView :inprogress="isStreamCurrentlyActive" />
        </HorizontalBox>
        <LazyRenderableView :render="testLogsContainerIsLoaded">
            <div
                ref="logContainer"
                class="inflexible-container test-log-container flex-column-container"
                style="flex-grow: 1"
            >
                <template v-if="isTestRunsHistoryNotEmpty">
                    <template v-for="(item, index) in testLogs" :key="index">
                        <iframe
                            referrerpolicy="no-referrer"
                            v-if="item.type === 'HTML_REPORT'"
                            :class="eventCssClassMap[item.type]"
                            class="test-log-item"
                            title="Embeded Test Report"
                            :src="item.data"
                        />
                    </template>
                </template>
                <template v-else>
                    <h3>
                        <RouterLink to="/explorer">No Results Found</RouterLink>
                    </h3>
                </template>
            </div>
            <div class="test-summary inflexible-container">
                {{ testLogsSummary }}
            </div>
        </LazyRenderableView>
    </VerticalBox>
    <LazyRenderableView :render="selectedTestLogParamDialogBoxOpened">
        <DialogView
            v-model="selectedTestLogParamDialogBoxOpened"
            :title="`${selectedTestLabel} test configurations`"
        >
            <component
                :is="selectableItemsTable"
                :column-name="['Field', 'Value']"
                :disableSelectRow="true"
                :item-to-row-mapper="(arg: any[]) => [arg[0], arg[1]]"
                :items="selectedTestLogParam"
            />
        </DialogView>
    </LazyRenderableView>
    <LazyRenderableView :render="testRunHistoryDialogBoxOpened">
        <DialogView v-model="testRunHistoryDialogBoxOpened" title="Test Runs History">
            <component
                :is="selectableItemsTable"
                v-memo="[testRunsHistory]"
                :column-name="['Name', 'Creation Date']"
                :disableSelectRow="false"
                :item-to-row-mapper="testRunsHistoryRowMapper"
                :items="testRunsHistory"
                :row-label="testRunsHistorySelectedRowLabelGetter"
                :rowValue="testRunsHistorySelectedRowValueGetter"
                :selected-value="selectedTestUuid"
                @on-selected="onTestLogsSelectionChange"
            />
        </DialogView>
    </LazyRenderableView>
</template>
<style src="@/assets/styles/views/test-logs.css" scoped />
