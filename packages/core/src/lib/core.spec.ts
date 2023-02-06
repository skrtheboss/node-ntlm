import { fetch, getGlobalDispatcher, MockAgent, setGlobalDispatcher } from 'undici';

import { generateNegotiateResponse } from '../../testing';
import { createType1Message, createType3Message, parseType2Message } from './core';

describe('core', () => {
    describe('createType1Message', () => {
        it('should work', () => {
            expect(createType1Message({ domain: 'test.host', workstation: 'pc1' })).toMatchInlineSnapshot(
                `"NTLM TlRMVEVTVC5IT1NUKwAAAAMAAwAoAAAABQEoCgAAAA9QQzEAAAAAAAAAAAAAAAAAAAAAAA=="`
            );
        });
    });

    describe('generateResponseHeader', () => {
        it('should work', () => {
            const message = parseType2Message(
                generateNegotiateResponse(createType1Message({ domain: 'test.host', workstation: 'pc1' }))
            );
            expect(message).toEqual({
                negotiateFlags: 66_054,
                reserved: Buffer.alloc(8),
                serverChallenge: Buffer.from([239, 205, 171, 137, 103, 69, 35, 1]),
                signature: Buffer.from([78, 84, 76, 77, 83, 83, 80, 0]),
                targetName: Buffer.from(Buffer.from('ALPHA').toString('ascii')),
                targetNameLen: 5,
                targetNameMaxLen: 5,
                targetNameOffset: 40,
                type: 2,
            });
        });
    });

    describe('createType3Message', () => {
        it('should work', () => {
            const message = parseType2Message(
                generateNegotiateResponse(createType1Message({ domain: 'test.host', workstation: 'pc1' }))
            );
            expect(
                createType3Message(message, {
                    domain: 'test.host',
                    workstation: 'pc1',
                    username: 'test',
                    password: 'test',
                })
            ).toMatchInlineSnapshot(
                `"NTLM TlRMTVNTUAADAAAAGAAYAFgAAAAYABgAcAAAAAkACQBIAAAABAAEAFEAAAADAAMAVQAAAAAAAACIAAAABYKIogUBKAoAAAAPVEVTVC5IT1NUdGVzdFBDMcigt5silHOnTNsEhCwQrAKlSxrozzOQDVdKrEd/D9Mr9/X2g89PboBNxUzdwmsVWA=="`
            );
        });
    });

    describe('workflow', () => {
        const agent = new MockAgent();

        agent.disableNetConnect();

        const defaultDispatcher = getGlobalDispatcher();

        setGlobalDispatcher(agent);

        const baseUrl = 'http://test-service.url';

        const client = agent.get(baseUrl);

        afterEach(async () => {
            agent.assertNoPendingInterceptors();
        });

        afterAll(async () => {
            await client.close();
            setGlobalDispatcher(defaultDispatcher);
        });

        it('test', async () => {
            client.intercept({ path: '/api', method: 'GET', headers: { authorization: /^NTLM / } }).reply(options => ({
                statusCode: 401,
                responseOptions: {
                    headers: {
                        'www-authenticate': generateNegotiateResponse((options.headers as any)[1]!),
                    },
                },
            }));

            client
                .intercept({
                    path: '/api',
                    method: 'GET',
                    headers: {
                        authorization:
                            'NTLM TlRMTVNTUAADAAAAGAAYAFgAAAAYABgAcAAAAAkACQBIAAAABAAEAFEAAAADAAMAVQAAAAAAAACIAAAABYKIogUBKAoAAAAPVEVTVC5IT1NUdGVzdFBDMcigt5silHOnTNsEhCwQrAKlSxrozzOQDVdKrEd/D9Mr9/X2g89PboBNxUzdwmsVWA==',
                    },
                })
                .reply(200, { test: 5 }, { headers: { 'Content-Type': 'application/json' } });

            const negotiateMessage = createType1Message({ domain: 'test.host', workstation: 'pc1' });

            const negotiateResponse = await fetch('http://test-service.url/api', {
                headers: { authorization: negotiateMessage },
                keepalive: true,
            });

            const type2Message = negotiateResponse.headers.get('www-authenticate');

            if (!type2Message) {
                throw new Error('Could not find type 2 message on response headers!');
            }

            const authMessage = createType3Message(parseType2Message(type2Message), {
                domain: 'test.host',
                workstation: 'pc1',
                username: 'test',
                password: 'test',
            });

            const result = await fetch('http://test-service.url/api', {
                headers: { Authorization: authMessage },
                keepalive: false,
            });

            expect(await result.json()).toEqual({ test: 5 });
        });
    });
});
