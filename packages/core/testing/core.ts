/**
 * This implementation was copied from
 * https://github.com/einfallstoll/express-ntlm/blob/master/lib/NTLM_No_Proxy.js
 */
const NEGOTIATE_OEM = 1 << 1;
const REQUEST_TARGET = 1 << 2;
const NEGOTIATE_NTLM_KEY = 1 << 9;
const TARGET_TYPE_DOMAIN = 1 << 16;
const NEGOTIATE_NTLM2_KEY = 1 << 19;
const NEGOTIATE_TARGET_INFO = 1 << 23;

function negotiate(ntlm_negotiate: Buffer): Buffer {
    const target_name = 'ALPHA';
    let challenge_flags = NEGOTIATE_OEM | REQUEST_TARGET | TARGET_TYPE_DOMAIN;

    // Follow requested NTLM protocol version
    const request_flags = ntlm_negotiate.readUInt32LE(12);
    const ntlm_version = request_flags & NEGOTIATE_NTLM2_KEY ? 2 : 1;
    let header_len;
    let data_len;

    if (ntlm_version === 2) {
        challenge_flags |= NEGOTIATE_NTLM2_KEY | NEGOTIATE_TARGET_INFO;
        header_len = 40 + 8;
        data_len = target_name.length + (2 * target_name.length + 8);
    } else {
        challenge_flags |= NEGOTIATE_NTLM_KEY;
        header_len = 40;
        data_len = target_name.length;
    }

    const challenge = Buffer.alloc(header_len + data_len);
    let offset = 0;

    const header = 'NTLMSSP\0';
    offset += challenge.write(header, 0, 'ascii');

    // Type 2 message
    offset = challenge.writeUInt32LE(0x00_00_00_02, offset);

    // Target name security buffer
    offset = challenge.writeUInt16LE(target_name.length, offset);
    offset = challenge.writeUInt16LE(target_name.length, offset);
    offset = challenge.writeUInt32LE(header_len, offset);

    // Flags
    offset = challenge.writeUInt32LE(challenge_flags, offset);

    // Server challenge
    offset = challenge.writeUInt32LE(0x89_ab_cd_ef, offset);
    offset = challenge.writeUInt32LE(0x01_23_45_67, offset);

    // Context
    offset = challenge.writeUInt32LE(0, offset);
    offset = challenge.writeUInt32LE(0, offset);

    if (ntlm_version === 2) {
        // Target info security buffer
        offset = challenge.writeUInt16LE(target_name.length * 2 + 8, offset);
        offset = challenge.writeUInt16LE(target_name.length * 2 + 8, offset);
        offset = challenge.writeUInt32LE(header_len + target_name.length, offset);
    }

    // Target name data
    offset += challenge.write(target_name, offset, 'ascii');

    if (ntlm_version === 2) {
        // Target info data
        offset = challenge.writeUInt16LE(0x02_00, offset); // Domain
        offset = challenge.writeUInt16LE(target_name.length * 2, offset);
        offset += challenge.write(target_name, offset, 'ucs2');
        offset = challenge.writeUInt16LE(0x00_00, offset); // Terminator block
        challenge.writeUInt16LE(0, offset);
    }

    return challenge;
}

export function generateNegotiateResponse(type1Message: string): string {
    const match = /NTLM (.+)/.exec(type1Message);

    if (match == null) throw new Error('No NTLM type1 message!');

    const ntlmNegotiate = Buffer.from(match[1], 'base64');
    const challenge = negotiate(ntlmNegotiate);

    return `NTLM ${challenge.toString('base64')}`;
}
