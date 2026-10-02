# Coding With Bashir

A responsive developer portfolio and learning-platform concept based on the supplied reference boards. The main page is the public portfolio; the Courses, Learning, Certificates, Projects, Dashboard, Profile, Blog, AI Assistant, and Contact routes bring the wider product mockups to life.

## Stack

- **Client:** Next.js App Router, React, TypeScript, Lucide icons.
- **Server:** Node.js, Express, and Mongoose.
- **Database:** MongoDB when `MONGODB_URI` is configured. For a zero-setup preview, the API falls back to a small persistent local JSON store; no contact submissions are discarded.

## Run locally

```bash
npm install
npm install --prefix client
npm install --prefix server
cp server/.env.example server/.env # optional; add a MongoDB connection string
npm run dev
```

The Next.js site runs on **http://localhost:3000** and proxies `/api/*` to the Express API on **http://localhost:4000**. The proxy keeps browser requests relative, so the preview works behind Arena's forwarded preview host too.

To use MongoDB, set `MONGODB_URI` in `server/.env` (for example, a local MongoDB URL or a MongoDB Atlas connection string). The API attempts the database connection at startup; if MongoDB is unavailable, it remains usable with the local preview store for that run.

## Useful commands

```bash
npm run dev       # run the frontend and API together
npm run build     # production-build the Next.js client
npm run typecheck # check the client TypeScript
npm test           # run server API smoke tests
```
