# FarmConnect - Farm to Table Marketplace

A modern web application that connects users with local farms to purchase fresh products directly from farmers. Built for the Sfida Hackathon.

## Features

- **Authentication System**: Sign up, login, and profile management
- **Farm Management**: Create and manage your farms
- **Product Management**: Add products to your farms with pricing and availability
- **Order System**: Place orders for products from farms
- **Public Interface**: Browse farms and products without login

## Tech Stack

- **Frontend**: React with React Router DOM for navigation
- **Backend/Database**: Supabase for authentication, database and serverless functions
- **Styling**: Pure CSS (no external frameworks)

## Getting Started

### Prerequisites

- Node.js and npm installed
- A Supabase account and project

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/farm-connect.git
   cd farm-connect
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the SQL scripts in the Supabase SQL editor to set up the database schema

5. Deploy Supabase Edge Functions
   ```
   supabase functions deploy process-order
   ```

6. Start the development server
   ```
   npm start
   ```

## Project Structure

- `/src` - React application source code
  - `/components` - Reusable UI components
  - `/context` - React context providers
  - `/pages` - Application pages
  - `/styles` - CSS stylesheets
- `/supabase` - Supabase configuration and edge functions
  - `/functions` - Serverless edge functions

## Database Schema

- **profiles** - User profiles (extends Supabase auth)
- **farms** - Farm information
- **products** - Products offered by farms
- **orders** - Customer orders

## Troubleshooting

### "Database error saving new user" Issue

If you see this specific error when signing up:

1. First, run the `supabase/rpc_functions.sql` script in your Supabase SQL editor to create the helper RPC function
2. Ensure you've run the `supabase/schema-fix.sql` script if you're still encountering issues
3. Check the browser console for detailed error messages
4. Temporarily disable Row Level Security (RLS) on the profiles table for testing:
   ```sql
   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
   ```
5. Add a service role key to your app for admin access (for development only):
   ```js
   // In .env file
   REACT_APP_SUPABASE_SERVICE_KEY=your_service_role_key
   ```

### Database Issues

If you encounter database errors during user signup:

1. Use the `supabase/schema-fix.sql` file to reset and recreate the tables
2. Make sure you have properly configured Supabase authentication
3. Check that the `handle_new_user()` trigger is working correctly

### Environment Variables

Make sure `.env` contains the correct URLs and keys:

```
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### Authentication Flow

For local development, you may need to:

1. Enable email confirmations in Supabase dashboard
2. Set up a custom SMTP server or use Supabase's development email service
3. Configure redirect URLs properly

## License

This project is licensed under the MIT License. 