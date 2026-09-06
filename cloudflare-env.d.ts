/* Minimal runtime declarations used by the Vinext worker build. */
declare interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

// The concrete binding is supplied by the hosted Cloudflare runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare type D1Database = any;

declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
  };
}
