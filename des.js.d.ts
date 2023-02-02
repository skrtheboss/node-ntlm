declare module 'des.js' {

    interface Des {
        update(message: string | Buffer): number[];
    }

    export declare const DES: {
        readonly create(options: { type: 'encrypt', key: Buffer }): Des;
    }
}