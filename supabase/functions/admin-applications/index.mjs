import { createAdminHandler } from "../_shared/admin.mjs";
// verify_jwt=false allows login; every other action verifies the access token
// with Supabase Auth and checks daese_admins on the server.
Deno.serve(createAdminHandler(Deno.env.toObject()));
