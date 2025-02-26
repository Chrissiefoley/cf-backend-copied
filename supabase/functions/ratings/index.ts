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
    // Handle GET request - fetch ratings
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify(data), { headers });
    }

    // Handle POST request - add rating
    if (req.method === "POST") {
      const { user_id, book_id, book_rating, book_review } = await req.json();

      // Checks for review on book already existing in the library
      const { data: existingReviews, error: getError } = await supabase
        .from("ratings")
        .select("*")
        .eq("book_id", book_id)
        .eq("user_id", user_id);

      if (getError) throw getError;
      if (existingReviews.length > 0) {
        return new Response(
          JSON.stringify({
            message: "A review for this book already exists for this user",
          }),
          { headers }
        );
      }
      const { data, uploadError } = await supabase.from("ratings").insert([
        {
          user_id,
          book_id,
          book_rating,
          book_review,
        },
      ]);
      if (uploadError) throw uploadError;
      return new Response(
        JSON.stringify({ success: true, message: "Review uploaded!" }),
        { headers }
      );
    }

    // Handle PUT(UPDATE) request - update review - UPDATE!!!!!!
    if (req.method === "PUT") {
      const { updateData, rating_id } = await req.json();
      const { data, error } = await supabase
        .from("ratings")
        .update(updateData)
        .eq("rating_id", rating_id)
        .select();
      if (error) throw error;
      if (data.length === 0) {
        return new Response(
          JSON.stringify({
            message:
              "A review cannot be added for this book as it does not exist",
          }),
          { headers }
        );
      }
      return new Response(JSON.stringify(data), { headers });
    }

    // Handle DELETE request - delete book
    if (req.method === "DELETE") {
      const { rating_id } = await req.json();
      const { data: existingRatings, error: getError } = await supabase
        .from("ratings")
        .select("*")
        .eq("rating_id", rating_id);
      if (getError) throw getError;
      if (existingRatings.length === 0) {
        return new Response(
          JSON.stringify({
            message: "This review cannot be deleted as it does not exist",
          }),
          { headers }
        );
      }

      const { data, error } = await supabase
        .from("ratings")
        .delete()
        .eq("rating_id", rating_id);
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
