declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
}

declare module "http/server.ts" {
  export interface Request extends globalThis.Request {
    json(): Promise<any>;
  }
  
  export interface ResponseInit extends globalThis.ResponseInit {
    headers?: Record<string, string>;
  }
  
  export class Response extends globalThis.Response {
    constructor(body?: BodyInit | null, init?: ResponseInit);
  }

  export function serve(handler: (req: Request) => Promise<Response>): void;
}