# Coffee Shop Finder

I made this to find cafes near me without scrolling through Google Maps. It shows cafes around you on a map, tells you which ones have Wi-Fi, and lets you save favorites and leave reviews.

It started as a small side project to learn how a full web app fits together: login, a database, a map and an API.

## What it does

You sign in with Google or GitHub. The map centers on your location and loads cafes within 2 km from OpenStreetMap. You can search by name, hide cafes without Wi-Fi, and filter by rating. Click a marker to save the cafe, favorite it or write a review. Your favorites show up in a list under the map.

One thing to know: ratings only come from reviews written inside this app, so the rating filter only matches cafes that someone has already reviewed. Also, a lot of cafes on OpenStreetMap have no address or Wi-Fi info, so you will see "Address not available" often.

## Built with

Next.js 16, React 19, TypeScript, Tailwind CSS, Leaflet for the map, the Overpass API for cafe data, Prisma with PostgreSQL, and Auth.js (next-auth v5) for login.

## Run it locally

```bash
git clone https://github.com/Ishita-Kataria/Coffee-Shop-Finder.git
cd Coffee-Shop-Finder
npm install
```

Create a `.env` file in the root folder:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
AUTH_SECRET="any-long-random-string"
AUTH_GITHUB_ID="..."
AUTH_GITHUB_SECRET="..."
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
```

Then set up the database and start the app:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

Open http://localhost:3000.

## What I learned

Honestly, a lot of this was new to me. Login with Google and GitHub was the first thing I got working, and I now understand why the app needs a session and where the user id comes from. I also learned how a database connects things: a user can have many reviews and many favorites, and each review belongs to one cafe.

The most annoying bug was favorites returning a 404. The code was fine, but the file was in the wrong folder, so Next.js never found the route. Pushing to GitHub also failed once because of my college Wi-Fi, and I had to switch networks.

## How I built it

I built this with help from an AI assistant (Claude). I used it to plan the features, write code and fix errors, and I ran, tested and changed things myself along the way.

## Still to do

- Better styling and a mobile-friendly layout
- Deploy it online
- Add outlets, noise level and seating info for each cafe
- Fill in missing addresses automatically
