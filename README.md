# Men for Menstruation

Men for Menstruation is a community-first web app for sharing free period product locations and practical support notes across Hong Kong.

## What Improved

- Better user experience with clear status messages instead of alert popups.
- Cleaner post form with character limits and district support.
- Stable map marker placement based on district or deterministic fallback.
- More intentional visual design with responsive layout and improved typography.
- Lint-clean Firebase setup without unused Analytics code.

## Tech Stack

- React 18
- Firebase Firestore
- React Leaflet + OpenStreetMap tiles

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm start
```

3. Build production bundle:

```bash
npm run build
```

## Firestore Notes

Posts are stored in the `posts` collection with:

- `author` (string)
- `district` (string, optional)
- `content` (string)
- `createdAt` (timestamp)

The app reads posts ordered by `createdAt` descending.
