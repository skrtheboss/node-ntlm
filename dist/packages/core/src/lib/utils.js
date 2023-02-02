"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertZerosEvery7Bits = exports.bytes2binaryArray = exports.binaryArray2bytes = void 0;
const binary2hex = {
    "0000": 0,
    "0001": 1,
    "0010": 2,
    "0011": 3,
    "0100": 4,
    "0101": 5,
    "0110": 6,
    "0111": 7,
    "1000": 8,
    "1001": 9,
    "1010": "A",
    "1011": "B",
    "1100": "C",
    "1101": "D",
    "1110": "E",
    "1111": "F",
};
function binaryArray2bytes(array) {
    const bufArray = [];
    for (let i = 0; i < array.length; i += 8) {
        if (i + 7 > array.length)
            break;
        const binString1 = `${array[i]}${array[i + 1]}${array[i + 2]}${array[i + 3]}`;
        const binString2 = `${array[i + 4]}${array[i + 5]}${array[i + 6]}${array[i + 7]}`;
        const hexchar1 = binary2hex[binString1];
        const hexchar2 = binary2hex[binString2];
        const buf = Buffer.from(`${hexchar1}${hexchar2}`, "hex");
        bufArray.push(buf);
    }
    return Buffer.concat(bufArray);
}
exports.binaryArray2bytes = binaryArray2bytes;
const hex2binary = {
    0: [0, 0, 0, 0],
    1: [0, 0, 0, 1],
    2: [0, 0, 1, 0],
    3: [0, 0, 1, 1],
    4: [0, 1, 0, 0],
    5: [0, 1, 0, 1],
    6: [0, 1, 1, 0],
    7: [0, 1, 1, 1],
    8: [1, 0, 0, 0],
    9: [1, 0, 0, 1],
    A: [1, 0, 1, 0],
    B: [1, 0, 1, 1],
    C: [1, 1, 0, 0],
    D: [1, 1, 0, 1],
    E: [1, 1, 1, 0],
    F: [1, 1, 1, 1],
};
function bytes2binaryArray(buf) {
    const hexString = buf.toString("hex").toUpperCase();
    const array = [];
    for (let i = 0; i < hexString.length; i++) {
        const hexchar = hexString.charAt(i);
        array.push(...hex2binary[hexchar]);
    }
    return array;
}
exports.bytes2binaryArray = bytes2binaryArray;
function insertZerosEvery7Bits(buf) {
    const binaryArray = bytes2binaryArray(buf);
    const newBinaryArray = [];
    for (let i = 0; i < binaryArray.length; i++) {
        newBinaryArray.push(binaryArray[i]);
        if ((i + 1) % 7 === 0) {
            newBinaryArray.push(0);
        }
    }
    return binaryArray2bytes(newBinaryArray);
}
exports.insertZerosEvery7Bits = insertZerosEvery7Bits;
//# sourceMappingURL=utils.js.map