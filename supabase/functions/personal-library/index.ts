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
    // Handle GET request - fetch books
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify(data), { headers });
    }

    // Handle POST request - add book
    if (req.method === "POST") {
      const {
        book_title,
        book_author,
        book_publishedDate,
        book_genre,
        book_description,
      } = await req.json();

      // Checks for book already existing in the library
      const { data: existingBooks, error: getError } = await supabase
        .from("books")
        .select("*")
        .eq("book_title", book_title)
        .eq("book_author", book_author);

      if (getError) throw getError;
      if (existingBooks.length > 0) {
        return new Response(
          JSON.stringify({
            message: "This book already exists in the library",
          }),
          { headers }
        );
      }
      const { data, uploadError } = await supabase.from("books").insert([
        {
          book_title,
          book_author,
          book_publishedDate,
          book_genre,
          book_description,
        },
      ]);
      if (uploadError) throw uploadError;
      return new Response(
        JSON.stringify({ success: true, message: "Book added!" }),
        { headers }
      );
    }

    // Handle PUT(UPDATE) request - update whole book
    if (req.method === "PUT") {
      const { updateData, book_id } = await req.json();
      const { data, error } = await supabase
        .from("books")
        .update(updateData)
        .eq("book_id", book_id)
        .select();
      if (error) throw error;
      if (data.length === 0) {
        return new Response(
          JSON.stringify({
            message: "This book cannot be updated as it does not exist",
          }),
          { headers }
        );
      }
      return new Response(JSON.stringify(data), { headers });
    }

    // Handle DELETE request - delete book
    if (req.method === "DELETE") {
      const { book_id } = await req.json();
      const { data: existingBooks, error: getError } = await supabase
        .from("books")
        .select("*")
        .eq("book_id", book_id);
      if (getError) throw getError;
      if (existingBooks.length === 0) {
        return new Response(
          JSON.stringify({
            message: "This book cannot be deleted as it does not exist",
          }),
          { headers }
        );
      }

      const { data, error } = await supabase
        .from("books")
        .delete()
        .eq("book_id", book_id);
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
