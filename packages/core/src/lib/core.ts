import { createHash, createHmac } from 'node:crypto';

import { DES, Des } from 'des.js';
import { create as createMd4 } from 'js-md4';

import { insertZerosEvery7Bits } from './utils';

const NTLMFlag = {
    NegotiateUnicode: 0x00_00_00_01,
    NegotiateOEM: 0x00_00_00_02,
    RequestTarget: 0x00_00_00_04,
    Unknown9: 0x00_00_00_08,
    NegotiateSign: 0x00_00_00_10,
    NegotiateSeal: 0x00_00_00_20,
    NegotiateDatagram: 0x00_00_00_40,
    NegotiateLanManagerKey: 0x00_00_00_80,
    Unknown8: 0x00_00_01_00,
    NegotiateNTLM: 0x00_00_02_00,
    NegotiateNTOnly: 0x00_00_04_00,
    Anonymous: 0x00_00_08_00,
    NegotiateOemDomainSupplied: 0x00_00_10_00,
    NegotiateOemWorkstationSupplied: 0x00_00_20_00,
    Unknown6: 0x00_00_40_00,
    NegotiateAlwaysSign: 0x00_00_80_00,
    TargetTypeDomain: 0x00_01_00_00,
    TargetTypeServer: 0x00_02_00_00,
    TargetTypeShare: 0x00_04_00_00,
    NegotiateExtendedSecurity: 0x00_08_00_00,
    NegotiateIdentify: 0x00_10_00_00,
    Unknown5: 0x00_20_00_00,
    RequestNonNTSessionKey: 0x00_40_00_00,
    NegotiateTargetInfo: 0x00_80_00_00,
    Unknown4: 0x01_00_00_00,
    NegotiateVersion: 0x02_00_00_00,
    Unknown3: 0x04_00_00_00,
    Unknown2: 0x08_00_00_00,
    Unknown1: 0x10_00_00_00,
    Negotiate128: 0x20_00_00_00,
    NegotiateKeyExchange: 0x40_00_00_00,
    Negotiate56: 0x80_00_00_00,
} as const;

const NTLMTypeFlags = {
    TYPE1_FLAGS:
        NTLMFlag.NegotiateUnicode +
        NTLMFlag.NegotiateOEM +
        NTLMFlag.RequestTarget +
        NTLMFlag.NegotiateNTLM +
        NTLMFlag.NegotiateOemDomainSupplied +
        NTLMFlag.NegotiateOemWorkstationSupplied +
        NTLMFlag.NegotiateAlwaysSign +
        NTLMFlag.NegotiateExtendedSecurity +
        NTLMFlag.NegotiateVersion +
        NTLMFlag.Negotiate128 +
        NTLMFlag.Negotiate56,
    TYPE2_FLAGS:
        NTLMFlag.NegotiateUnicode +
        NTLMFlag.RequestTarget +
        NTLMFlag.NegotiateNTLM +
        NTLMFlag.NegotiateAlwaysSign +
        NTLMFlag.NegotiateExtendedSecurity +
        NTLMFlag.NegotiateTargetInfo +
        NTLMFlag.NegotiateVersion +
        NTLMFlag.Negotiate128 +
        NTLMFlag.Negotiate56,
} as const;

export function createType1Message(options: Type1MessageOptions): string {
    const domain = escape(options.domain.toUpperCase());
    const workstation = escape(options.workstation.toUpperCase());
    const protocol = 'NTLMSSP\0';

    const BODY_LENGTH = 40;

    let type1flags = NTLMTypeFlags.TYPE1_FLAGS;
    if (!domain || domain === '') type1flags = type1flags - NTLMFlag.NegotiateOemDomainSupplied;

    let pos = 0;
    const buf = Buffer.alloc(BODY_LENGTH + domain.length + workstation.length);

    // protocol
    pos = buf.write(protocol, pos, protocol.length);
    // type 1
    buf.writeUInt32LE(1, pos);
    // TYPE1 flag
    buf.writeUInt32LE(type1flags, pos);

    // domain length
    pos = buf.writeUInt16LE(domain.length, pos);
    // domain max length
    pos = buf.writeUInt16LE(domain.length, pos);
    // domain buffer offset
    pos = buf.writeUInt32LE(BODY_LENGTH + workstation.length, pos);

    // workstation length
    pos = buf.writeUInt16LE(workstation.length, pos);
    // workstation max length
    pos = buf.writeUInt16LE(workstation.length, pos);
    // workstation buffer offset
    pos = buf.writeUInt32LE(BODY_LENGTH, pos);

    // ProductMajorVersion
    pos = buf.writeUInt8(5, pos);
    // ProductMinorVersion
    pos = buf.writeUInt8(1, pos);
    // ProductBuild
    pos = buf.writeUInt16LE(2600, pos);

    // VersionReserved1
    pos = buf.writeUInt8(0, pos);
    // VersionReserved2
    pos = buf.writeUInt8(0, pos);
    // VersionReserved3
    pos = buf.writeUInt8(0, pos);
    // NTLMRevisionCurrent
    pos = buf.writeUInt8(15, pos);

    // length checks is to fix issue #46 and possibly #57
    if (workstation.length != 0) {
        // workstation string
        pos = buf.write(workstation, pos, workstation.length, 'ascii');
    }

    if (domain.length != 0) {
        // domain string
        buf.write(domain, pos, domain.length, 'ascii');
    }

    return `NTLM ${buf.toString('base64')}`;
}

export interface Type1MessageOptions {
    readonly domain: string;
    readonly workstation: string;
}

export interface Type3MessageOptions {
    readonly domain: string;
    readonly workstation: string;
    readonly username: string;
    readonly password: string;
    readonly lm_password?: Buffer;
    readonly nt_password?: Buffer;
}

export interface Type2Message {
    signature: Buffer;
    type: number;
    targetNameLen: number;
    targetNameMaxLen: number;
    targetNameOffset: number;
    targetName: Buffer;
    negotiateFlags: number;
    serverChallenge: Buffer;
    reserved: Buffer;
    targetInfoLen?: number;
    targetInfoMaxLen?: number;
    targetInfoOffset?: number;
    targetInfo?: Buffer;
}

export function parseType2Message(rawmsg: string): Type2Message {
    const match = rawmsg.match(/NTLM (.+)?/);
    if (!match || !match[1]) {
        throw new Error("Couldn't find NTLM in the message type2 comming from the server");
    }

    const buf = Buffer.from(match[1], 'base64');

    const signature = buf.subarray(0, 8);
    const type = buf.readInt16LE(8);

    if (type != 2) {
        throw new Error("Server didn't return a type 2 message");
    }

    const targetNameLen = buf.readInt16LE(12);
    const targetNameMaxLen = buf.readInt16LE(14);
    const targetNameOffset = buf.readInt32LE(16);
    const targetName = buf.subarray(targetNameOffset, targetNameOffset + targetNameMaxLen);

    const negotiateFlags = buf.readInt32LE(20);
    const serverChallenge = buf.subarray(24, 32);
    const reserved = buf.subarray(32, 40);

    const msg: Type2Message = {
        signature,
        type,
        targetNameLen,
        targetNameMaxLen,
        targetNameOffset,
        targetName,
        negotiateFlags,
        serverChallenge,
        reserved,
    };

    if (negotiateFlags & NTLMFlag.NegotiateTargetInfo) {
        msg.targetInfoLen = buf.readInt16LE(40);
        msg.targetInfoMaxLen = buf.readInt16LE(42);
        msg.targetInfoOffset = buf.readInt32LE(44);
        msg.targetInfo = buf.subarray(msg.targetInfoOffset, msg.targetInfoOffset + msg.targetInfoLen);
    }

    return msg;
}

export function createType3Message(msg2: Type2Message, options: Type3MessageOptions) {
    const nonce = msg2.serverChallenge;
    const username = options.username;
    const password = options.password;
    const lm_password = options.lm_password;
    const nt_password = options.nt_password;
    const negotiateFlags = msg2.negotiateFlags;

    const isUnicode = negotiateFlags & NTLMFlag.NegotiateUnicode;
    const isNegotiateExtendedSecurity = negotiateFlags & NTLMFlag.NegotiateExtendedSecurity;

    const BODY_LENGTH = 72;

    const domainName = escape(options.domain.toUpperCase());
    const workstation = escape(options.workstation.toUpperCase());

    let workstationBytes: Buffer;
    let domainNameBytes: Buffer;
    let usernameBytes: Buffer;
    let encryptedRandomSessionKeyBytes: Buffer;

    const encryptedRandomSessionKey = '';
    if (isUnicode) {
        workstationBytes = Buffer.from(workstation, 'utf16le');
        domainNameBytes = Buffer.from(domainName, 'utf16le');
        usernameBytes = Buffer.from(username, 'utf16le');
        encryptedRandomSessionKeyBytes = Buffer.from(encryptedRandomSessionKey, 'utf16le');
    } else {
        workstationBytes = Buffer.from(workstation, 'ascii');
        domainNameBytes = Buffer.from(domainName, 'ascii');
        usernameBytes = Buffer.from(username, 'ascii');
        encryptedRandomSessionKeyBytes = Buffer.from(encryptedRandomSessionKey, 'ascii');
    }

    let lmChallengeResponse = calc_resp(lm_password != null ? lm_password : createLMHashedPasswordV1(password), nonce);
    let ntChallengeResponse = calc_resp(nt_password != null ? nt_password : createNTHashedPasswordV1(password), nonce);

    if (isNegotiateExtendedSecurity) {
        /*
         * NTLMv2 extended security is enabled. While this technically can mean NTLMv2 extended security with NTLMv1 protocol,
         * servers that support extended security likely also support NTLMv2, so use NTLMv2.
         * This is also how curl implements NTLMv2 "detection".
         * By using NTLMv2, this supports communication with servers that forbid the use of NTLMv1 (e.g. via windows policies)
         *
         * However, the target info is needed to construct the NTLMv2 response so if it can't be negotiated,
         * fall back to NTLMv1 with NTLMv2 extended security.
         */
        const pwhash = nt_password != null ? nt_password : createNTHashedPasswordV1(password);
        let clientChallenge = '';
        for (let i = 0; i < 8; i++) {
            clientChallenge += String.fromCharCode(Math.floor(Math.random() * 256));
        }
        const clientChallengeBytes = Buffer.from(clientChallenge, 'ascii');
        const challenges = msg2.targetInfo
            ? calc_ntlmv2_resp(pwhash, username, domainName, msg2.targetInfo, nonce, clientChallengeBytes)
            : ntlm2sr_calc_resp(pwhash, nonce, clientChallengeBytes);
        lmChallengeResponse = challenges.lmChallengeResponse;
        ntChallengeResponse = challenges.ntChallengeResponse;
    }

    const signature = 'NTLMSSP\0';

    let pos = 0;

    const buf = Buffer.alloc(
        BODY_LENGTH +
            domainNameBytes.length +
            usernameBytes.length +
            workstationBytes.length +
            lmChallengeResponse.length +
            ntChallengeResponse.length +
            encryptedRandomSessionKeyBytes.length
    );

    pos = buf.write(signature, pos, signature.length);
    // type 1
    pos = buf.writeUInt32LE(3, pos);

    // LmChallengeResponseLen
    pos = buf.writeUInt16LE(lmChallengeResponse.length, pos);
    // LmChallengeResponseMaxLen
    pos = buf.writeUInt16LE(lmChallengeResponse.length, pos);
    // LmChallengeResponseOffset
    pos = buf.writeUInt32LE(BODY_LENGTH + domainNameBytes.length + usernameBytes.length + workstationBytes.length, pos);

    // NtChallengeResponseLen
    pos = buf.writeUInt16LE(ntChallengeResponse.length, pos);
    // NtChallengeResponseMaxLen
    pos = buf.writeUInt16LE(ntChallengeResponse.length, pos);
    // NtChallengeResponseOffset
    pos = buf.writeUInt32LE(
        BODY_LENGTH +
            domainNameBytes.length +
            usernameBytes.length +
            workstationBytes.length +
            lmChallengeResponse.length,
        pos
    );

    // DomainNameLen
    pos = buf.writeUInt16LE(domainNameBytes.length, pos);
    // DomainNameMaxLen
    pos = buf.writeUInt16LE(domainNameBytes.length, pos);
    // DomainNameOffset
    pos = buf.writeUInt32LE(BODY_LENGTH, pos);

    // UserNameLen
    pos = buf.writeUInt16LE(usernameBytes.length, pos);
    // UserNameMaxLen
    pos = buf.writeUInt16LE(usernameBytes.length, pos);
    // UserNameOffset
    pos = buf.writeUInt32LE(BODY_LENGTH + domainNameBytes.length, pos);

    // WorkstationLen
    pos = buf.writeUInt16LE(workstationBytes.length, pos);
    // WorkstationMaxLen
    pos = buf.writeUInt16LE(workstationBytes.length, pos);
    // WorkstationOffset
    pos = buf.writeUInt32LE(BODY_LENGTH + domainNameBytes.length + usernameBytes.length, pos);

    // EncryptedRandomSessionKeyLen
    pos = buf.writeUInt16LE(encryptedRandomSessionKeyBytes.length, pos);
    // EncryptedRandomSessionKeyMaxLen
    pos = buf.writeUInt16LE(encryptedRandomSessionKeyBytes.length, pos);
    // EncryptedRandomSessionKeyOffset
    pos = buf.writeUInt32LE(
        BODY_LENGTH +
            domainNameBytes.length +
            usernameBytes.length +
            workstationBytes.length +
            lmChallengeResponse.length +
            ntChallengeResponse.length,
        pos
    );

    // NegotiateFlags =
    pos = buf.writeUInt32LE(NTLMTypeFlags.TYPE2_FLAGS, pos);

    // ProductMajorVersion
    pos = buf.writeUInt8(5, pos);
    // ProductMinorVersion
    pos = buf.writeUInt8(1, pos);
    // ProductBuild
    pos = buf.writeUInt16LE(2600, pos);
    // VersionReserved1
    pos = buf.writeUInt8(0, pos);
    // VersionReserved2
    pos = buf.writeUInt8(0, pos);
    // VersionReserved3
    pos = buf.writeUInt8(0, pos);
    // NTLMRevisionCurrent
    pos = buf.writeUInt8(15, pos);

    pos += domainNameBytes.copy(buf, pos);
    pos += usernameBytes.copy(buf, pos);
    pos += workstationBytes.copy(buf, pos);
    pos += lmChallengeResponse.copy(buf, pos);
    pos += ntChallengeResponse.copy(buf, pos);
    encryptedRandomSessionKeyBytes.copy(buf, pos);

    return `NTLM ${buf.toString('base64')}`;
}

function createDesEncrypt(key: Buffer): Des {
    return DES.create({ type: 'encrypt', key });
}

export function createLMHashedPasswordV1(password: string) {
    // fix the password length to 14 bytes
    password = password.toUpperCase();
    const passwordBytes = Buffer.from(password, 'ascii');

    const passwordBytesPadded = Buffer.alloc(14);
    passwordBytesPadded.fill('\0');
    let sourceEnd = 14;
    if (passwordBytes.length < 14) sourceEnd = passwordBytes.length;
    passwordBytes.copy(passwordBytesPadded, 0, 0, sourceEnd);

    // split into 2 parts of 7 bytes:
    const firstPart = passwordBytesPadded.slice(0, 7);
    const secondPart = passwordBytesPadded.slice(7);

    function encrypt(buf: Buffer) {
        const key = insertZerosEvery7Bits(buf);
        const des = createDesEncrypt(key);
        return Buffer.from(des.update('KGS!@#$%')); // page 57 in [MS-NLMP]);
    }

    const firstPartEncrypted = encrypt(firstPart);
    const secondPartEncrypted = encrypt(secondPart);

    return Buffer.concat([firstPartEncrypted, secondPartEncrypted]);
}

export function createNTHashedPasswordV1(password: string) {
    const buf = Buffer.from(password, 'utf16le');
    return Buffer.from(createMd4().update(buf).digest());
}

function calc_resp(password_hash: Buffer, server_challenge: Buffer): Buffer {
    // padding with zeros to make the hash 21 bytes long
    const passHashPadded = Buffer.alloc(21);
    passHashPadded.fill('\0');
    password_hash.copy(passHashPadded, 0, 0, password_hash.length);

    const resArray: Buffer[] = [];

    let des = createDesEncrypt(insertZerosEvery7Bits(passHashPadded.subarray(0, 7)));
    resArray.push(Buffer.from(des.update(server_challenge.subarray(0, 8))));

    des = createDesEncrypt(insertZerosEvery7Bits(passHashPadded.subarray(7, 14)));
    resArray.push(Buffer.from(des.update(server_challenge.subarray(0, 8))));

    des = createDesEncrypt(insertZerosEvery7Bits(passHashPadded.subarray(14, 21)));
    resArray.push(Buffer.from(des.update(server_challenge.subarray(0, 8))));

    return Buffer.concat(resArray);
}

function hmac_md5(key: Buffer, data: Buffer): Buffer {
    const hmac = createHmac('md5', key);
    hmac.update(data);
    return hmac.digest();
}

function ntlm2sr_calc_resp(responseKeyNT: Buffer, serverChallenge: Buffer, clientChallenge: Buffer) {
    // padding with zeros to make the hash 16 bytes longer
    const lmChallengeResponse = Buffer.alloc(clientChallenge.length + 16);
    lmChallengeResponse.fill('\0');
    clientChallenge.copy(lmChallengeResponse, 0, 0, clientChallenge.length);

    const buf = Buffer.concat([serverChallenge, clientChallenge]);
    const md5 = createHash('md5');
    md5.update(buf);
    const sess = md5.digest();
    const ntChallengeResponse = calc_resp(responseKeyNT, sess.subarray(0, 8));

    return {
        lmChallengeResponse: lmChallengeResponse,
        ntChallengeResponse: ntChallengeResponse,
    };
}

function calc_ntlmv2_resp(
    pwhash: Buffer,
    username: string,
    domain: string,
    targetInfo: Buffer,
    serverChallenge: Buffer,
    clientChallenge: Buffer
) {
    const responseKeyNTLM = NTOWFv2(pwhash, username, domain);

    const lmV2ChallengeResponse = Buffer.concat([
        hmac_md5(responseKeyNTLM, Buffer.concat([serverChallenge, clientChallenge])),
        clientChallenge,
    ]);

    // 11644473600000 = diff between 1970 and 1601
    const now = Date.now();
    const timestamp = (BigInt(now) + BigInt(11_644_473_600_000)) * BigInt(10_000); // we need BigInt to be able to write it to a buffer
    const timestampBuffer = Buffer.alloc(8);
    timestampBuffer.writeBigUInt64LE(timestamp);

    const zero32Bit = Buffer.alloc(4, 0);
    const temp = Buffer.concat([
        // Version
        Buffer.from([0x01, 0x01, 0x00, 0x00]),
        zero32Bit,
        timestampBuffer,
        clientChallenge,
        zero32Bit,
        targetInfo,
        zero32Bit,
    ]);
    const proofString = hmac_md5(responseKeyNTLM, Buffer.concat([serverChallenge, temp]));
    const ntV2ChallengeResponse = Buffer.concat([proofString, temp]);

    return {
        lmChallengeResponse: lmV2ChallengeResponse,
        ntChallengeResponse: ntV2ChallengeResponse,
    };
}

function NTOWFv2(pwhash: Buffer, user: string, domain: string) {
    return hmac_md5(pwhash, Buffer.from(`${user.toUpperCase()}${domain}`, 'utf16le'));
}
