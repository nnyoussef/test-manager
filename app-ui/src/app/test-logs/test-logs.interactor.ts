import { createTestLogEntity, type TestLogEntity } from '@/app/test-logs/test-logs.entity.ts';
import { bufferCount, map } from 'rxjs';
import { BaseInteractor } from '@/common/base-interactor';
import type {
    TestLogHistoryViewModel,
    TestLogsInputProtocol,
    TestLogsOutputProtocol,
} from '@/app/test-logs/test-logs.protocol.ts';
import type { Optional } from '@/common/types.ts';
import type { TestLog, TestRunRecord } from '@/service/state-store/test-log-store.ts';
import { testRunnerManager } from '@/service/test-runner/test-runner-manager.ts';
import { ApiEndpointsConstants } from '@/common/constantes/api-endpoint-constants.ts';

class TestLogsInteractor
    extends BaseInteractor<TestLogsOutputProtocol, TestLogEntity>
    implements TestLogsInputProtocol
{
    private static readonly SELECTED_UUID_KEY = 'selectedUuid';

    constructor(forcedUuid: Optional<string>) {
        super();
        this.entity = this.initEntity(forcedUuid);
    }

    startListeningToTestLogs(preProcessing: () => void, uuid?: string): void {
        let hasPreProcessed = false;

        const handleEvents = (events: TestLog[]): void => {
            if (!hasPreProcessed) {
                preProcessing();
                hasPreProcessed = true;
            }
            this.outputProtocol?.onTestLogStreamReceived(events);
        };

        const logStream = testRunnerManager
            .getTestLogsStream(uuid ?? this.entity.selectedUuid ?? '')
            .pipe(
                map((log) => {
                    if (log.type === 'HTML_REPORT')
                        return {
                            type: 'HTML_REPORT',
                            data: this.createFullDownloadLink(log.data),
                        } satisfies TestLog;
                    return log;
                }),
            );

        this.entity.testLogsListener = logStream
            ?.pipe(bufferCount(this.getAppEnv().maxElementToRenderPerRenderingCycle))
            .subscribe(handleEvents);
    }

    checkIfStreamIsFromServer(uuid: string): void {
        const testLog = this.getTestLogsState().getTestLogsByUuid(uuid);
        const isStreamFromServer =
            !!testLog && testLog.eventSource?.readyState !== EventSource.CLOSED;
        this.outputProtocol?.onStreamSourceChecked(isStreamFromServer);
    }

    stopListeningToTestLogs(): void {
        this.entity.unsubscribeTestLogListener();
    }

    fetchTestLogsByUuid(uuid: string): void {
        const testLogs: TestRunRecord = this.getTestLogsState().getTestLogsByUuid(uuid);
        this.outputProtocol?.onTestLogFetched(testLogs);
    }

    fetchTestLogsHistory(): void {
        const mapToViewModel = (
            uuid: string,
            creationDate: string,
            testName: string,
        ): TestLogHistoryViewModel => ({
            label: testName,
            creationDate,
            value: uuid,
        });

        const history = this.getTestLogsState().getTestLogsHistory(mapToViewModel).reverse();
        this.outputProtocol?.onTestLogsHistoryFetched(history);
    }

    fetchTestLogParams(uuid: string): void {
        const params = this.getTestLogsState().getTestLogParamsByUuid(uuid);
        this.outputProtocol?.onTestLogParamsFetched(params);
    }

    fetchSelectedUuid(): void {
        const selected = this.entity.selectedUuid ?? 'No UUID Found';
        this.outputProtocol?.onSelectedUuidFetched(selected);
    }

    setUuidAsSelected(selectedUuid: string): void {
        this.entity.selectedUuid = selectedUuid;
        this.saveToGpStateStore(TestLogsInteractor.SELECTED_UUID_KEY, selectedUuid);
    }

    repeatLastTestRun(): void {
        this.entity.selectedUuid && testRunnerManager.startTestRunner(this.entity.selectedUuid);
    }

    protected initEntity(forcedUuid: Optional<string>): TestLogEntity {
        const entity = createTestLogEntity();
        const persistedUuid = this.getFromGpStateStore<string | undefined>(
            TestLogsInteractor.SELECTED_UUID_KEY,
            undefined,
        );

        entity.selectedUuid = forcedUuid ?? persistedUuid;

        if (forcedUuid) {
            this.saveToGpStateStore(TestLogsInteractor.SELECTED_UUID_KEY, forcedUuid);
        }

        return entity;
    }

    protected getComponentName(): string {
        return 'testLogs';
    }

    destroy(): void {
        this.stopListeningToTestLogs();
    }

    private createFullDownloadLink(url: string): string {
        return `${this.getAppEnv().apiProperties.url}/${ApiEndpointsConstants.DOC_DOWNLOAD}/${url}`;
    }
}

type InteractorType = TestLogsInputProtocol & BaseInteractor<TestLogsOutputProtocol, TestLogEntity>;

const useTestLogsInteractor = (forcedUuid: Optional<string>): InteractorType =>
    new TestLogsInteractor(forcedUuid) as InteractorType;

export { useTestLogsInteractor };
