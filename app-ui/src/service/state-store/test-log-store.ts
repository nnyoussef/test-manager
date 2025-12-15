import { defineStore } from 'pinia';
import type { KeyValueMap } from '@/common/types.ts';
import { env } from '@/environment';
import { ReplaySubject } from 'rxjs';
import { computed, ref } from 'vue';
import type { TestLogTypeEnum } from '@/common/test-log-type.ts';

export type TestLogType = keyof typeof TestLogTypeEnum;

export type TestLog = { type: TestLogType; data: string };

const maxTestRunsNumber = env.maxTestRunnerCount;

export type TestRunRecord = {
    stream: ReplaySubject<TestLog>;
    params: KeyValueMap;
    createdAt: string;
    testName: string;
    eventSource: EventSource;
};

type TestRunHistory = KeyValueMap<TestRunRecord>;

// ✅ Composition API version of useTestLogsState
export const useTestLogsState = defineStore('test-logs', () => {
    // --- STATE ---
    const testLogsHistory = ref<TestRunHistory>({});
    const lastCreatedUuid = ref<string>('');

    // --- GETTERS (computed) ---
    const getRecentTestLogs = computed(() => {
        return testLogsHistory.value[lastCreatedUuid.value] as TestRunRecord;
    });

    const getTestLogsByUuid = (uuid: string): TestRunRecord =>
        testLogsHistory.value[uuid] as TestRunRecord;

    const getTestLogsHistory = <T>(
        mapperFunction: (uuid: string, creationDate: string, name: string) => T,
    ): T[] => {
        return Object.keys(testLogsHistory.value).map((uuid) =>
            mapperFunction(
                uuid,
                testLogsHistory.value[uuid]!.createdAt.toLocaleString(),
                testLogsHistory.value[uuid]!.testName,
            ),
        );
    };

    const canAddAnotherTestLog = computed(() => {
        const entries = Object.entries(testLogsHistory.value);
        return (
            entries.length < maxTestRunsNumber ||
            (entries[maxTestRunsNumber - 1]?.[1].stream.closed ?? true)
        );
    });

    const getTestLogParamsByUuid = (uuid: string) => testLogsHistory.value[uuid]?.params;

    // --- ACTIONS ---
    function addNewTestLogStream(uuid: string, testName: string, params: {}) {
        testLogsHistory.value[uuid] = {
            stream: new ReplaySubject(),
            params,
            createdAt: new Date().toLocaleString(),
            testName,
            eventSource: null as unknown as EventSource,
        };
    }

    function putTestLogInHistoryWithUuid(log: { type: TestLogType; data: string }, uuid: string) {
        const record = getTestLogsByUuid(uuid);
        if (!record) return;
        if (record.stream.closed) record.stream = new ReplaySubject();
        record.stream.next(log);
    }

    function testLogsForUuidComplete(uuid: string) {
        const record = testLogsHistory.value[uuid];
        record?.stream.complete();
        record?.eventSource.close();
    }

    function setLastCreatedUuidTo(uuid: string) {
        lastCreatedUuid.value = uuid;
        const keys = Object.keys(testLogsHistory.value);
        if (keys.length === maxTestRunsNumber) {
            const lastKnownUuid = keys[maxTestRunsNumber - 1] as string;
            const record = testLogsHistory.value[lastKnownUuid];
            record?.stream.complete();
            record?.stream.unsubscribe();
            delete testLogsHistory.value[lastKnownUuid];
        }
    }

    function clearTestLogStream(uuid: string) {
        const record = getTestLogsByUuid(uuid);
        if (!record) return;
        record.stream.complete();
        record.stream.unsubscribe();
        record.stream = new ReplaySubject();
    }

    function registerEventSource(uuid: string, eventSource: EventSource) {
        const record = getTestLogsByUuid(uuid);
        if (!record) return;
        clearTestLogStream(uuid);
        record?.eventSource?.close();
        record.eventSource = eventSource;
    }

    // --- RETURN EVERYTHING ---
    return {
        // state
        testLogsHistory,
        lastCreatedUuid,

        // getters
        getRecentTestLogs,
        getTestLogsByUuid,
        getTestLogsHistory,
        canAddAnotherTestLog,
        getTestLogParamsByUuid,

        // actions
        addNewTestLogStream,
        putTestLogInHistoryWithUuid,
        testLogsForUuidComplete,
        setLastCreatedUuidTo,
        registerEventSource,
    };
});
