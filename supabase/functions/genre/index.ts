import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req: Request) => {
  const headers = { "Content-Type": "application/json" };

    // Handle GET request - fetch books
  if (req.method === "GET") {
      try{
      const { data, error } = await supabase
        .from("genres")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify(data), { headers });
    } catch (error) {
      return new Response(
        JSON.Stringify({
          message: 'Error fetching books from library',
          error: error.message,
        }),
        { headers }
      );
    }
  }


  if (req.method === "POST") {
      try {
      const {
        book_genre,
      } = await req.json();

      // Checks for genre already existing in the library
      const { data: existingBooks, error: getError } = await supabase
        .from("genres")
        .select("*")
        .eq("book_genre", book_genre)

      if (getError) throw getError;
      if (existingBooks.length > 0) {
        return new Response(
          JSON.stringify({
            message: "This genre already exists",
          }),
          { headers }
        );
      }
      const { data, uploadError } = await supabase.from("genres").insert([
        {
          book_genre
        },
      ]);
      if (uploadError) throw uploadError;
      return new Response(
        JSON.stringify({ success: true, message: "Genre added!" }),
        { headers }
      );
    } catch (error) {
      return new Response(
        JSON.Stringify({
          message: 'Error posting genre',
          error: error.message,
        }),
        { headers }
      );
    }
  }

    // Handle unsupported methods
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
});

