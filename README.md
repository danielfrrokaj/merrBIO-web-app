# MerrBIO Farm Management System

## Technical Architecture

MerrBIO is a web-based farm management platform built on a modern React and Supabase architecture. The system enables farmers to manage their agricultural operations, products, and orders through a streamlined interface.

### Core Architecture Components

- **Frontend**: Single-page application built with React.js
- **Backend/Database**: Supabase (PostgreSQL) with real-time capabilities
- **Authentication**: JWT-based auth system powered by Supabase Auth
- **State Management**: React Context API for global state (Auth, UI preferences)
- **Routing**: React Router for client-side navigation

## Database Schema

The system utilizes a relational database model with the following core entities:

- **Profiles**: Extended user information, linked to Supabase auth
- **Farms**: Agricultural entities owned by users
- **Products**: Items produced by farms and available for purchase
- **Orders**: Transactions between consumers and farm products

The Row-Level Security (RLS) policies ensure data access is strictly controlled:
- Farm owners can only manage their own farms
- Product management is restricted to respective farm owners
- Orders are viewable by both the consumer who placed the order and the farm owner supplying the product

## Technical Implementation Details

### Role-Based Access Control

The system implements a role-based permission system with three primary roles:
- **Farmers**: Can create farms, manage products, and process orders
- **Consumers**: Can browse products and place orders
- **Administrators**: Have system-wide access to manage users, farms, and products

### Real-Time Data Synchronization

Leveraging Supabase's real-time capabilities, the application maintains synchronized states across clients:
- Order status updates are reflected immediately
- Product inventory changes propagate in real-time
- Farm profile modifications appear instantly across sessions

### Component Architecture

The UI is built with a component-based architecture:
- **Page Components**: Top-level containers for major routes
- **Functional Components**: Reusable UI elements (cards, forms, navigation)
- **Context Providers**: Global state management wrappers

## Security Considerations

- PostgreSQL Row-Level Security for fine-grained data access control
- JWT authentication with secure token handling
- Server-side validation complementing client-side validation
- Protected routes with authenticated access requirements

## Scalability Design

The architecture supports horizontal scaling through:
- Stateless frontend that can be deployed across multiple instances
- Database design optimized for read-heavy operations
- Efficient caching strategies for frequently accessed data
- Pagination implementation for large dataset handling

## Frontend Strategy

- Responsive design supporting mobile and desktop interfaces
- Tab-based navigation for intuitive category access
- Optimistic UI updates for perceived performance improvements
- Conditional rendering based on user roles and permissions

## Credits

In this project have participated and put their hard work the amazing people below

- Antigona Llozhi
- Danjel Frrokaj
- Glears Canaj
- Ensild Hallanjaku

## License

This project is licensed under the MIT License. 
