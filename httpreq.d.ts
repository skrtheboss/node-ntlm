declare module 'httpreq' {
    declare type Callback = (err: Error | null | undefined, res?: Result) => void;

    interface Result {
        headers: Record<string, string>;
        body: unknown;
        statusCode: number;
        [key: string]: any;
    }

    declare interface Options {
        readonly parameters?: Record<string, unknown>;
        readonly json?: boolean;
        readonly files?: Record<string, unknown>;
        readonly body?: unknown;
        readonly headers?: Record<string, unknown>;
        readonly cookies?: ReadonlyArray<string>;
        readonly auth?: unknown;
        readonly binary?: boolean;
        readonly allowRedirects?: boolean;
        readonly maxRedirects?: number;
        readonly encodePostParameters?: boolean;
        readonly timeout?: number;
        readonly proxy?: unknown;
        readonly host?: string;
        readonly port?: number;
        readonly protocol?: 'http' | 'https';
        readonly rejectUnauthorized?: boolean;
    }

    declare function RequestFunction(url: string, options: Options, callback: Callback): void;

    export = {
        get: RequestFunction,
        put: RequestFunction,
        patch: RequestFunction,
        post: RequestFunction,
        delete: RequestFunction,
        options: RequestFunction,
    };
}
