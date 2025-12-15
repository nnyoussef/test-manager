<script lang="ts" setup>
import { defineAsyncComponent, inject, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import PanelView from '@/components/containers/PanelView.vue';
import FileSelectorList from '@/components/interactive/FileSelectorList.vue';
import IconButton from '@/components/interactive/IconButton.vue';
import { APP_EVENTS_INJECTION_KEY, type AppEvents } from '@/app/app.events.ts';
import { createRunTestInputProtocol } from '@/app/run-test/run-test.interactor.ts';
import { type TestPropertiesViewModel } from '@/app/run-test/run-test.protocol.ts';
import type { HttpErrorResponse, KeyValueMap, MessageLevel } from '@/common/types';
import { useRequestAnimationFrame } from '@/components/composable/animation-frame.ts';
import { useErrorHandler } from '@/components/composable/error-handler.ts';
import LazyRenderableView from '@/components/containers/LazyRenderableView.vue';
import HorizontalBox from '@/components/layouts/HorizontalBox.vue';
import { download } from '@/common/utils.ts';
import type { FileSelection } from '@/components/interactive';
import { useRouter } from 'vue-router';

const appEvents = inject(APP_EVENTS_INJECTION_KEY) as AppEvents;
const inputProtocol = createRunTestInputProtocol();
useErrorHandler();
const router = useRouter();

const testsAvailable = shallowRef<TestPropertiesViewModel[]>([]);
const testExplorerRefreshLoader = ref(false);
const selectedTest = ref<TestPropertiesViewModel>();
const isDirectorySelected = ref(false);
const currentTestLaunchConfiguration = ref<KeyValueMap>();
const testRunConfPanelIsLoaded = ref(false);
const testRunConfLoader = ref(false);
const loadForm = ref(false);
const downloadButtonDisabled = ref(false);
const refreshButtonDisabled = ref(false);

const DynamicallyConfiguredForm = defineAsyncComponent(
    () => import('@/components/dynamic-form/DynamicFormView.vue'),
);

// Event handler for test selection
function handleTestSelected(selectedFileOrFolder: FileSelection) {
    isDirectorySelected.value = selectedFileOrFolder.type === 'dir';
    inputProtocol.setLastSelectedTestPath(selectedFileOrFolder);
    loadForm.value = true;
    const { name, path, directory } = selectedFileOrFolder;
    selectedTest.value = { name, path, directory };

    if (selectedFileOrFolder.type === 'file') inputProtocol.getTestSpecificDetails(path);
}

// Event handler for form submission
function handleFormSubmit(data: KeyValueMap) {
    refreshButtonDisabled.value = true;
    if (!selectedTest.value) return;
    inputProtocol.registerForTestRunner(selectedTest.value.name, selectedTest.value.path, data);
}

// Output protocol handlers
function handleAllTestAvailable(data: TestPropertiesViewModel[]) {
    refreshButtonDisabled.value = false;
    testsAvailable.value = data;
    useRequestAnimationFrame(() => (testRunConfPanelIsLoaded.value = true));
}

function handleTestSpecificDetails(testConfig: KeyValueMap) {
    refreshButtonDisabled.value = false;
    currentTestLaunchConfiguration.value = testConfig;
}

function handleRegisterForTestRunnerFailure() {
    refreshButtonDisabled.value = false;
}

function handleRegisterForTestRunnerSuccess(uuid: string) {
    refreshButtonDisabled.value = false;
    router
        .push({ path: '/test-logs', query: { uuid } })
        .then(() => inputProtocol.startTestRunner(uuid));
}

function handleTestConfigurationForPathRefreshed(data: KeyValueMap) {
    refreshButtonDisabled.value = false;
    testRunConfLoader.value = false;
    currentTestLaunchConfiguration.value = data;
}

function handleTestListRefreshed(data: TestPropertiesViewModel[]) {
    refreshButtonDisabled.value = false;
    testsAvailable.value = data;
    testExplorerRefreshLoader.value = false;
}

// Refresh actions
function refreshTestAvailableList() {
    refreshButtonDisabled.value = true;
    testExplorerRefreshLoader.value = true;
    inputProtocol.refreshAllTestAvailable();
}

function refreshSelectedTestConfigurations() {
    testRunConfLoader.value = true;
    if (selectedTest.value) {
        refreshButtonDisabled.value = true;
        inputProtocol.refreshTestsConfigsInputsForPath(selectedTest.value.path);
    }
}

function downloadDocumentation(isDirectory = false) {
    downloadButtonDisabled.value = true;
    const selectedTestValue = selectedTest.value;
    const directory = selectedTestValue?.directory as string;
    const filePath = selectedTestValue?.path as string;
    const fileName = selectedTestValue?.name as string;
    download(
        isDirectory ? directory : filePath,
        'docs',
        'pdf',
        isDirectory ? directory || 'root' : fileName,
        {
            successHandler: downloadSuccess,
            errorHandler: downloadFailure,
        },
    );
}

function downloadSuccess() {
    downloadButtonDisabled.value = false;
    appEvents.POPUP.next({
        message: 'Documentation downloaded successfully',
        type: 'success',
    });
}

function downloadFailure(error: HttpErrorResponse) {
    downloadButtonDisabled.value = false;
    appEvents.POPUP.next({
        message: `Error ${error.code} while downloading documentation : ${error.cause}`,
        type: 'error',
    });
}

function lastSelectedTestPathRetrieved(lastSelectedPath: {
    name: string;
    path: string;
    directory: string;
}): void {
    selectedTest.value = lastSelectedPath;
}

function eventReporter(message: string, eventType: MessageLevel) {
    refreshButtonDisabled.value = false;
    appEvents.POPUP.next({
        type: eventType,
        message,
    });
}

// Assign output protocol
inputProtocol.outputProtocol = {
    allTestAvailable: handleAllTestAvailable,
    testSpecificDetails: handleTestSpecificDetails,
    registerForTestRunnerFailure: handleRegisterForTestRunnerFailure,
    registerForTestRunnerSuccess: handleRegisterForTestRunnerSuccess,
    testConfigurationForPathRefreshed: handleTestConfigurationForPathRefreshed,
    testListRefreshed: handleTestListRefreshed,
    lastSelectedTestPathRetrieved,
    eventReporter,
};

inputProtocol.getLastSelectedTestPath();

onMounted(() => {
    inputProtocol.getAllTestAvailable();
});

onUnmounted(() => inputProtocol.destroy());
</script>

<template>
    <HorizontalBox id="run-test">
        <PanelView id="test-explorer-panel">
            <template #title>
                <div>Test Explorer</div>
                <IconButton
                    id="refreshTestAvailableList"
                    icon="reload"
                    @click="refreshTestAvailableList"
                    button-label="Reload List"
                    button-text-color="midnightblue"
                    animation-name="spinning-animation"
                    :animation-in-progress="testExplorerRefreshLoader"
                    :disabled="refreshButtonDisabled"
                />
                <IconButton
                    icon="document"
                    button-label="Download Documentation"
                    button-text-color="seagreen"
                    id="download-documentation"
                    :role="'dir-documentation'"
                    @click="downloadDocumentation(true)"
                    :disabled="downloadButtonDisabled"
                />
            </template>
            <template #body>
                <FileSelectorList
                    :selectPath="selectedTest?.path"
                    :files="testsAvailable"
                    @itemSelected="handleTestSelected"
                />
            </template>
        </PanelView>
        <PanelView id="test-explorer-configuration-panel">
            <template #title v-if="!isDirectorySelected">
                {{ selectedTest?.name }}
                <IconButton
                    id="refreshSelectedTestConfigurations"
                    icon="reload"
                    @click="refreshSelectedTestConfigurations"
                    button-label="Reload Test Configuration"
                    button-text-color="midnightblue"
                    animation-name="spinning-animation"
                    :animation-in-progress="testRunConfLoader"
                    :disabled="refreshButtonDisabled"
                />
                <IconButton
                    icon="document"
                    button-label="Download Documentation"
                    button-text-color="seagreen"
                    :role="'file-documentation'"
                    :value="selectedTest?.path"
                    @click="downloadDocumentation()"
                    :disabled="downloadButtonDisabled"
                />
            </template>
            <template #body>
                <div style="display: contents">
                    <LazyRenderableView :render="loadForm">
                        <DynamicallyConfiguredForm
                            v-cloak
                            v-if="!isDirectorySelected"
                            formId="testLaunchConfiguration"
                            @onSubmitClicked="handleFormSubmit"
                            :disable-submit-button="false"
                            :form-configuration="currentTestLaunchConfiguration ?? {}"
                        />
                        <h2 v-else>No Test Selected</h2>
                    </LazyRenderableView>
                </div>
            </template>
        </PanelView>
    </HorizontalBox>
</template>

<style scoped>
#test-explorer-panel {
    flex: 1;
}

#test-explorer-configuration-panel {
    flex: 2;
}

#run-test {
    height: 100%;
}
</style>
