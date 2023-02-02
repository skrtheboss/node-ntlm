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
});
