import { createRetentionHandler } from '../_shared/retention.mjs';

Deno.serve(createRetentionHandler(Deno.env.toObject()));
