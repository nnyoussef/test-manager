export class ApiEndpointsConstants {
    public static readonly GET_ALL_TEST_DETAILS: string = 'resources/all-tests-details';
    public static readonly GET_ALL_TESTS: string = 'resources/all-tests';
    public static readonly REGISTER_TO_TEST_RUNNER: string = 'test-runner/register';
    public static readonly RUN_TEST: string = 'test-runner/run';
    public static readonly DOC_DOWNLOAD: string = 'resources/download';

    private constructor() {
        throw new Error('Constants classes to not be initialized');
    }
}
