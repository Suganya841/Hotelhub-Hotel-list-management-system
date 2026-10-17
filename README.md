# HotelHub - Hotel List & Management Web Application

A full-stack, responsive Single Page Application (SPA) for discovering, booking, and managing luxury hotels and resorts with live geolocation mapping, search/price filtering, and CRUD capabilities.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 (SPA with React Router v7)
- **State Management**: Redux Toolkit & React-Redux
- **Styling**: Vanilla CSS with custom tokens (Color gradients, Card UI, Micro-animations)
- **Map & Geolocation**: Leaflet + HTML5 Geolocation API
- **SEO Optimization**: React Helmet (`react-helmet-async`) with dynamic meta tags and descriptive image `alt` attributes
- **Icons**: Lucide React

### Backend
- **Framework**: Node.js & Express
- **Database**: PostgreSQL 18
- **Database Access**: Native SQL queries via `pg` (no ORM)
- **File Uploads**: Multer (stores images on local Node.js server under `/uploads`)
- **Validation**: Express custom validation middleware for all hotel fields

---

## 🚀 Running the Application

### 1. Database Setup
Ensure PostgreSQL is running locally on port `5432` with database `hotel_db`:
```bash
# Seed initial luxury hotels and download sample images:
cd server
npm run seed
```

### 2. Start the Backend API Server
```bash
cd server
npm start
# Server starts on http://localhost:5000
```

### 3. Start the Frontend React Client
```bash
cd client
npm run dev
# Frontend starts on http://localhost:3000
```

---

## 📋 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/hotels` | Fetch paginated hotels with `search`, `minPrice`, `maxPrice`, `offersOnly`, `page`, `limit`, and `sortBy` |
| `GET` | `/api/hotels/offers/featured` | Fetch top highlighted special offers for the deals carousel |
| `GET` | `/api/hotels/:id` | Fetch single hotel details by ID |
| `POST` | `/api/hotels` | Create new hotel (with `multipart/form-data` image upload, special offer package, and field validation) |
| `PUT` | `/api/hotels/:id` | Update hotel by ID (supports updating image, price, coordinates, description, and special offers) |
| `DELETE` | `/api/hotels/:id` | Delete hotel by ID and remove associated image file from disk |
| `GET` | `/api/health` | Service health status |

---

## ✨ Key Features & Architecture

1. **Card List Layout matching Sample UI**:
   - Filter sidebar with price slider, min/max inputs, star rating filters, and property types.
   - List layout with image thumbnails, star ratings, price tags, and quick action buttons.
2. **Add/Edit Form (`HotelForm.jsx`)**:
   - Reusable single component for both creating and updating hotels.
   - Live image upload preview with drag & drop support.
   - Live validation errors on title, price, description, and lat/lng coordinates.
   - 1-click GPS geolocation detection & quick city presets (Paris, NYC, Tokyo, Dubai, etc.).
3. **Detail Page & Leaflet Map**:
   - Renders interactive Leaflet map using hotel latitude and longitude.
   - Geolocation API feature calculates distance between visitor's current location and hotel in km/miles.
4. **Delete Confirmation & Success Popup**:
   - Modal prompt before deletion.
   - Floating success popup with checkmark animation upon deletion, creation, or update.
5. **SEO & Accessibility**:
   - Dynamic meta tags (`<title>`, `<meta name="description">`, OpenGraph) on every page.
   - Accessible images with alt attributes.
