import { Axios as axios } from 'axios-observable';
import type { HttpErrorResponse } from '@/common/types.ts';
import { ApiEndpointsConstants } from '@/common/constantes/api-endpoint-constants.ts';

export const download = (
    filePath: string,
    category: 'docs' | 'forms' | 'output',
    fileExtension?: string,
    outputFileName: string = 'downloaded-file',
    handlers?: {
        successHandler?: () => void;
        errorHandler?: (error: HttpErrorResponse) => void;
    },
) => {
    const fullEndPoint = `${ApiEndpointsConstants.DOC_DOWNLOAD}/${filePath}`;
    axios
        .get(fullEndPoint, {
            responseType: 'blob',
            params: { category, fileExtension },
        })
        .subscribe({
            next: (response) => {
                const blob = new Blob([response.data]);
                const link = document.createElement('a');
                link.href = globalThis.URL.createObjectURL(blob);
                link.setAttribute('download', `${outputFileName}.${fileExtension}`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                globalThis.URL.revokeObjectURL(link.href);
                handlers?.successHandler?.();
            },
            error: handlers?.errorHandler,
        });
};

export const debounce = (fn: Function, delay: number) => {
    let timer: number | undefined = undefined;
    return function (...args: unknown[]) {
        clearTimeout(timer);
        // @ts-ignore
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
};
