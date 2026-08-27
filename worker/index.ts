export default {
  async fetch(request: Request, env: Env) {
    console.info("FETCH", request);
    return new Response(JSON.stringify({ msg: "OK" }), { status: 200 });
  },
} satisfies ExportedHandler<Env>;
