## SPARSE
<a href="https://www.sparse.in">
    <img src="./logo.png" alt="SPARSE LOGO" width="55" />
</a>

---

> ✅ **Status:** Sparse web app is running smoothly.  
> Core systems are stable and optimized.  
> 🚧 New features and improvements are actively being developed.

---

Sparse is a modern real-time social platform built for **fast conversations, social discovery, and a smooth mobile experience**.

The platform combines messaging, stories, posts, discovery features, and an AI assistant into a lightweight and highly optimized web application.

📱 **Mobile-first design** — currently optimized primarily for mobile devices.  
⚡ **Built with performance optimizations and caching for extremely fast loading.**

---

## 🌐 Live Website

Visit the live app:  
https://www.sparse.in

Create an account and connect with me — **@sanket**

---

# 📊 Activity & Engagement System (NEW)

Sparse now includes a **comprehensive activity tracking system** that shows everything happening around the user in real-time.

### 📌 Activity Page Features

Users can track:

- 🔐 **Login Activity**
  - recent login sessions
  - security awareness

- 👥 **Followers Activity**
  - when someone follows you

- 🔁 **Following Activity**
  - when you follow someone  
  - story updates from following users  
  - profile updates  

- 📝 **Post Updates Feed**
  - new posts from people you follow  
  - real-time updates  

- ❤️ **Engagement Notifications**
  - likes on your posts  
  - comments on your posts  

---

### ⚡ Real-Time Sync

- instant updates  
- cross-session sync  
- optimized loading  

---

### 🎯 Purpose

- increase user engagement  
- improve retention  
- full visibility of social activity  

---

# 🔔 Notifications System

Sparse includes a smart **real-time notifications system**.

Users receive notifications for:

1. **Chats**
   - new message alerts
   - message reactions
   - reply notifications

2. **Stories**
   - story interactions
   - story replies

3. **Post Activity**
   - post likes
   - post comments

4. **Profile Updates**
   - profile bio updates
   - profile photo changes
   - status updates

### Notification Safety Algorithm

To improve security and reduce suspicious activity, Sparse uses a small device-based algorithm.

Notifications will only work on the **device where the account was last logged in**.

This helps prevent:

- unauthorized login monitoring
- suspicious background activity
- notification spam across unknown devices

The system ensures a **safe and controlled notification environment** for users.

---

# 🔐 Account System

Sparse includes a full authentication and account management system.

Features include:

- Secure login and signup
- Username-based account system
- Password authentication using Firebase
- Username change support
- Profile editing
- Password change system
- Account deletion system

When a user deletes their account:

- profile data is removed
- stories are deleted
- posts are deleted
- likes and comments are removed
- follower connections are cleared
- authentication account is deleted

---

# 👤 User Profiles

Each user profile includes:

- profile photo
- name and username
- bio
- status message
- gender display
- birthday
- follower and following counts

Profiles also support **role badges**.

Supported roles:

- Owner
- Friend
- Pookie
- Verified user

---

# 📸 Posts System

Sparse now includes a full **post system**.

Users can:

- create posts with images
- add captions
- view posts on profiles
- like posts
- comment on posts
- open posts in a full view
- see total likes and comments

Posts support **real-time interaction** and are displayed on user profiles.

---

# 💬 Real-Time Chat

Sparse includes a real-time messaging system.

Features include:

- private one-to-one messaging
- instant message delivery
- real-time updates using database subscriptions
- message seen / delivered status
- reply to messages
- emoji reactions on messages
- typing indicator
- chat deletion system

---

# 🖼 Chat Media Support

Chats support media messages.

Features include:

- image sharing in chats
- optimized image loading
- skeleton placeholders while images load
- lazy loading for better performance

---

# 👥 Social System

Sparse includes a follow-based social network.

Users can:

- follow users
- unfollow users
- see followers
- see following
- detect mutual followers
- view public profiles

---

# 📖 Story System

Sparse includes a **temporary story system**.

Features include:

- stories visible for 24 hours
- story ring around profile avatars
- story preview viewer
- image stories
- expiration-based visibility

Stories are stored using **Firebase Storage**.

---

# 🔎 User Discovery

Sparse includes fast user discovery tools.

Features include:

- fast username search
- mutual follower suggestions
- discovery based on follow relationships
- story indicators inside search results

---

# 🤖 AI Assistant

Sparse includes a built-in AI assistant called **Odoy AI**.

Features include:

- available directly inside chats
- behaves like chatting with a normal user
- powered by **Odoy servers**

### Infrastructure

The **Odoy AI backend servers are now deployed on Google Cloud**, allowing:

- improved scalability
- faster AI responses
- better uptime
- secure backend infrastructure

---

# 😂 Meme Feed

Sparse includes a meme discovery feed.

Features include:

- infinite meme scrolling
- safe subreddit filtering
- lazy loaded images
- duplicate meme prevention
- meme interaction tracking
- double tap like system

---

# ⏱️ Daily Usage System

To maintain performance and prevent excessive scrolling:

- meme feed usage is limited to **1 hour per day**
- time usage is tracked per user
- automatically resets every day

---

# 🆕 Latest Updates

Recent improvements added to Sparse:

1. **Posts System**
   - Users can now create posts.
   - Posts support likes and comments.
   - Post view page with interactions.

2. **Account System Improvements**
   - Username change support.
   - Password authentication improvements.
   - Full account deletion system.

3. **Stories System**
   - Stories now support image uploads.
   - Images stored using Firebase Storage.
   - Optimized loading for faster viewing.

4. **Chat System**
   - Chat images supported.
   - Optimized loading with skeleton placeholders.

5. **Notifications System**
   - Notifications for chats, stories, posts and profile updates.
   - Device-based safety algorithm added.

6. **Infrastructure Upgrade**
   - Odoy AI backend servers deployed on Google Cloud.

7. **Bug Fixes**
   - Fixed layout issues.
   - Performance improvements applied.

---

# ⚡ Performance Optimizations

Sparse is built with heavy performance optimization.

### Database Optimization

- query limits
- pagination for chat messages
- reduced repeated queries
- optimized Firestore usage

### UI Optimization

- lazy image loading
- skeleton loading states
- optimized scrolling
- GPU accelerated animations

### Caching System

Sparse uses multiple caching layers.

**Session Storage**

- search results
- mutual contact suggestions
- story detection

**Local Storage**

- profile photos
- cached assets

**Memory Cache**

- notification user cache
- story detection cache

---

# 🛠 Tech Stack

### Frontend

- React
- React Router
- Custom CSS UI
- React Icons

### Backend

- Supabase (Realtime chat system)
- Firebase (Authentication, users, followers, stories, posts)

### Database

- PostgreSQL (Supabase) → chat messages & realtime subscriptions  
- Firestore (Firebase) → users, profiles, stories, posts, meme usage

### AI System

- Odoy AI backend deployed on **Google Cloud**

### Content System

- Meme feed powered by public meme APIs
- Safe subreddit filtering

---

# 🚀 Platform Architecture

Sparse uses a **hybrid backend architecture**.

### Supabase

Handles:

- realtime chat
- message storage
- typing indicators
- message reactions

### Firebase

Handles:

- authentication
- user profiles
- followers system
- posts system
- stories system
- meme usage tracking

This architecture allows Sparse to remain **fast, scalable, and efficient**.

---

# 🌍 Open Source

Sparse is open sourced so developers can explore the architecture, understand how the real-time systems work, and learn from the implementation.

You are free to study the code and experiment with the project.

---

# 👨‍💻 Developers

**Sanket Padhyal**  
GitHub: @sanketpadhyal  
Sparse Username: @sanket

**Bhavesh Patil**  
GitHub: @bhaveshpatil4251-wq  
Sparse Username: @kaii

---

### 📅 Project Information

Created: 2026

---

# 📄 License

All rights reserved © 2026 — **Sparse**  
Created and maintained by **Sanket Padhyal**
