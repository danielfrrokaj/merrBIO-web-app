import { supabase } from '../supabaseClient';

// Function to check if all required tables and functions are properly set up
export async function checkDatabaseSetup() {
  const results = {
    success: true,
    messages: [],
    setup: {
      profilesTable: false,
      farmsTable: false,
      productsTable: false,
      ordersTable: false,
      rpcFunction: false
    }
  };

  try {
    // Check if profiles table exists and can be accessed
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    results.setup.profilesTable = !profilesError;
    if (profilesError) {
      results.success = false;
      results.messages.push(`Profiles table issue: ${profilesError.message}`);
    }
    
    // Check farms table
    const { data: farms, error: farmsError } = await supabase
      .from('farms')
      .select('id')
      .limit(1);
    
    results.setup.farmsTable = !farmsError;
    if (farmsError) {
      results.success = false;
      results.messages.push(`Farms table issue: ${farmsError.message}`);
    }
    
    // Check products table
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    results.setup.productsTable = !productsError;
    if (productsError) {
      results.success = false;
      results.messages.push(`Products table issue: ${productsError.message}`);
    }
    
    // Check orders table
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);
    
    results.setup.ordersTable = !ordersError;
    if (ordersError) {
      results.success = false;
      results.messages.push(`Orders table issue: ${ordersError.message}`);
    }
    
    // Check if create_profile RPC function exists
    try {
      // We don't want to actually create a profile, just check if the function exists
      // This will fail if function doesn't exist, but with a specific error
      await supabase.rpc('create_profile', { 
        user_id: '00000000-0000-0000-0000-000000000000',
        user_name: 'Test User'
      });
      results.setup.rpcFunction = true;
    } catch (rpcError) {
      // If the error includes 'function' and 'does not exist', it means the function doesn't exist
      // Other errors might indicate the function exists but failed for other reasons
      if (rpcError.message && rpcError.message.includes('does not exist')) {
        results.setup.rpcFunction = false;
        results.success = false;
        results.messages.push(`RPC function issue: create_profile function does not exist`);
      } else {
        // Function exists but failed for other reasons (expected in this test)
        results.setup.rpcFunction = true;
      }
    }
    
    return results;
  } catch (error) {
    results.success = false;
    results.messages.push(`General database check error: ${error.message}`);
    return results;
  }
} 