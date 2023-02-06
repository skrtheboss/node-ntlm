import { generateNegotiateResponse } from '@node-ntlm/core/testing';
import nock from 'nock';

import { get } from './httpreq';

describe('httpreq', () => {
    const baseUrl = 'http://test-service.url';

    const testService = nock(baseUrl);

    afterEach(() => {
        try {
            testService.done();
        } finally {
            nock.cleanAll();
        }
    });

    it('te', async () => {
        testService.get('/api').reply(function (res, body, callback) {
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

        const res = await get({
            url: `${baseUrl}/api`,
            username: 'username',
            password: 'password',
            domain: 'domain',
            workstation: 'workstation',
        });

        expect(res).toHaveProperty('body', '{"test":5}');
    });
});