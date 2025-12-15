import { Axios as axios } from 'axios-observable/dist/axios';
import { ApiEndpointsConstants } from '@/common/constantes/api-endpoint-constants.ts';
import { map, retry } from 'rxjs';
import { env } from '@/environment';
import type { ReadonlyKeyValueMap } from '@/common/types.ts';

type TestResponseRecord = {
    name: string;
    path: string;
};
type AllAvailableTestResponse = TestResponseRecord[];

class ResourceService {
    /**
     * Fetches all available tests from the server.
     * @param abortController - An AbortController to cancel the request if needed.
     * @returns An AxiosObservable that emits an array of available tests.
     */
    public fetchAllAvailableTests(abortController: AbortController) {
        return axios
            .get<AllAvailableTestResponse>(ApiEndpointsConstants.GET_ALL_TESTS, {
                signal: abortController.signal,
            })
            .pipe(retry(env.apiProperties))
            .pipe(map((res) => res.data));
    }

    /**
     * Fetches specific details for a given test path.
     * @param path - The path of the test to fetch details for.
     * @param abortController - An AbortController to cancel the request if needed.
     * @returns An AxiosObservable that emits a map of test details.
     */
    public fetchTestSpecificDetails(path: string, abortController: AbortController) {
        return axios
            .get(ApiEndpointsConstants.GET_ALL_TEST_DETAILS, {
                params: { from: path },
                signal: abortController.signal,
            })
            .pipe(retry(env.apiProperties))
            .pipe(map((res) => res.data as ReadonlyKeyValueMap));
    }
}

export const resourceService = new ResourceService();
