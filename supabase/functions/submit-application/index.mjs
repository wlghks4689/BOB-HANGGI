import { createIntakeHandler } from "../_shared/intake.mjs";

const handle = createIntakeHandler(Deno.env.toObject());
Deno.serve((request) => {
  // Only gateway-provided client identity is used; never accept a form field as an IP.
  const address = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
  return handle(request, address);
});
