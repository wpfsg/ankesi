/** Whether Supabase credentials exist, without importing the client. Content
 *  pages check this and load `./db` on demand so supabase-js stays out of
 *  their bundle. */
export const hasBackend = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
