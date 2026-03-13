## SPARSE  
<a href="https://www.sparse.in">
    <img src="./logo.png" alt="SPARSE LOGO" width="55" />
</a>

---

> ✅ **Status:** Sparse web app is working smoothly.  
> Core systems are stable and optimized.  
> 🚧 New features and improvements are actively being developed.

---

**Sparse** is a modern real-time social platform built for **fast conversations, social discovery, and a smooth mobile experience**.

The platform combines messaging, stories, discovery features, and an AI assistant into a lightweight and highly optimized web application.

> 📱 Mobile-first design — currently optimized primarily for mobile devices.  
> ⚡ Built with performance optimizations and caching for extremely fast loading.

---

## 🌐 Live Website

Visit the live app:  
**https://www.sparse.in**

---

# ✨ Core Features

### 💬 Real-Time Chat
- Private one-to-one messaging
- Instant message delivery
- Real-time updates using database subscriptions
- Message seen / delivered status
- Reply to messages
- Emoji reactions on messages
- Typing indicator
- Chat deletion system

---

### 👥 Social System
- Follow / Unfollow users
- Followers and following system
- Mutual follower detection
- Public user profiles

---

### 👤 User Profiles
- Profile photo and bio
- Status message system
- Gender display options
- Birthday display
- Verified role badges

Supported roles:
- Owner
- Friend
- Pookie
- Verified user

---

### 📖 Story System
- Temporary stories
- Story ring around profile avatars
- Story preview system
- Expiration-based story visibility

---

### 🔎 User Discovery
- Fast username search
- Mutual contact suggestions
- Smart discovery based on follow relationships
- Story indicators inside search results

---

### 🤖 AI Assistant

Sparse includes a built-in AI assistant called **Odoy AI**.

- Available directly inside chats
- Works like chatting with a normal user
- Powered by **Odoy servers (odoy.in)**

---

### 😂 Meme Feed

Sparse also includes a **meme discovery feed**.

Features include:

- Infinite meme scrolling
- Safe subreddit filtering
- Lazy loaded images
- Duplicate meme prevention
- Meme interaction tracking
- Double-tap like system

---

### ⏱️ Daily Usage System

To maintain performance and prevent infinite scrolling:

- Meme feed usage is limited to **1 hour per day**
- Time usage is tracked per user
- Automatically resets every day

---

# ⚡ Performance Optimizations

Sparse is built with heavy performance optimizations:

### Database Optimization
- Query limits
- Pagination for chat messages
- Cached queries
- Reduced repeated lookups

### UI Optimization
- Lazy image loading
- Skeleton loading states
- Optimized scrolling
- GPU accelerated animations

### Caching System

Sparse uses multiple caching layers:

**Session Storage**
- Search results
- Mutual contact suggestions
- Stories feed

**Local Storage**
- Profile photos
- Cached assets

**Memory Cache**
- Notification user cache
- Story detection cache

---

# 🛠️ Tech Stack

### Frontend
- React
- React Router
- Custom CSS UI system
- Lucide Icons
- React Icons

### Backend
- Supabase (Realtime messaging system)
- Firebase (Authentication, users, followers, stories)

### Database
- PostgreSQL (Supabase) → chat messages & realtime subscriptions
- Firestore (Firebase) → user data, profiles, stories, meme usage tracking

### AI System
- Odoy AI powered by **odoy.in servers**

### Content System
- Meme feed powered by public meme API
- Safe subreddit filtering system

---

# 🚀 Platform Architecture

Sparse combines two backend systems:

**Supabase**
- Handles realtime chat
- Message storage
- Typing indicators
- Message reactions

**Firebase**
- Authentication
- User profiles
- Followers system
- Stories system
- Meme usage tracking

This hybrid architecture allows the platform to remain **fast, scalable, and efficient**.

---

# 🌍 Open Source

Sparse is open sourced so developers can explore the architecture, understand how the real-time systems work, and learn from the implementation.

You are free to study the code and experiment with the project.

---

# 👨‍💻 Developers

**Sanket Padhyal**  
GitHub: **@sanketpadhyal**

**Bhavesh Patil**
Github: **@bhaveshpatil4251-wq**
 
---

### 📅 Project Information

Created: 2026

---

# 📄 License

All rights reserved © 2026 — **Sparse**  
Created and maintained by **Sanket Padhyal**
