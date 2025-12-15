import type { KeyValueMap } from '@/common/types';

interface TestProperties {
    name: string;
    path: string;
    directory?: string;
}

interface TestEntity {
    /**
     * Gets the list of available tests.
     **/
    getAvailableTests(): TestProperties[];

    /**
     * Gets the list of available tests configurations.
     */
    getAvailableTestsConfigs(): KeyValueMap;

    /**
     * Sets the list of available tests.
     * @param tests - The list of available tests to set.
     */
    setAvailableTests(tests: TestProperties[]): void;

    /**
     * Sets the list of available tests configurations.
     * @param testConfigs - The list of available tests configurations to set.
     */
    setAvailableTestsConfigs(testConfigs: KeyValueMap): void;

    /**
     * Gets the configuration for a specific test.
     * @param path - The path of the test for which to get the configuration.
     * @returns The configuration for the specified test.
     */
    getTestConfigAt(path: string): KeyValueMap;

    /**
     * Clears the configuration for a specific test.
     * @param path - The path of the test for which to clear the configuration.
     * @returns True if the configuration was cleared, false otherwise.
     */
    clearTestConfigsWith(path: string): boolean;

    /**
     * Sets the configuration for a specific test.
     * @param path - The path of the test for which to set the configuration.
     * @param config - The configuration to set for the specified test.
     */
    setTestConfigsWith(path: string, config: KeyValueMap): void;

    /**
     * Resets the entity to its initial state.
     */
    reset(): void;

    /**
     * Checks if the entity has any tests available.
     */
    hasTests(): boolean;

    /**
     * Checks if the entity has a configuration for a specific test.
     * @param path - The path of the test to check for a configuration.
     */
    hasTestConfigAt(path: string): boolean;

    /**
     * Sets the last selected test path.
     * @param selectedTestPath
     */
    setLastSelectedTestPath(selectedTestPath: { name: string; path: string }): void;

    /**
     * Gets the last selected test path.
     */
    getLastSelectedTestPath(): { name: string; path: string };
}

const createRunTestEntity = (): TestEntity => {
    let availableTests: TestProperties[] = [];
    let availableTestsConfigs: KeyValueMap = {};
    let lastSelectedTestPath: TestProperties = { name: '', path: '' };

    const setLastSelectedTestPath = (selectedTestPath: TestProperties) => {
        lastSelectedTestPath = { ...selectedTestPath };
    };

    const getLastSelectedTestPath = () => ({ ...lastSelectedTestPath });

    const getAvailableTests = () => [...availableTests];
    const getAvailableTestsConfigs = () => ({ ...availableTestsConfigs });
    const getTestConfigAt = (path: string) => availableTestsConfigs[path] ?? {};

    const setAvailableTests = (tests: TestProperties[]) => {
        availableTests = [...tests];
    };
    const setAvailableTestsConfigs = (testConfigs: KeyValueMap) => {
        availableTestsConfigs = { ...testConfigs };
    };
    const setTestConfigsWith = (path: string, config: KeyValueMap) => {
        availableTestsConfigs[path] = { ...config };
    };

    const hasTests = () => availableTests.length > 0;
    const hasTestConfigAt = (path: string) => availableTestsConfigs.hasOwnProperty(path);

    const clearTestConfigsWith = (path: string) => {
        if (availableTestsConfigs.hasOwnProperty(path)) {
            delete [path];
            return true;
        }
        return false;
    };

    const reset = () => {
        availableTests = [];
        availableTestsConfigs = {};
    };

    return {
        getAvailableTests,
        getAvailableTestsConfigs,
        setAvailableTests,
        setAvailableTestsConfigs,
        getTestConfigAt,
        clearTestConfigsWith,
        setTestConfigsWith,
        hasTests,
        hasTestConfigAt,
        reset,
        setLastSelectedTestPath,
        getLastSelectedTestPath,
    };
};

export { createRunTestEntity, type TestEntity, type TestProperties };
