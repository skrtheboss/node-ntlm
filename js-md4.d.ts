declare module 'js-md4' {

    declare class MD4 {
        update(message: Buffer): this;
        digest(): number[];
    }

    export function create(): MD4;
}