<p align="center">
  <img src="src/assets/readmelogoo.png" alt="Sparse logo" width="96" />
</p>

<h1 align="center">Sparse Web Platform</h1>

<p align="center">
  A modern, high-performance real-time social web application built for instant communication, social feeds, story sharing, dynamic role security, and AI interaction — built on a pure serverless architecture powered by Firebase Security Rules and Supabase Realtime.
</p>

<p align="center">
  <a href="https://www.sparse.in">Website</a>
  |
  <a href="https://www.sparse.in/dashboard">Dashboard</a>
  |
  <a href="https://github.com/sanketpadhyal/Sparse-Website-Code">GitHub Repository</a>
</p>

<p align="center">
  <a href="https://www.sparse.in">
    <img src="https://img.shields.io/badge/Live_Website-sparse.in-00C853?style=for-the-badge&logo=netlify&logoColor=white" alt="Live website" />
  </a>
  <a href="https://github.com/sanketpadhyal/Sparse-Website-Code/stargazers">
    <img src="https://img.shields.io/github/stars/sanketpadhyal/Sparse-Website-Code?style=for-the-badge&color=FFD700&logo=github" alt="GitHub Stars" />
  </a>
  <a href="https://github.com/sanketpadhyal/Sparse-Website-Code">
    <img src="https://img.shields.io/badge/Architecture-Serverless_Firebase_Rules-111827?style=for-the-badge&logo=firebase&logoColor=FFCA28" alt="Serverless Architecture" />
  </a>
  <a href="https://github.com/sanketpadhyal/Sparse-Website-Code/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
  </a>
</p>

## Overview

Sparse is an open-source, full-featured web platform engineered for ultra-fast communication, social feed discovery, story updates, and AI assistance. Designed with a mobile-first philosophy, it brings together real-time chatrooms, group messaging, 24-hour image/video stories, meme feeds, and AI caption generators into a single fluid application.

The entire frontend is optimized for zero-overhead static deployment.

> [!IMPORTANT]
> **Serverless Architecture (No Custom Backend Server)**
> This web application **does NOT require or use an individual Node.js/Express backend server**.
> All authentication, database queries, real-time listeners, user permissions, and media uploads are handled directly client-to-cloud and secured using **Firebase Firestore Security Rules** and **Supabase Row Level Security (RLS)**.
> This makes hosting effortless on static cloud edge platforms like Netlify, Vercel, GitHub Pages, or Firebase Hosting without server management cost or downtime.

> [!TIP]
> **Support Open Source & Star The Repo ⭐**
> If you find this codebase useful, please give this repository a **Star on GitHub**! Your support helps expand open-source development and new features.

---

## Architecture & Security Model

```
                    ┌─────────────────────────────────────────┐
                    │          React Frontend Client          │
                    │         (SPA / React Router 7)          │
                    └───────────────────┬─────────────────────┘
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
┌──────────────────────────┐                             ┌──────────────────────────┐
│     Firebase Cloud       │                             │     Supabase Cloud       │
├──────────────────────────┤                             ├──────────────────────────┤
│ - Authentication         │                             │ - Realtime WebSocket     │
│ - Firestore Database     │                             │ - Chat Message Logs      │
│ - Storage (Media)        │                             │ - Push Subscriptions     │
│ - Firestore Security     │                             │ - Storage Buckets        │
│   Rules (Access Control) │                             │ - Row Level Security     │
└──────────────────────────┘                             └──────────────────────────┘
```

Because there is **no custom server-side Node process**, security and authorization are strictly enforced by database rules:
- **User Privacy & Role Integrity**: Users cannot tamper with role assignments (`owner`, `friend`, `pookie`, `verified`) via console injection or client code because Firebase Security Rules restrict write operations to authorized UIDs.
- **Direct Real-time Sync**: Chat channels and story feeds subscribe directly to Firebase/Supabase WebSocket streams for instant ~1s update latency.

---

## Product Surfaces

| Surface | URL / Location |
| --- | --- |
| Live Website | [www.sparse.in](https://www.sparse.in) |
| Dashboard | [www.sparse.in/dashboard](https://www.sparse.in/dashboard) |
| Source Repository | [sanketpadhyal/Sparse-Website-Code](https://github.com/sanketpadhyal/Sparse-Website-Code) |

---

## Key Features

### 💬 Real-Time Messaging & Group Chat
- Instant 1-on-1 messaging with read receipts, typing indicators, and emoji reactions.
- Group chat support with admin controls, member invitations, and group info panels.
- Photo sharing, reply threads, swipe-to-reply gestures, and message deletion.

### 📖 24-Hour Story System
- Story viewer supporting both images and short videos (up to 30s playback).
- Story ring UI with instant progress indicators.
- Stories archive to view and re-upload expired story memories.

### 📸 Post Feed & Social Discovery
- Media post feed with double-tap likes, comment threads, and detailed interaction modal.
- Username-based search, mutual connection discovery, and profile relationship tags.
- Integrated **Odoy AI** caption generator during post creation for automated caption writing.

### 🛡️ Role Security System (Firestore Rules)
- Role badges: `Owner 👑`, `Friend 💎`, `Pookie 🎀`, `Verified ✔️`.
- Dedicated **Owner Panel** interface for search and role assignment.
- Rules-level protection preventing user self-elevation or console tampering.

### 🌗 Dark & Light Theme System
- Complete dark and light UI modes with auto-sync based on system preference.
- Custom CSS variable design system ensuring smooth transitions across screens.

---

## Project Structure

| Directory | Description |
| --- | --- |
| `src/` | Main React application source directory |
| `src/auth/` | Authentication components (Login, Signup, Recover, Email Verification, Session Devices) |
| `src/components/` | Reusable UI components (Navbar, BottomNav, Footer, Toast, Photo Cropper) |
| `src/GroupChat/` | Group chat modules (Create Group, Group Chat Room, Group Info) |
| `src/hook/` | Custom React hooks (Session Guard, Message Listener, Firestore Guard, Network speed hook) |
| `src/loading-page/` | App loading screens and skeleton loaders |
| `src/main/` | Core views (Dashboard, ChatRoom, Chats list, Edit Profile, User Search, Odoy AI) |
| `src/main/preview-pages/` | Modal previews (User Profile, Story Preview, Connections) |
| `src/main/story/` | Story creation and editor tools (Add Story, Story Canvas Editor) |
| `src/pages/` | Static information pages (Hero landing, Developers, Journey timeline, Owner Panel, Profile QR) |
| `src/post/` | Post feed components (Add Post, Post View, Posts Feed grid, Select Post) |
| `src/settings/` | User account settings (Account Center, Security, Data & Privacy, Insights, Liked Memes) |
| `supabase/` | Supabase configuration and Edge Functions (`send-push`) |

---

## Main Files

| File | Purpose |
| --- | --- |
| `src/App.js` | Primary App shell, route navigation registry, and theme context wrapper |
| `src/firebase.js` | Initializer for Firebase App, Auth, Firestore, and Storage |
| `src/supabase.js` | Initializer for Supabase Realtime client and Push Notification helper |
| `src/supabaseGroup.js` | Secondary Supabase instance for group communication channels |
| `src/main/Dashboard.jsx` | Main social feed, story reel, meme feed, and activity dashboard |
| `src/main/ChatRoom.jsx` | 1-on-1 real-time WebSocket chat room |
| `src/GroupChat/GroupChatRoom.jsx` | Group conversation room with real-time payload syncing |
| `src/pages/OwnerPanel.js` | Protected owner dashboard for user verification and role assignment |

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend Framework | React 19, React Router 7 |
| Build Tool | Create React App / Webpack |
| Realtime Database | Supabase (PostgreSQL & Realtime Channels) |
| Core DB & Auth | Firebase Auth & Cloud Firestore |
| Storage | Firebase Storage & Supabase Storage |
| AI Integration | Odoy AI Assistant |
| Icons & Animation | React Icons, Lucide React, Lenis Smooth Scroll |
| Styling | Custom Vanilla CSS (Design system tokens) |

---

## Environment Variables & Configuration

To run Sparse locally or deploy your own instance, create a `.env` file in the root workspace using the `.env.example` template:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=1234567890
REACT_APP_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-supabase-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_PUSH_FUNCTION_URL=https://your-supabase-project.functions.supabase.co/functions/v1/send-push

# Group Chat Supabase Instance (Optional)
REACT_APP_SUPABASE_GROUP_URL=https://your-group-supabase-project.supabase.co
REACT_APP_SUPABASE_GROUP_ANON_KEY=your_group_supabase_anon_key

# AI Endpoint (Optional)
REACT_APP_ODOY_AI_URL=https://your-ai-service.run.app/ai
```

---

## Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- npm, yarn, or pnpm
- Firebase Project
- Supabase Project

### 2. Installation
Clone the repository and install project dependencies:

```bash
git clone https://github.com/sanketpadhyal/Sparse-Website-Code.git
cd Sparse-Website-Code
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env` and fill in your Firebase and Supabase project credentials:

```bash
cp .env.example .env
```

### 4. Start Development Server
Run the local development server:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 5. Build for Production
To generate an optimized production bundle:

```bash
npm run build
```

---

## Developers & Authors

- **Sanket Padhyal** - *Creator & Lead Developer* - [@sanketpadhyal](https://github.com/sanketpadhyal)
- **Bhavesh Patil** - *Developer* - [@bhaveshpatil4251-wq](https://github.com/bhaveshpatil4251-wq)

---

## License

This project is licensed under the **MIT License** - feel free to fork, modify, and build upon it!

---

<p align="center">
  <b>⭐ If you like this project, consider giving it a star on GitHub! ⭐</b>
</p>
