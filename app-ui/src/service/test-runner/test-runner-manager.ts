import { env } from '@/environment';
import {
    type TestLogType,
    type TestRunRecord,
    useTestLogsState,
} from '@/service/state-store/test-log-store.ts';
import type { KeyValueMap } from '@/common/types.ts';
import { map, retry } from 'rxjs';
import { TestLogTypeEnum } from '@/common/test-log-type';
import type { AxiosObservable } from 'axios-observable';
import { Axios as axios } from 'axios-observable/dist/axios';
import { ApiEndpointsConstants } from '@/common/constantes/api-endpoint-constants.ts';

type TestRunnerCallbacks = {
    onRegisterSuccess?: (uuid: string) => void;
    onRegisterFailure?: (error: Error) => void;
    onRegistrationLimitReached?: () => void;
};

type TestRunnerParameters = Readonly<{
    path: string;
    testParams: KeyValueMap;
    name: string;
}>;

type TestRegistrationToken = {
    token: string;
};

class TestRunnerManager {
    public registerNewTestRunner(
        testRunnerOptions: TestRunnerParameters,
        abortController: AbortController,
        callbacks: TestRunnerCallbacks,
    ): void {
        //<editor-fold desc="Prepare Callbacks">
        const { onRegisterSuccess, onRegisterFailure, onRegistrationLimitReached } = callbacks;
        //</editor-fold>

        //<editor-fold desc="Check if test can be added">
        if (!useTestLogsState().canAddAnotherTestLog) {
            onRegistrationLimitReached?.();
            return;
        }
        //</editor-fold>

        //<editor-fold desc="Prepare test runner data">
        const { path, testParams, name } = testRunnerOptions;
        const testFullName = this.composeTestPath(name, path);
        //</editor-fold>

        //<editor-fold desc="Register test runner">
        this.registerForTestRunner({ path, testParams }, abortController)
            .pipe(map((response) => response.data.token))
            .subscribe({
                next: (uuid) => {
                    useTestLogsState().addNewTestLogStream(uuid, testFullName, testParams);
                    onRegisterSuccess?.(uuid);
                },
                error: (error: Error) => {
                    onRegisterFailure?.(error);
                },
            });
        //</editor-fold>
    }

    public startTestRunner(uuid: string): void {
        //<editor-fold desc="Running and Storing the EventSource in Pinia State Store">
        const url = `${env.apiProperties.url}/${ApiEndpointsConstants.RUN_TEST}?uuid=${uuid}`;
        const eventSource = new EventSource(url);

        eventSource.onerror = () => {
            useTestLogsState().testLogsForUuidComplete(uuid);
        };

        useTestLogsState().registerEventSource(uuid, eventSource);
        useTestLogsState().setLastCreatedUuidTo(uuid);
        //</editor-fold>

        //<editor-fold desc="Registering Event Listeners">
        const eventPublisher = (ev: MessageEvent, eventName: TestLogType) => {
            useTestLogsState().putTestLogInHistoryWithUuid(
                { data: ev.data, type: eventName },
                uuid,
            );
        };

        for (const type of Object.values(TestLogTypeEnum)) {
            const typeString = type as TestLogType;
            eventSource.addEventListener(typeString, (event) => {
                eventPublisher(event, typeString);
            });
        }
        //</editor-fold>
    }

    public getTestLogsStream(uuid?: string): TestRunRecord['stream'] {
        return uuid
            ? useTestLogsState().getTestLogsByUuid(uuid).stream
            : useTestLogsState().getRecentTestLogs.stream;
    }

    /** Builds the full test path with the test name appended. */
    private composeTestPath(name: string, path: string): string {
        const segments = path.split(/[/\\]/);
        segments.pop();
        segments.push(name);
        return segments.join('/');
    }

    private registerForTestRunner(
        requestBody: { path: string; testParams: KeyValueMap },
        abortController: AbortController,
    ): AxiosObservable<TestRegistrationToken> {
        return axios
            .post(ApiEndpointsConstants.REGISTER_TO_TEST_RUNNER, requestBody, {
                signal: abortController.signal,
            })
            .pipe(retry(env.apiProperties));
    }
}

export const testRunnerManager = new TestRunnerManager();
