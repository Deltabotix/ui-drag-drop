declare module 'intel-hex' {
  export function parse(data: string, bufferSize?: number, addressOffset?: number): { data: Buffer }
}
