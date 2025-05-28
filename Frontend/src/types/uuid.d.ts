declare module 'uuid' {
    export function v4(): string;
    export function v1(): string;
    export function v3(): string;
    export function v5(): string;
    export function parse(id: string): Buffer;
    export function stringify(buf: Buffer): string;
    export function validate(id: string): boolean;
    export function version(id: string): number;
} 