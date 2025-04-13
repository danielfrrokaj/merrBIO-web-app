# React + Supabase Application

This is a modern React application with Supabase integration, built with Vite and TypeScript.

## Features

- React with TypeScript
- Supabase Authentication
- ChakraUI for styling
- React Router for navigation
- Google OAuth support

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase project (create one at [supabase.com](https://supabase.com))

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `src/lib/supabase.ts` - Supabase client configuration
- `src/App.tsx` - Main application component with routing
- `src/main.tsx` - Application entry point

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
