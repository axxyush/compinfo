# CompInfo

Internal IT asset management tool built for CASet (CAS Educational Technology)
at the University at Buffalo. Tracks hardware assets, rename history, device
status, and generates custom spreadsheet exports.

Built with MongoDB, Express.js, React, and Node.js (MERN stack).

---

## What It Does

- Track every device by serial number — computers, laptops, monitors
- Full rename history per machine (who it was, what it became, when)
- Search by serial number, current name, old names, model, or manufacturer
- Filter assets by status, manufacturer, type, and age
- Import directly from Excel — handles multiple rows per serial number automatically
- Generate custom spreadsheets from a list of serial numbers
- Filter and export any subset of your inventory to Excel
- Activity log of every change made

---

## Tech Stack

| Layer        | Technology          |
| ------------ | ------------------- |
| Frontend     | React 18, Bootstrap |
| Backend      | Node.js, Express.js |
| Database     | MongoDB (local)     |
| File parsing | SheetJS (xlsx)      |

---

## Local Setup

### Prerequisites

- Node.js 18+
- MongoDB running locally on port 27017
- npm

### 1. Clone the repo

```bash
git clone https://github.com/axxyush/compinfo.git
cd compinfo
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd backend
npm install
```

### 4. Create backend environment file

Create a file at `backend/.env`:

```
PORT=5001
MONGO_URI=mongodb://localhost:27017/compinfo
CLIENT_URL=http://localhost:3000
MAX_UPLOAD_MB=50
```

### 5. Start MongoDB

```bash
mongod
```

### 6. Start the backend

```bash
cd backend
npm run dev
```

You should see:

```
MongoDB connected
Server running on port 5001
```

### 7. Start the frontend

Open a new terminal from the project root:

```bash
npm start
```

App runs at `http://localhost:3000`

---

## Seeding Demo Data

To populate the database with 20 sample assets for testing:

```bash
cd backend
npm run seed
```

This clears existing data and inserts realistic demo assets.

---

## Importing Real Data

Your spreadsheet must have these exact column headers:

```
Serial Number | Current Name | Renamed From | Renamed To | Date | Status | Manufacture | Model | Type
```

1. Go to `http://localhost:3000/import`
2. Upload your `.xlsx` file
3. Review the preview — new assets and conflicts shown separately
4. Click Confirm to import

The importer automatically:

- Groups multiple rows per serial number into one asset
- Builds rename history from Renamed From / Renamed To columns
- Maps Redeploy status → Ready to Deploy
- Maps Renamed status → Active

---

## Pages

| Route                   | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `/dashboard`            | Stats overview, age alerts, recent activity        |
| `/assets`               | Full asset list with search and filters            |
| `/assets/:serialNumber` | Full detail, rename history, edit, Lansweeper link |
| `/assets/new`           | Add a single asset manually                        |
| `/import`               | Import from Excel spreadsheet                      |
| `/generate`             | Paste serial numbers → download custom spreadsheet |
| `/filter`               | Query your inventory → download filtered export    |
| `/activity`             | Full log of every change                           |

---

## Deployment (Work Computer)

To run on a shared work computer so others on the UB network can access it:

### Install PM2

```bash
npm install -g pm2
```

### Build the frontend

```bash
npm run build
```

### Start backend permanently with PM2

```bash
cd backend
pm2 start server.js --name compinfo-backend
pm2 save
pm2 startup
```

### Access

Anyone on the UB network can open the app at:

```
http://<your-work-computer-ip>:5001
```

Find your IP with `ipconfig` (Windows) or `ifconfig` (Mac/Linux).

---

## Notes

- Data is stored locally in MongoDB — never leaves the UB network
- No authentication currently — intended for internal CASet use only
- Purchase date is not in the spreadsheet and must be added manually
  per asset via the Edit button on the asset detail page
- Lansweeper integration: each asset page links directly to
  https://lanswp-cast.acsu.buffalo.edu/quicksearch.aspx?q=<serial>

---

## Author

Ayush Srivastava — Student Assistant, CASet, University at Buffalo

````

Copy that and save it as `README.md` in the root of your project, then:

```bash
git add README.md
git commit -m "add README"
git push origin main
````
