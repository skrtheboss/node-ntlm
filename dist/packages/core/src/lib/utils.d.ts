/// <reference types="node" />
export declare function binaryArray2bytes(array: ReadonlyArray<0 | 1>): Buffer;
export declare function bytes2binaryArray(buf: Buffer): Array<0 | 1>;
export declare function insertZerosEvery7Bits(buf: Buffer): Buffer;
