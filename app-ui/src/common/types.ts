/**
 * This file contains types used across the application.
 *
 */
type KeyValueMap<T = unknown> = Record<string, T>;
type ReadonlyKeyValueMap<T = never> = Readonly<KeyValueMap<T>>;
type FunctionMap<T = never, R = never> = ReadonlyKeyValueMap<(arg: T) => R>;
type Optional<T> = T | null | undefined;
type TextOrNumber = string | number;
type CommonComponentAttribute = {
    role?: string;
    group?: string;
    value?: TextOrNumber;
};
type MessageLevel = 'error' | 'warning' | 'info' | 'success';
type HttpErrorResponse = {
    cause: string;
    code: string;
};

export type {
    KeyValueMap,
    ReadonlyKeyValueMap,
    FunctionMap,
    Optional,
    TextOrNumber,
    CommonComponentAttribute,
    MessageLevel,
    HttpErrorResponse,
};
