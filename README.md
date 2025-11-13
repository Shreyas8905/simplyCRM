# SimplyCRM

A modern, full-stack Customer Relationship Management (CRM) application built with a React frontend and an Express backend using MongoDB.

## Description

SimplyCRM helps businesses manage contacts, track customer interactions, and analyze performance through a clean, intuitive interface. It includes essential CRM features with a responsive UI.

## Features

- **Authentication & Security:** User registration/login, session-based authentication, password hashing with `bcrypt`, protected routes.
- **Contact Management:** CRUD operations, advanced search/filtering, status and source tracking, company/job information.
- **Dashboard & Analytics:** Overview counts, status-based distribution, recent contacts, charts.
- **User Experience:** Responsive design, Tailwind CSS UI, real-time notifications, validated forms, loading/error states.

## Quick Start

### Prerequisites

- `Node.js` (v14+)
- `MongoDB` (local or Atlas)
- `npm` or `yarn`

### Installation & Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd simplycrm
```

2. Backend

```powershell
cd backend
npm install
# Start MongoDB locally if needed (example):
# mongod
npm start
# Backend runs on http://localhost:3000
```

3. Frontend (in a new terminal)

```powershell
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

### Default Login (dev)

- **Email:** `admin@crm.com`
- **Password:** `admin123`

## Tech Stack

- **Frontend:** React 18 (Vite), React Router DOM, Tailwind CSS, Lucide React, Fetch API, React Context API
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), express-session, `bcryptjs`, CORS
- **Tools:** npm, Vite, (optional) MongoDB Compass

## Database Schemas

### User Schema

```js
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
}
```

### Contact Schema

```js
{
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  company: { type: String },
  jobTitle: { type: String },
  status: {
    type: String,
    enum: ['lead', 'opportunity', 'customer', 'closed'],
    default: 'lead'
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'social_media', 'cold_call', 'other'],
    default: 'other'
  },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

## API Endpoints

- **Auth:**

  - `POST /api/register` — Register a user
  - `POST /api/login` — Login
  - `POST /api/logout` — Logout
  - `GET /api/user` — Get current user

- **Contacts:**

  - `GET /api/contacts` — List contacts
  - `POST /api/contacts` — Create contact
  - `PUT /api/contacts/:id` — Update contact
  - `DELETE /api/contacts/:id` — Delete contact

- **Dashboard:**
  - `GET /api/dashboard/stats` — Dashboard stats

## Project Structure

```
simplycrm/
├── backend/
│   ├── server.js
  │   ├── package.json
  │   └── node_modules/
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── components/
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

## Configuration

Create a `.env` file in the `backend` directory:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/simplycrm
SESSION_SECRET=your-session-secret-key
```

The frontend expects the backend at `http://localhost:3000` by default. Update `API_BASE_URL` in the frontend if necessary.

## Troubleshooting

- **MongoDB connection errors:** Ensure MongoDB is running or Atlas URI is correct and database name matches `simplycrm`.
- **CORS errors:** Verify backend CORS settings allow the frontend origin and credentials are configured.
- **Session/cookie issues:** Ensure cookies are enabled and `SESSION_SECRET` is set.
- **Build issues:** Remove `node_modules` and reinstall; check Node.js version compatibility.

## Scripts

- **Backend:**

  - `npm start` — Start production server
  - `npm run dev` — Start dev server (if configured)

- **Frontend:**
  - `npm run dev` — Start dev server
  - `npm run build` — Build for production
  - `npm run preview` — Preview production build

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/awesome-feature`)
3. Commit your changes (`git commit -m "Add awesome feature"`)
4. Push the branch (`git push origin feature/awesome-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the `LICENSE` file for details.

## Author

Shreyas Kulkarni — GitHub: `@Shreyas8905`
