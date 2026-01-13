# Asset Approver - Phased Implementation Plan

## Vision
A full-featured platform ("Olive") for influencers to manage brand campaigns, upload assets, and collaborate with brands on approvals.

## Tech Stack (All Phases)
- **Backend:** Express.js (Node.js)
- **Frontend:** Plain HTML, CSS, JavaScript
- **Database:** SQLite (via better-sqlite3)
- **File Storage:** Local filesystem
- **Styling:** CSS with mobile-first responsive design

---

# Phase 1: Simple Asset Review (MVP)
**Goal:** Get the core upload → share → review → approve flow working.

## What We Build
- Upload page: drag-and-drop image upload
- Shareable review URL for each upload batch
- Review page: view images, add comments, approve/reject
- Mobile-responsive design

## Architecture
```
asset-approver/
├── package.json
├── server.js
├── db/
│   └── database.js
├── uploads/
├── public/
│   ├── index.html          # Upload page
│   ├── review.html         # Review page
│   ├── css/styles.css
│   └── js/
│       ├── upload.js
│       └── review.js
└── routes/
    └── api.js
```

## Database Schema (Phase 1)
```sql
-- A batch of uploaded assets (shareable unit)
CREATE TABLE batches (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Individual assets
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending',  -- pending, approved, rejected
  FOREIGN KEY (batch_id) REFERENCES batches(id)
);

-- Comments on assets
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id TEXT NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);
```

## Pages

### Upload Page (`/`)
- Drag-and-drop zone for multiple images
- Upload button
- After upload: show shareable review URL with copy button

### Review Page (`/review/:batchId`)
- Grid of uploaded images with status badges (Pending/Approved/Rejected)
- Click image to open detail modal:
  - Large image view
  - Comments list
  - Add comment form (name + message)
  - Approve/Reject buttons
- Mobile: full-width cards, touch-friendly

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload images, create batch |
| GET | `/api/batches/:id` | Get batch with all assets |
| GET | `/api/assets/:id` | Get single asset + comments |
| POST | `/api/assets/:id/status` | Set approved/rejected |
| POST | `/api/assets/:id/comments` | Add comment |

## Verification
1. `npm start` → server runs on localhost:3000
2. Upload 3 images → get shareable URL
3. Open URL → see image grid with "Pending" badges
4. Click image → add comment → approve
5. Test on mobile viewport

---

# Phase 2: Campaigns
**Goal:** Organize assets into named campaigns (like the "Replica" campaign in the design).

## What Changes
- Batches become "Campaigns" with names
- Campaign list page for the uploader
- Campaign detail page replaces simple review page
- Add creative brief PDF upload

## New/Modified Schema
```sql
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brief_filename TEXT,          -- Optional PDF
  brief_filepath TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Assets now belong to campaigns instead of batches
ALTER TABLE assets ADD COLUMN campaign_id TEXT;
```

## New Pages
- `/campaigns` - List all campaigns (simple list, no auth yet)
- `/campaigns/:id` - Campaign detail with tabs (Content tab first)

---

# Phase 3: Video Support
**Goal:** Support video uploads alongside images.

## What Changes
- Accept video file types (mp4, mov, webm)
- Generate video thumbnails (using ffmpeg or browser-based)
- Video player in review modal
- Separate "Images" and "Videos" sections in campaign view

## Schema Changes
```sql
ALTER TABLE assets ADD COLUMN type TEXT DEFAULT 'image';  -- image, video
ALTER TABLE assets ADD COLUMN duration INTEGER;           -- video duration in seconds
ALTER TABLE assets ADD COLUMN thumbnail_path TEXT;        -- video thumbnail
```

---

# Phase 4: User Accounts & Multi-Campaign
**Goal:** Add simple user identity so influencers can manage multiple campaigns.

## What Changes
- Simple email-based "magic link" login (no passwords)
- Each user has their own campaigns
- Sidebar navigation with campaign list
- User settings page

## Schema Changes
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE campaigns ADD COLUMN user_id TEXT;

CREATE TABLE magic_links (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at DATETIME NOT NULL
);
```

## New Pages
- `/login` - Email input for magic link
- Left sidebar component with campaign list

---

# Phase 5: Messaging & Polish
**Goal:** Add messaging between influencer and brand, match final design.

## What Changes
- Messages tab in campaign view
- Real-time or polling-based message updates
- Creative Brief tab (view/download PDF)
- Final UI polish to match Olive design
- Team avatars in header

## Schema Changes
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

# Implementation Order

## Phase 1 Steps (Start Here)
1. Project setup (npm init, install deps)
2. Database initialization
3. Express server with file upload (multer)
4. Upload page HTML/CSS/JS
5. Review page with image grid
6. Asset detail modal with comments
7. Approve/reject functionality
8. Mobile responsive styling

## Dependencies (Phase 1)
```json
{
  "express": "^4.18.2",
  "better-sqlite3": "^9.4.3",
  "multer": "^1.4.5-lts.1",
  "uuid": "^9.0.0"
}
```

---

# Visual Reference

Phase 1 review page should look like a simplified version of the design:
- Clean white background
- Image grid (2-4 columns depending on screen)
- Rounded card containers
- Status badges: orange "Pending", green "Approved", red "Rejected"
- Filenames below thumbnails
- Mobile: single column, larger touch targets
