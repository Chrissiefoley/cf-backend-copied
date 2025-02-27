import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req: Request) => {
  // Simple content-type header is all we need
  const headers = { "Content-Type": "application/json" };

  try {
    // Handle GET request - fetch favourites
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("favourite_books")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify(data), { headers });
    }

    // Handle POST request - add book
    if (req.method === "POST") {
      const {
        top_1,
        top_2,
        top_3,
        top_4,
        top_5,
      } = await req.json();

      const { data, uploadError } = await supabase.from("favourite_books").insert([
        {
          top_1,
          top_2,
          top_3,
          top_4,
          top_5,
        },
      ]);
      if (uploadError) throw uploadError;
      return new Response(
        JSON.stringify({ success: true, message: "Favourites updated!" }),
        { headers }
      );
    }

    // Handle PUT(UPDATE) request - update whole book
    if (req.method === "PUT") {
      const { updateData, book_id } = await req.json();
      const { data, error } = await supabase
        .from("favourite_books")
        .update(updateData)
        .eq("favourites_id", favourites_id)
        .select();
      if (error) throw error;
      if (data.length === 0) {
        return new Response(
          JSON.stringify({
            message: "Your favourites cannot be updated",
          }),
          { headers }
        );
      }
      return new Response(JSON.stringify(data), { headers });
    }

    // Handle DELETE request - delete book
    if (req.method === "DELETE") {
      const { book_id } = await req.json();
      const { data, error } = await supabase
        .from("favourite_books")
        .delete()
        .eq("favourites_id", favourites_id);
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers });
    }

    // Handle unsupported methods
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers,
    });
  }
});
