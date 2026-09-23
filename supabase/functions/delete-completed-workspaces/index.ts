import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteExpiredWorkspaces() {
  try {
    console.log("Starting workspace deletion check...");

    // Find workspaces ready for deletion
    const { data: workspacesToDelete, error: fetchError } = await supabase
      .from("project_workspaces")
      .select("id")
      .eq("status", "completed")
      .lte("scheduled_deletion_at", new Date().toISOString())
      .limit(100);

    if (fetchError) {
      console.error("Error fetching workspaces:", fetchError);
      return {
        status: 500,
        body: JSON.stringify({ error: fetchError.message }),
      };
    }

    if (!workspacesToDelete || workspacesToDelete.length === 0) {
      console.log("No workspaces ready for deletion");
      return {
        status: 200,
        body: JSON.stringify({
          deleted: 0,
          message: "No workspaces to delete",
        }),
      };
    }

    console.log(`Found ${workspacesToDelete.length} workspaces to delete`);

    // Delete storage files for each workspace
    for (const workspace of workspacesToDelete) {
      try {
        // Get all files for this workspace
        const { data: files } = await supabase
          .from("project_files")
          .select("storage_path")
          .eq("project_id", workspace.id);

        if (files && files.length > 0) {
          const paths = files.map((f) => f.storage_path);
          console.log(
            `Deleting ${paths.length} files for workspace ${workspace.id}`,
          );

          const { error: storageError } = await supabase.storage
            .from("project-files")
            .remove(paths);

          if (storageError) {
            console.error(
              `Warning: Failed to delete storage files for ${workspace.id}:`,
              storageError,
            );
            // Continue anyway, we'll delete the DB records
          }
        }
      } catch (err) {
        console.error(
          `Error deleting storage for workspace ${workspace.id}:`,
          err,
        );
      }
    }

    // Delete workspace records (cascades delete related records)
    const workspaceIds = workspacesToDelete.map((w) => w.id);
    const { error: deleteError } = await supabase
      .from("project_workspaces")
      .delete()
      .in("id", workspaceIds);

    if (deleteError) {
      console.error("Error deleting workspaces:", deleteError);
      return {
        status: 500,
        body: JSON.stringify({ error: deleteError.message }),
      };
    }

    console.log(`Successfully deleted ${workspacesToDelete.length} workspaces`);
    return {
      status: 200,
      body: JSON.stringify({
        deleted: workspacesToDelete.length,
        message: `Deleted ${workspacesToDelete.length} completed workspaces`,
      }),
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      status: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
}

// Main function handler
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const result = await deleteExpiredWorkspaces();
  return new Response(result.body, { status: result.status });
});
