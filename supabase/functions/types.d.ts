declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(url: string, key: string): SupabaseClient;

  interface SupabaseClient {
    from(table: string): QueryBuilder;
    storage: {
      from(bucket: string): {
        remove(paths: string[]): Promise<{ error: Error | null }>;
      };
    };
    auth: {
      getSession(): Promise<unknown>;
    };
  }

  interface QueryBuilder {
    data: Array<{ storage_path: string }> | null;
    select(columns: string): QueryBuilder;
    eq(column: string, value: string): QueryBuilder;
    lte(column: string, value: string): QueryBuilder;
    limit(count: number): Promise<{ data: Array<{ id: string }> | null; error: Error | null }>;
    delete(): QueryBuilder;
    in(column: string, values: string[]): Promise<{ error: Error | null }>;
  }
}

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};