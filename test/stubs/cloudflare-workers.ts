// Test stand-in for the `cloudflare:workers` runtime module, which only exists
// inside workerd. The OAuth provider imports WorkerEntrypoint from it to
// recognise class-based handlers; ours are plain objects.
export class WorkerEntrypoint {}
