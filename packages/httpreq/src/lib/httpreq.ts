import * as http from 'node:http';
import * as https from 'node:https';
import { parse } from 'node:url';
import { promisify } from 'node:util';

import {
    createType1Message,
    createType3Message,
    extractNtlmMessageFromAuthenticateHeader,
    parseType2Message,
} from '@node-ntlm/core';
import httpreq from 'httpreq';

declare interface HttpReqOptions {
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
interface Options extends HttpReqOptions {
    readonly url: string;
    readonly username: string;
    readonly password: string;
    readonly workstation?: string;
    readonly domain?: string;
    readonly lm_password?: Buffer;
    readonly nt_password?: Buffer;
    readonly [key: string]: unknown;
}

interface Result {
    headers: Record<string, string>;
    body: unknown;
    statusCode: number;
    [key: string]: any;
}

export async function method<T extends Result>(
    stringMethod: 'get' | 'put' | 'patch' | 'post' | 'delete' | 'options',
    options: Options
): Promise<T> {
    // extract non-ntlm-options:
    const { url, username, password, workstation, domain, lm_password, nt_password, ...httpreqOptions } = {
        workstation: '',
        domain: '',
        ...options,
    };

    // is https?
    const reqUrl = parse(options.url);
    const isHttps = reqUrl.protocol == 'https:';

    // set keepaliveAgent (http or https):
    let keepaliveAgent: http.Agent | https.Agent;

    if (isHttps) {
        keepaliveAgent = new https.Agent({ keepAlive: true });
    } else {
        keepaliveAgent = new http.Agent({ keepAlive: true });
    }

    // build type1 request:
    async function sendType1Message(): Promise<Result> {
        const type1msg = createType1Message({ domain, workstation });

        const { headers, body, ...safeOptions } = httpreqOptions;

        const type1options = {
            ...safeOptions,
            headers: {
                Connection: 'keep-alive',
                Authorization: type1msg,
            },
            timeout: options.timeout || 0,
            agent: keepaliveAgent,
            allowRedirects: false, // don't redirect in httpreq, because http could change to https which means we need to change the keepaliveAgent
        };

        // send type1 message to server:
        return (await promisify(httpreq[stringMethod])(options.url, type1options))!;
    }

    async function sendType3Message(res: Result): Promise<T> {
        // catch redirect here:
        if (res.headers.location) {
            return method(stringMethod, { ...options, url: res.headers.location });
        }

        const ntlmMessage = extractNtlmMessageFromAuthenticateHeader(res.headers['www-authenticate']);

        if (!ntlmMessage) {
            throw new Error('www-authenticate not found on response of second request');
        }

        // parse type2 message from server:
        const type2msg = parseType2Message(ntlmMessage);

        // create type3 message:
        const type3msg = createType3Message(type2msg, {
            domain,
            workstation,
            username,
            password,
            nt_password,
            lm_password,
        });

        // build type3 request:
        const type3options = {
            allowRedirects: false,
            agent: keepaliveAgent,
            ...httpreqOptions,
            headers: {
                Connection: 'Close',
                Authorization: type3msg,
                ...httpreqOptions.headers,
            },
        };

        // send type3 message to server:
        return (await promisify(httpreq[stringMethod])(options.url, type3options)) as T;
    }

    const res = await sendType1Message();

    return sendType3Message(res);
}

export function get<T extends Result>(options: Options): Promise<T> {
    return method('get', options);
}
export function put<T extends Result>(options: Options): Promise<T> {
    return method('put', options);
}
export function patch<T extends Result>(options: Options): Promise<T> {
    return method('patch', options);
}
export function post<T extends Result>(options: Options): Promise<T> {
    return method('post', options);
}
export function del<T extends Result>(options: Options): Promise<T> {
    return method('delete', options);
}
export function options<T extends Result>(options: Options): Promise<T> {
    return method('options', options);
}
