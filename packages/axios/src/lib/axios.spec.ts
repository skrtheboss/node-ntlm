import { generateNegotiateResponse } from '@node-ntlm/core/testing';
import nock from 'nock';

import { NtlmClient, NtlmCredentials } from './axios';

describe('axios', () => {
    const baseUrl = 'http://test-service.url';

    const testService = nock(baseUrl);

    afterEach(() => {
        try {
            testService.done();
        } finally {
            nock.cleanAll();
        }
    });

    it('should perform negotiation', async () => {
        testService.get('/api').reply(401, undefined, { 'www-authenticate': 'NTLM invalid' });

        testService
            .get('/api', undefined, { reqheaders: { authorization: /^NTLM / } })
            .reply(function (res, body, callback) {
                callback(null, [
                    401,
                    {},
                    { 'www-authenticate': generateNegotiateResponse(this.req.headers['authorization']) },
                ]);
            });

        testService
            .get('/api')
            .matchHeader(
                'authorization',
                'NTLM TlRMTVNTUAADAAAAGAAYAGEAAAAYABgAeQAAAAYABgBIAAAACAAIAE4AAAALAAsAVgAAAAAAAACRAAAABYKIogUBKAoAAAAPRE9NQUlOdXNlcm5hbWVXT1JLU1RBVElPTo6k9Y9DkNma6cz4qCbRqD0HEQoc5e5AbwEhZjF1saNwQVJTfRe7vwUz7mftucEewg=='
            )
            .reply(200, { test: 5 }, { 'Content-Type': 'application/json' });

        const credentials: NtlmCredentials = {
            username: 'username',
            password: 'password',
            domain: 'domain',
            workstation: 'workstation',
        };

        const client = NtlmClient(credentials);

        const res = await client<{ test: 5 }>({
            url: `${baseUrl}/api`,
            method: 'get',
        });

        expect(res.data).toEqual({ test: 5 });
    });

    it('should perform negotiation with multiple params in authentication', async () => {
        testService.get('/api').reply(401, undefined, { 'www-authenticate': 'NTLM invalid' });

        testService
            .get('/api', undefined, { reqheaders: { authorization: /^NTLM / } })
            .reply(function (res, body, callback) {
                callback(null, [
                    401,
                    {},
                    {
                        'www-authenticate': `Negotiate, ${generateNegotiateResponse(
                            this.req.headers['authorization']
                        )}, Basic realm="itsahiddenrealm.example.net"`,
                    },
                ]);
            });

        testService
            .get('/api')
            .matchHeader(
                'authorization',
                'NTLM TlRMTVNTUAADAAAAGAAYAGEAAAAYABgAeQAAAAYABgBIAAAACAAIAE4AAAALAAsAVgAAAAAAAACRAAAABYKIogUBKAoAAAAPRE9NQUlOdXNlcm5hbWVXT1JLU1RBVElPTo6k9Y9DkNma6cz4qCbRqD0HEQoc5e5AbwEhZjF1saNwQVJTfRe7vwUz7mftucEewg=='
            )
            .reply(200, { test: 5 }, { 'Content-Type': 'application/json' });

        const credentials: NtlmCredentials = {
            username: 'username',
            password: 'password',
            domain: 'domain',
            workstation: 'workstation',
        };

        const client = NtlmClient(credentials);

        const res = await client<{ test: 5 }>({
            url: `${baseUrl}/api`,
            method: 'get',
        });

        expect(res.data).toEqual({ test: 5 });
    });
});
