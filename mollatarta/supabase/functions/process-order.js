// This is a Supabase Edge Function to process orders
// Deploy this to your Supabase project with:
// supabase functions deploy process-order

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Create a Supabase client with the Auth context of the function
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse the request body
    const { order, user_id } = await req.json();

    // Validate request body
    if (!order || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate order total (in case frontend calculation is tampered with)
    let totalPrice = 0;
    
    // Get product price from database
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('price, available')
      .eq('id', order.product_id)
      .single();
      
    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if product is available
    if (!product.available) {
      return new Response(
        JSON.stringify({ error: 'Product is not available for order' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Calculate total price
    totalPrice = product.price * order.quantity;
    
    // Create the order in the database
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        user_id: user_id,
        product_id: order.product_id,
        quantity: order.quantity,
        total_price: totalPrice,
        status: 'pending'
      }])
      .select();
      
    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Order created successfully',
        order: data[0]
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
}); 