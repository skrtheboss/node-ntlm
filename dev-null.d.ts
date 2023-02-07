declare module 'dev-null' {
    import { Writable } from 'node:stream';
    export default function (): Writable;
}
