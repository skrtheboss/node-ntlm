import * as http from 'node:http';
import * as https from 'node:https';

import { createType1Message, createType3Message, parseType2Message, Type3MessageOptions } from '@node-ntlm/core';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import devnull from 'dev-null';

export { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse };

/**
 * @property username The username of the user you are authenticating as.
 * @property password The password of the user you are authenticating as.
 * @property domain The domain of the user you are authenticating as.
 * @property workstation The workstation in use. Defaults to the current hostname if undefined.
 */
export interface NtlmCredentials {
    readonly username: string;
    readonly password: string;
    readonly domain: string;
    readonly workstation?: string;
}

/**
 * @param credentials An NtlmCredentials object containing the username and password
 * @param AxiosConfig The Axios config for the instance you wish to create
 *
 * @returns This function returns an axios instance configured to use the provided credentials
 */
export function NtlmClient(credentials: NtlmCredentials, AxiosConfig?: AxiosRequestConfig): AxiosInstance {
    const config: AxiosRequestConfig = AxiosConfig ?? {};

    if (!config.httpAgent) {
        config.httpAgent = new http.Agent({ keepAlive: true });
    }

    if (!config.httpsAgent) {
        config.httpsAgent = new https.Agent({ keepAlive: true });
    }

    const client = axios.create(config);

    const safeCredentials: Type3MessageOptions = {
        workstation: '',
        ...credentials,
    };

    client.interceptors.response.use(
        response => {
            return response;
        },
        async (err: AxiosError) => {
            const error: AxiosResponse | undefined = err.response;

            if (
                error &&
                error.status === 401 &&
                error.headers['www-authenticate'] &&
                error.headers['www-authenticate'].includes('NTLM')
            ) {
                // This length check is a hack because SharePoint is awkward and will
                // include the Negotiate option when responding with the T2 message
                // There is nore we could do to ensure we are processing correctly,
                // but this is the easiest option for now
                if (error.headers['www-authenticate'].length < 50) {
                    const t1Msg = createType1Message(safeCredentials);

                    error.config.headers['Authorization'] = t1Msg;
                } else {
                    const t2Msg = parseType2Message(error.headers['www-authenticate']);

                    const t3Msg = createType3Message(t2Msg, safeCredentials);

                    error.config.headers['X-retry'] = 'false';
                    error.config.headers['Authorization'] = t3Msg;
                }

                if (error.config.responseType === 'stream') {
                    const stream = err.response?.data as http.IncomingMessage | undefined;
                    // Read Stream is holding HTTP connection open in our
                    // TCP socket. Close stream to recycle back to the Agent.
                    if (stream && !stream.readableEnded) {
                        await new Promise<void>(resolve => {
                            stream.pipe(devnull());
                            stream.once('close', resolve);
                        });
                    }
                }

                return client(error.config);
            } else {
                throw err;
            }
        }
    );

    return client;
}
