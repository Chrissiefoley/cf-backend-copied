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
        .from("books")
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

    // Handle POST request - add book
    //set up book 1 fake object
    //create mock for database and do a request, then return book1
    //do get mock call, assert book 1 = specific data
    // do this for all requests
    

  if (req.method === "POST") {
      try {
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
    } catch (error) {
      return new Response(
        JSON.Stringify({
          message: 'Error posting books to library',
          error: error.message,
        }),
        { headers }
      );
    }
  }

    // Handle PUT(UPDATE) request - update whole book
  if (req.method === "PUT") {
      try {
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
      } catch (error) {
      return new Response(
        JSON.Stringify({
          message: 'Error updating book in library',
          error: error.message,
        }),
        { headers }
      );
    }
  }

    // Handle DELETE request - delete book
  if (req.method === "DELETE") {
      try {
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

      const { error: deleteError } = await supabase
        .from("books")
        .delete()
        .eq("book_id", book_id);
      
      if (deleteError) throw deleteError;
  
      return new Response(
        JSON.stringify({
          message: "Success - Book deleted from library!",
        }),
        { headers }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          message: 'Error deleting book from library',
          error: error.message,
        }),
        { headers }
      );
    };
    // if (req.method === "DELETE") {
    //   const { book_id } = await req.json();
    //   const { data: existingBooks, error: getError } = await supabase
    //     .from("books")
    //     .select("*")
    //     .eq("book_id", book_id);
    //   if (getError) throw getError;
    //   if (existingBooks.length === 0) {
    //     return new Response(
    //       JSON.stringify({
    //         message: "This book cannot be deleted as it does not exist",
    //       }),
    //       { headers }
    //     );
    //   }

    //   const { data, error } = await supabase
    //     .from("books")
    //     .delete()
    //     .eq("book_id", book_id);
    //   if (error) throw error;
    //   return new Response(JSON.stringify(data), { headers });
    // }
  
    // Handle unsupported methods
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
  } 
});

