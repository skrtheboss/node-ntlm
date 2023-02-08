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

    it('should perform negotiation', async () => {
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
            .matchHeader('authorization', /NTLM/)
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

    it('should perform negotiation with multiple params in authentication', async () => {
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
            .matchHeader('authorization', /NTLM/)
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
