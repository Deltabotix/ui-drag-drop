declare module 'stk500' {
  interface Stk500Instance {
    bootload(
      stream: unknown,
      hex: Buffer,
      opt: { signature: Buffer; pageSize: number; timeout: number; pagesizehigh?: number; pagesizelow?: number },
      use8bit: boolean,
      done: (err?: Error | null) => void
    ): void
  }
  function Stk500(opts?: { quiet?: boolean }): Stk500Instance
  export = Stk500
}
