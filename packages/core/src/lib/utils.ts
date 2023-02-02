
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
} as const;

export function binaryArray2bytes(array: ReadonlyArray<0 | 1>): Buffer {
    const bufArray: Buffer[] = [];

    for (let i = 0; i < array.length; i += 8) {
        if (i + 7 > array.length) break;

        const binString1 = `${array[i]}${array[i + 1]}${array[i + 2]}${
            array[i + 3]
        }` as const;
        const binString2 = `${array[i + 4]}${array[i + 5]}${array[i + 6]}${
            array[i + 7]
        }` as const;

        const hexchar1 = binary2hex[binString1];
        const hexchar2 = binary2hex[binString2];

        const buf = Buffer.from(`${hexchar1}${hexchar2}`, "hex");
        bufArray.push(buf);
    }

    return Buffer.concat(bufArray);
}


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
} as const;

export function bytes2binaryArray(buf: Buffer): Array<0 | 1> {
    const hexString = buf.toString("hex").toUpperCase();
    const array: Array<0 | 1> = [];
    for (let i = 0; i < hexString.length; i++) {
        const hexchar = hexString.charAt(i) as keyof typeof hex2binary;
        array.push(...hex2binary[hexchar]);
    }
    return array;
}



export function insertZerosEvery7Bits(buf: Buffer): Buffer {
    const binaryArray = bytes2binaryArray(buf);
    const newBinaryArray: Array<0 | 1> = [];
    for (let i = 0; i < binaryArray.length; i++) {
        newBinaryArray.push(binaryArray[i]);

        if ((i + 1) % 7 === 0) {
            newBinaryArray.push(0);
        }
    }
    return binaryArray2bytes(newBinaryArray);
}
