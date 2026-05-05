# Hunger Food

A full-stack food ordering and delivery platform built with React, Express, MongoDB, Socket.IO, and Cloudinary. Hunger Food supports three real user flows: customers browse shops and place orders, shop owners manage menus and order status, and delivery riders accept deliveries with live GPS tracking and OTP-based delivery confirmation.

This project is designed as a practical MERN application rather than a static demo. It includes role-based dashboards, protected APIs, image uploads, cart and checkout flows, real-time delivery events, email OTP workflows, and Playwright-powered bulk data creation for realistic testing.

## Why This Project Stands Out

- **End-to-end marketplace workflow:** customer, restaurant owner, and delivery rider experiences are all implemented.
- **Real-time delivery experience:** Socket.IO powers order-room updates and live rider location sharing.
- **Production-style backend structure:** controllers, routes, models, middleware, validators, utilities, and socket handlers are separated cleanly.
- **Secure auth patterns:** JWT cookie authentication, password hashing, protected routes, input validation, Google auth support, and reset-password OTP.
- **Media management:** shop and item images are uploaded through Multer and stored with Cloudinary public IDs for later cleanup/update flows.
- **Operational tooling:** Playwright scripts can seed many shops and items through the real API using real image assets.

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Redux Toolkit
- Tailwind CSS
- Axios
- Socket.IO Client
- Firebase Auth for Google sign-in
- Framer Motion
- Recharts
- React Hot Toast
- Google Maps / OpenStreetMap-based delivery views

### Backend

- Node.js
- Express 5
- MongoDB with Mongoose
- Socket.IO
- JWT authentication
- Bcrypt password hashing
- Joi request validation
- Multer file uploads
- Cloudinary image hosting
- Nodemailer SMTP email
- Playwright for API-driven bulk data setup

## Core Features

### Customer

- Sign up, sign in, Google auth, logout, and password reset by email OTP.
- Browse shops and menu items.
- Add food items to cart and checkout.
- Place cash-on-delivery or online-style orders.
- Track delivery progress in real time once a rider is assigned.
- Verify delivery completion with OTP.

### Shop Owner

- Create, update, and delete shops.
- Upload and update shop images.
- Create, update, delete, and toggle availability for menu items.
- View shop-specific orders.
- Move orders through statuses such as pending, confirmed, preparing, out for delivery, delivered, and cancelled.
- Review dashboard-style overview data.

### Delivery Rider

- View available confirmed orders.
- Accept one active delivery at a time.
- Share GPS location through Socket.IO during active delivery.
- View customer destination on a map.
- Send arrival OTP to the customer.
- Complete delivery only after OTP verification.
- Track delivered orders and daily order value.

## Project Structure

```text
hunger-food/
|-- client/
|   |-- src/
|   |   |-- components/        # Dashboards, shared UI, owner and user flows
|   |   |-- hooks/             # Current user, socket, city, and live tracking hooks
|   |   |-- lib/               # Socket client setup
|   |   |-- pages/             # Auth, home, cart, and checkout pages
|   |   |-- theme/             # Design tokens
|   |   `-- utils/             # Firebase, formatters, helpers
|   |-- redux/                 # User and cart state
|   `-- public/                # Icons and favicon
|
|-- server/
|   |-- config/                # MongoDB and Cloudinary config
|   |-- controller/            # Auth, shop, item, order controllers
|   |-- middleware/            # Auth, validation, multer upload middleware
|   |-- models/                # User, shop, item, order schemas
|   |-- routes/                # Express route modules
|   |-- sockets/               # Socket.IO event handling
|   |-- tests/                 # Playwright tests and bulk seed scripts
|   |-- utils/                 # Email and Cloudinary services
|   |-- items-images/          # Local item images for bulk creation
|   `-- shop-images/           # Local shop images for bulk creation
`-- README.md
```

## Getting Started

### Prerequisites

- Node.js 20 or newer recommended
- npm
- MongoDB database
- Cloudinary account
- Gmail SMTP app password or another SMTP-compatible credential
- Firebase project for Google authentication

### 1. Clone and Install

```bash
git clone https://github.com/wahid3150/hunger-food.git
cd hunger-food

cd server
npm install

cd ../client
npm install
```

### 2. Configure Environment Variables

Create `server/.env`:

```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
```

Create `client/.env`:

```env
VITE_SERVER_URL=http://localhost:8000
VITE_FIREBASE_APIKEY=your_firebase_api_key
```

> Note: the client currently uses `http://localhost:8000` as the API default, so setting `PORT=8000` in the server keeps local development aligned.

### 3. Run the App

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

Open the Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

## Available Scripts

### Client

```bash
npm run dev      # Start Vite development server
npm run build    # Create production build
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```

### Server

```bash
npm run dev                # Start Express with nodemon
npm start                  # Start Express with node
npm run test:e2e           # Run Playwright tests
npm run bulk:create-shops  # Create shops through the real API
npm run bulk:create-items  # Create menu items through the real API
```

## API Overview

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `POST /api/auth/logout`
- `POST /api/auth/google-auth`
- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/reset-password`
- `GET /api/auth/current`

### Shops

- `POST /api/shop/create-shop`
- `PUT /api/shop/update-shop/:shopId`
- `GET /api/shop/my-shops`
- `DELETE /api/shop/delete-shop/:shopId`
- `GET /api/shop/shops`
- `GET /api/shop/shops/:shopId`

### Items

- `POST /api/item/shops/:shopId/items`
- `PUT /api/item/items/:itemId`
- `DELETE /api/item/items/:itemId`
- `PATCH /api/item/items/:itemId/toggle-availability`
- `GET /api/item/my-items`
- `GET /api/item/shops/:shopId/items`
- `GET /api/item/items/:itemId`
- `GET /api/item/items`

### Orders

- `POST /api/orders`
- `GET /api/orders/my-orders`
- `GET /api/orders/shop/:shopId`
- `PATCH /api/orders/:orderId/status`
- `GET /api/orders/delivery/available-orders`
- `PATCH /api/orders/:orderId/accept`
- `GET /api/orders/delivery/my-orders`
- `POST /api/orders/:orderId/send-otp`
- `POST /api/orders/:orderId/resend-otp`
- `PATCH /api/orders/:orderId/verify-otp`

## Real-Time Events

The server initializes Socket.IO alongside Express and uses order-specific rooms for delivery updates. The client connects after authentication and uses the shared socket instance in `client/src/lib/socket.js`.

Important real-time behaviors include:

- joining and leaving order rooms
- order status updates
- delivery completion updates
- rider location emission during active delivery
- customer-side live tracking updates

## Bulk Demo Data

The server includes Playwright scripts that create realistic shop and item data through the backend API.

From `server`, configure an owner account:

```powershell
$env:BULK_OWNER_EMAIL="owner@example.com"
$env:BULK_OWNER_PASSWORD="your-password"
$env:BULK_SERVER_URL="http://localhost:8000"
```

Then run:

```powershell
npm run bulk:create-shops
npm run bulk:create-items
```

More options are documented in:

- `server/tests/BULK_SHOPS.md`
- `server/tests/BULK_ITEMS.md`

## Engineering Notes

- Auth state is loaded on app startup through a current-user hook and stored in Redux.
- Dashboard rendering is role-based: `user`, `owner`, and `deliveryBoy` receive different home experiences.
- Backend validation is centralized with Joi schemas and a reusable validation middleware.
- Image upload flows preserve Cloudinary `public_id` values so updates and deletes can manage remote assets.
- MongoDB indexes support common lookup patterns for users, shops, items, orders, and delivery assignments.
- Delivery completion uses an OTP workflow to reduce false delivery confirmations.

## Recruiter Snapshot

Hunger Food demonstrates the ability to build a complete product workflow across frontend, backend, database, real-time communication, authentication, and operational tooling. It shows comfort with full-stack architecture, role-based UX, secure API design, file upload pipelines, map/location features, and practical developer experience details such as seed scripts and modular code organization.

For a portfolio review, the strongest areas to inspect are:

- `client/src/components/OwnerDashboard.jsx`
- `client/src/components/UserDashboard.jsx`
- `client/src/components/DeliveryBoy.jsx`
- `client/src/hooks/useLiveTracking.jsx`
- `server/controller/orderController.js`
- `server/sockets/socketHandler.js`
- `server/models/orderModel.js`

## Future Improvements

- Add automated unit/integration tests for core controllers.
- Move hardcoded local URLs into environment variables everywhere.
- Add payment gateway integration for real online payments.
- Add admin moderation for shops, menu items, and users.
- Add deployment documentation for frontend, backend, database, and media services.
