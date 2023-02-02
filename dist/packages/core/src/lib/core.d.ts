/// <reference types="node" />
export declare function createType1Message(options: Type1MessageOptions): string;
interface Type1MessageOptions {
    readonly domain: string;
    readonly workstation: string;
}
interface Type3MessageOptions {
    readonly domain: string;
    readonly workstation: string;
    readonly username: string;
    readonly password: string;
    readonly lm_password?: Buffer;
    readonly nt_password?: Buffer;
}
interface Type2Message {
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
export declare function parseType2Message(rawmsg: string): Type2Message;
export declare function createType3Message(msg2: Type2Message, options: Type3MessageOptions): string;
export declare function createLMHashedPasswordV1(password: string): Buffer;
export declare function createNTHashedPasswordV1(password: string): Buffer;
export {};
