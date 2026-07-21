import { useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";
import DashboardNav from "../components/DashboardNavbar";
import "./Chats.css";

import { auth, db } from "../firebase";
import { supabase } from "../supabase";
import { supabaseGroup } from "../supabaseGroup";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  where } from
"firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

import { useNavigate } from "react-router-dom";
import { FaSearch, FaComments, FaTimes, FaCheck, FaCheckDouble, FaThumbtack, FaChevronDown, FaPlus, FaUsers } from "react-icons/fa";
import { MdVerified } from "react-icons/md";

function Chats() {

  const navigate = useNavigate();

  const [odoyLogo, setOdoyLogo] = useState(() => {
    const cached = localStorage.getItem("odoy_logo_cache");
    return cached || "https://odoy.in/logo/logo.png";
  });

  const [loading, setLoading] = useState(true);
  const [statusUsers, setStatusUsers] = useState([]);
  const [mutualUsers, setMutualUsers] = useState([]);
  const [chatList, setChatList] = useState([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [myUsername, setMyUsername] = useState("");
  const [myUid, setMyUid] = useState("");
  const [myProfile, setMyProfile] = useState({
    name: "",
    username: "",
    photo: "/assets/profile.png",
    status: ""
  });

  const [menuChat, setMenuChat] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [holdTimer, setHoldTimer] = useState(null);
  const [activeView, setActiveView] = useState(localStorage.getItem("activeView") || "chats");
  const [showTitleMenu, setShowTitleMenu] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupResults, setGroupResults] = useState([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupViewLoading, setGroupViewLoading] = useState(activeView === "groups");
  const [myGroups, setMyGroups] = useState([]);
  const [myGroupsLoading, setMyGroupsLoading] = useState(true);


  useEffect(() => {
    localStorage.setItem("activeView", activeView);
  }, [activeView]);

  useEffect(() => {

    if (activeView !== "groups") {
      setGroupViewLoading(false);
      return;
    }

    setGroupViewLoading(true);

    const timer = setTimeout(() => {
      setGroupViewLoading(false);
    }, 650);

    return () => clearTimeout(timer);

  }, [activeView]);


  useEffect(() => {
    if (!myUid) return;

    const channel = supabase.
    channel("chat-live-" + myUid).

    on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "messages"
    }, (payload) => {

      const msg = payload.new;
      if (!msg) return;

      const parts = msg.chat_id.split("_");
      if (!parts.includes(myUid)) return;


      const otherUid = parts.find((u) => u !== myUid);

      const user = mutualUsers.find((u) => u.uid === otherUid);

      if (!user) return;

      setChatList((prev) => {

        let updated = [...prev];

        const index = updated.findIndex((c) => c.username === user.username);

        if (index !== -1) {

          updated[index] = {
            ...updated[index],
            lastMessage: msg.text,
            lastSender: msg.sender,
            lastTime: new Date(msg.created_at),
            lastSeen: msg.seen,
            unread: msg.sender !== myUid ?
            (updated[index]?.unread || 0) + 1 :
            0
          };

        } else {

          updated.unshift({
            username: user.username,
            name: user.name,
            photo: user.photo,
            role: user.role,
            lastMessage: msg.text,
            lastSender: msg.sender,
            lastTime: new Date(msg.created_at),
            lastSeen: msg.seen,
            unread: msg.sender !== myUid ? 1 : 0
          });

        }

        updated.sort((a, b) => b.lastTime - a.lastTime);

        return updated;
      });

    }).

    on("postgres_changes", {
      event: "UPDATE",
      schema: "public",
      table: "messages"
    }, (payload) => {

      const msg = payload.new;
      if (!msg) return;

      const parts = msg.chat_id.split("_");
      if (!parts.includes(myUid)) return;


      const otherUid = parts.find((u) => u !== myUid);

      const user = mutualUsers.find((u) => u.uid === otherUid);
      if (!user) return;

      setChatList((prev) =>
      prev.map((chat) =>
      chat.username === user.username ?
      { ...chat, lastSeen: msg.seen } :
      chat
      )
      );

    }).

    on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "typing"
    }, (payload) => {

      const t = payload.new;
      if (!t) return;

      if (t.username === myUid) return;


      const parts = t.chat_id.split("_");
      if (!parts.includes(myUid)) return;

      const otherUid = parts.find((u) => u !== myUid);

      const user = mutualUsers.find((u) => u.uid === otherUid);

      if (!user) return;

      setChatList((prev) =>
      prev.map((chat) =>
      chat.username === user.username ?
      { ...chat, typing: t.typing, lastTypingTime: Date.now() } :
      chat
      )
      );

    }).

    subscribe();

    return () => supabase.removeChannel(channel);

  }, [myUid, mutualUsers]);

  useEffect(() => {

    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {

      const ask = async () => {
        try {
          await Notification.requestPermission();
        } catch {}
      };

      document.addEventListener("click", ask, { once: true });
      document.addEventListener("touchstart", ask, { once: true });

    }

  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setChatList((prev) =>
      prev.map((chat) =>
      chat.typing && Date.now() - (chat.lastTypingTime || 0) > 2000 ?
      { ...chat, typing: false } :
      chat
      )
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  function generateSession() {
    return Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
  }

  function getTimeValue(value) {
    if (typeof value === "number") return value;
    if (value && typeof value.toMillis === "function") return value.toMillis();
    if (value && typeof value.seconds === "number") return value.seconds * 1000;
    return 0;
  }

  function formatPreview(msg) {
    if (!msg) return "";

    if (msg.length > 60) {
      return "Message sent";
    }

    return msg;
  }

  function formatChatTime(date) {
    if (!date) return "";

    const d = new Date(date || 0);
    const now = new Date();

    const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

    if (sameDay) {
      return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
    }

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const sameYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

    if (sameYesterday) {
      return "Yesterday";
    }

    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  function openChat(username) {
    const session = generateSession();

    setChatList((prev) =>
    prev.map((chat) =>
    chat.username === username ?
    { ...chat, unread: 0 } :
    chat
    )
    );

    navigate(`/chatroom?with=${username}&session=${session}`);
  }

  async function deleteChat(username) {

    const user = mutualUsers.find((u) => u.username === username);
    if (!user) return;

    const chatId = [myUid, user.uid].sort().join("_");

    await supabase.
    from("messages").
    delete().
    eq("chat_id", chatId);

    await supabase.
    from("typing").
    delete().
    eq("chat_id", chatId);

    setChatList((prev) => prev.filter((c) => c.username !== username));

    setMenuChat(null);

  }

  function startHold(e, username) {

    const timer = setTimeout(() => {

      setMenuChat(username);

      setMenuPos({
        x: e.clientX || e.touches?.[0]?.clientX || window.innerWidth / 2,
        y: e.clientY || e.touches?.[0]?.clientY || window.innerHeight / 2
      });

    }, 600);

    setHoldTimer(timer);

  }

  function cancelHold() {

    if (holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }

  }

  function openContext(e, username) {

    e.preventDefault();

    setMenuChat(username);

    setMenuPos({
      x: e.clientX,
      y: e.clientY
    });

  }

  function selectView(view) {
    setActiveView(view);
    setShowTitleMenu(false);
    setMenuChat(null);
  }

  useEffect(() => {

    window.scrollTo(0, 0);

    const cacheStatus = "chat_status_cache";
    const cacheMutual = "chat_mutual_cache";
    const cacheChats = "chat_list_cache";

    const cacheStatusTime = "chat_status_cache_time";
    const cacheMutualTime = "chat_mutual_cache_time";
    const cacheChatsTime = "chat_list_cache_time";

    const now = Date.now();

    const cachedStatus = localStorage.getItem(cacheStatus);
    const cachedMutual = localStorage.getItem(cacheMutual);
    const cachedChats = localStorage.getItem(cacheChats);

    const cachedStatusTime = localStorage.getItem(cacheStatusTime);
    const cachedMutualTime = localStorage.getItem(cacheMutualTime);
    const cachedChatsTime = localStorage.getItem(cacheChatsTime);

    if (cachedStatus && cachedStatusTime && now - parseInt(cachedStatusTime) < 30000) {
      const parsedStatus = JSON.parse(cachedStatus);
      parsedStatus.sort((a, b) => getTimeValue(b.time) - getTimeValue(a.time));
      setStatusUsers(parsedStatus);
    }

    if (cachedMutual && cachedMutualTime && now - parseInt(cachedMutualTime) < 30000) {
      setMutualUsers(JSON.parse(cachedMutual));
    }

    if (cachedChats && cachedChatsTime && now - parseInt(cachedChatsTime) < 30000) {
      setChatList(JSON.parse(cachedChats));
      setLoading(false);
    }

    const unsub = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        navigate("/home");
        return;
      }

      const myRef = doc(db, "users", user.uid);
      const mySnap = await getDoc(myRef);

      if (!mySnap.exists()) return;

      const myData = mySnap.data();

      setMyProfile({
        name: myData.name || myData.username,
        username: myData.username,
        photo: myData.profilePhoto || "/assets/profile.png",
        status: myData.status || ""
      });

      setMyUsername(myData.username);
      setMyUid(user.uid);

      const myFollowing = myData.followingList || [];
      const myFollowers = myData.followersList || [];

      const mutual = [];
      const statusList = [];

      await Promise.all(
        myFollowing.map(async (uid) => {

          if (!myFollowers.includes(uid)) return;

          const ref = doc(db, "users", uid);
          const snap = await getDoc(ref);

          if (!snap.exists()) return;

          const data = snap.data();

          const userObj = {
            uid: uid,
            name: data.name || data.username,
            username: data.username,
            photo: data.profilePhoto || "/assets/profile.png",
            status: data.status || "",
            role: data.role || ""
          };

          mutual.push(userObj);

          if (data.status && data.status.trim() !== "") {
            statusList.push({
              ...userObj,
              time: getTimeValue(data.statusUpdatedAt)
            });
          }

        })
      );

      setMutualUsers(mutual);
      statusList.sort((a, b) => getTimeValue(b.time) - getTimeValue(a.time));
      setStatusUsers(statusList);

      localStorage.setItem(cacheMutual, JSON.stringify(mutual));
      localStorage.setItem(cacheMutualTime, Date.now().toString());

      localStorage.setItem(cacheStatus, JSON.stringify(statusList));
      localStorage.setItem(cacheStatusTime, Date.now().toString());

      const { data: messages } = await supabase.
      from("messages").
      select("*").
      or(`chat_id.like.${user.uid}_%,chat_id.like.%_${user.uid}`).
      order("created_at", { ascending: false }).
      limit(200);

      const chatMap = {};

      messages?.forEach((msg) => {

        const parts = msg.chat_id.split("_");
        if (!parts.includes(user.uid)) return;

        const other = parts.find((u) => u !== user.uid);

        if (!chatMap[other]) {
          chatMap[other] = {
            username: other,
            lastMessage: msg.text,
            lastSender: msg.sender,
            lastTime: new Date(msg.created_at),
            lastSeen: msg.seen,
            unread: 0
          };
        }

        if (msg.sender !== user.uid && !msg.seen) {
          chatMap[other].unread = (chatMap[other].unread || 0) + 1;
        }

      });

      const chats = [];

      const mutualMap = {};
      mutual.forEach((u) => {
        mutualMap[u.uid] = u;
      });

      Object.keys(chatMap).forEach((uid) => {

        const m = mutualMap[uid];

        if (m) {
          chats.push({
            username: m.username,
            name: m.name,
            photo: m.photo,
            role: m.role,
            lastMessage: chatMap[uid].lastMessage,
            lastSender: chatMap[uid].lastSender,
            lastTime: chatMap[uid].lastTime,
            lastSeen: chatMap[uid].lastSeen,
            unread: chatMap[uid].unread
          });
        }

      });

      if (chats.length > 1) {
        chats.sort((a, b) => {
          return b.lastTime - a.lastTime;
        });
      }

      setChatList(chats);

      localStorage.setItem(cacheChats, JSON.stringify(chats));
      localStorage.setItem(cacheChatsTime, Date.now().toString());

      setLoading(false);

    });

    return () => unsub();

  }, [navigate]);

  useEffect(() => {

    if (search.trim() === "") {
      setResults([]);
      return;
    }

    const filtered = mutualUsers.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
    );

    setResults(filtered);

  }, [search, mutualUsers]);

  useEffect(() => {

    if (groupSearch.trim() === "") {
      setGroupResults([]);
      setGroupLoading(false);
      return;
    }

    const fetchGroups = async () => {

      setGroupLoading(true);

      try {

        const { data, error } = await supabaseGroup.
        from("groups").
        select("id,name,username,member_count,profile_photo").
        ilike("username", `%${groupSearch.toLowerCase()}%`).
        limit(10);

        if (error) throw error;

        setGroupResults(data || []);

      } catch (err) {
        console.log(err);
      }

      setGroupLoading(false);

    };

    fetchGroups();

  }, [groupSearch]);

  useEffect(() => {

    if (!myUid) return;

    const fetchMyGroups = async () => {

      setMyGroupsLoading(true);

      try {

        const { data: memberships, error } = await supabaseGroup.
        from("group_members").
        select("group_id").
        eq("uid", myUid);

        if (error) throw error;

        if (!memberships || memberships.length === 0) {
          setMyGroups([]);
          setMyGroupsLoading(false);
          return;
        }

        const groupIds = memberships.map((m) => m.group_id);

        const { data: groups, error: gErr } = await supabaseGroup.
        from("groups").
        select("*").
        in("id", groupIds);

        if (gErr) throw gErr;

        setMyGroups(groups || []);

      } catch (err) {
        console.log(err);
      }

      setMyGroupsLoading(false);

    };

    fetchMyGroups();

  }, [myUid]);

  useEffect(() => {

    const cached = localStorage.getItem("odoy_logo_cache");

    if (cached) {
      setOdoyLogo(cached);
      return;
    }

    fetch("https://odoy.in/logo/logo.png", { mode: "cors" }).
    then((res) => {

      if (!res.ok) throw new Error("logo fetch failed");

      return res.blob();

    }).
    then((blob) => {

      const reader = new FileReader();

      reader.onloadend = () => {

        try {
          localStorage.setItem("odoy_logo_cache", reader.result);
        } catch {}

        setOdoyLogo(reader.result);

      };

      reader.readAsDataURL(blob);

    }).
    catch(() => {
      setOdoyLogo("https://odoy.in/logo/logo.png");
    });

  }, []);

  function openOdoyChat() {

    const auth = Math.random().toString(36).substring(2, 14) + Date.now().toString(36);
    const sess = Math.random().toString(36).substring(2, 14) + Date.now().toString(36);

    sessionStorage.setItem("odoy_auth", auth);
    sessionStorage.setItem("odoy_sess", sess);

    navigate(`/odoy-chat?auth=${auth}&sess=${sess}`);

  }

  return (

    <>

<DashboardNav />

<div className="chats-page">

<div className="chats-title-wrap">
<button
            type="button"
            className={`chats-title chats-title-button ${showTitleMenu ? "open" : ""}`}
            onClick={() => setShowTitleMenu((prev) => !prev)}>
            
{activeView === "chats" ?
            <>
<span className="chats-c">C</span>
<span className="chats-rest">hats</span>
</> :

            <>
<span className="chats-c">G</span>
<span className="chats-rest">roups</span>
</>
            }

<FaChevronDown className="chats-title-chevron" />
</button>

{showTitleMenu &&
          <div className="chats-title-menu">
<button
              type="button"
              className={`chats-title-option ${activeView === "chats" ? "active" : ""}`}
              onClick={() => selectView("chats")}>
              
<span className="chats-title-option-icon">
<FaComments />
</span>
<span>Chats</span>
</button>

<button
              type="button"
              className={`chats-title-option ${activeView === "groups" ? "active" : ""}`}
              onClick={() => selectView("groups")}>
              
<span className="chats-title-option-icon">
<FaUsers />
</span>
<span>Groups</span>
</button>
</div>
          }
</div>

{showTitleMenu &&
        <div
          className="chats-title-backdrop"
          onClick={() => setShowTitleMenu(false)} />

        }

{activeView === "chats" &&
        <>
<div className="chats-stories-row">

{loading && Array.from({ length: 6 }).map((_, i) =>

            <div key={i} className="chat-story-item">

<div className="chat-avatar-wrapper">
<div className="chat-status-bubble skeleton-text"></div>
<div className="chat-story-avatar skeleton-avatar"></div>
</div>

<p className="skeleton-text" style={{ width: "40px" }}></p>

</div>

            )}

<div
              className="chat-story-item"
              onClick={() => navigate("/edit-profile")}>
              

<div className="chat-avatar-wrapper">

<div className="chat-status-bubble">
<b>
{myProfile.status && myProfile.status.trim() !== "" ? myProfile.status : "What u doin?"}
</b>
</div>

<div className="chat-story-avatar">
<img src={myProfile.photo} alt="profile" />
</div>

</div>

<p>You</p>

</div>

{!loading && statusUsers.map((user) =>

            <div
              key={user.uid}
              className="chat-story-item"
              onClick={() => openChat(user.username)}>
              

<div className="chat-avatar-wrapper">

<div className="chat-status-bubble">
{user.status}
</div>

<div className="chat-story-avatar">
<img src={user.photo} alt="profile" />
</div>

</div>

<p className="story-name">
<span>{user.name?.split(" ")[0]}</span>

{(user.role === "owner" || user.role === "friend" || user.role === "pookie" || user.role === "verified") &&
                <MdVerified
                  className="story-tick"
                  title={
                  user.role === "owner" ?
                  "Verified Owner" :
                  user.role === "friend" ?
                  "Sparse Project Teammate" :
                  user.role === "pookie" ?
                  "Loyal User" :
                  "Verified User"
                  } />

                }

</p>

</div>

            )}

</div>

<div className="chat-search-card">

<div className="chat-search-box">

<FaSearch className="chat-search-icon" />

<input
                type="text"
                placeholder="Search chats"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="chat-search-input" />
              

{search !== "" &&
              <FaTimes
                className="chat-search-clear"
                onClick={() => setSearch("")} />

              }

</div>

</div>

{!loading && search === "" &&
          <div className="chat-recents-header">
		<h3>Recents</h3>
	</div>
          }

{loading &&

          <div className="chat-list">

{Array.from({ length: 5 }).map((_, i) =>

            <div key={i} className="chat-user-card">

<div className="chat-user-row">

<div className="chat-user-avatar skeleton-avatar"></div>

<div className="chat-user-info">
<div className="skeleton-text name"></div>
<div className="skeleton-text username"></div>
</div>

</div>

</div>

            )}

</div>

          }

{search !== "" &&

          <div className="chat-search-results">

{results.map((user) =>

            <div
              key={user.uid}
              className="chat-user-card"
              onClick={() => openChat(user.username)}
              onContextMenu={(e) => openContext(e, user.username)}
              onTouchStart={(e) => startHold(e, user.username)}
              onTouchEnd={cancelHold}
              onTouchMove={cancelHold}>
              

<div className="chat-user-row">

<div className="chat-user-avatar">
<img src={user.photo} alt="profile" />

</div>

<div className="chat-user-info">

<div className="chat-title-row">

<div className="chat-name-row">
<span>{user.name}</span>

{(user.role === "owner" || user.role === "friend" || user.role === "pookie" || user.role === "verified") &&
                      <MdVerified
                        className="owner-tick"
                        title={
                        user.role === "owner" ?
                        "Verified Owner" :
                        user.role === "friend" ?
                        "Sparse Project Teammate" :
                        user.role === "pookie" ?
                        "Loyal User" :
                        "Verified User"
                        } />

                      }
</div>

<span className="chat-time">
{formatChatTime(user.lastTime)}
</span>

{user.unread > 0 &&
                    <div className="chat-unread-badge">
    {user.unread > 99 ? "99+" : user.unread}
  </div>
                    }

</div>

<p className="chat-last">

{user.lastSender === myUid ?

                    <>
<span className="chat-you">You:</span> {formatPreview(user.lastMessage)}

<span className={`chat-ticks ${user.lastSeen ? "seen" : "sent"}`}>
{user.lastSeen ? <FaCheckDouble /> : <FaCheck />}
</span>
</> :



                    <span className="received-msg">
{user.typing ? "typing..." : formatPreview(user.lastMessage) || `@${user.username}`}
</span>

                    }

</p>

</div>

</div>

</div>

            )}

{results.length === 0 &&

            <div className="chat-empty">
<p>No users found</p>
</div>

            }

</div>

          }

{!loading && search === "" && chatList.length > 0 &&

          <div className="chat-list">

<div
              className="chat-user-card odoy-card"
              onClick={openOdoyChat}>
              

<div className="chat-user-row">

<div className="chat-user-avatar">
<img src={odoyLogo} alt="Odoy AI" />
</div>

<div className="chat-user-info">

<h3>
Odoy AI
<MdVerified className="odoy-tick" />
</h3>

<p className="chat-last">
AI Assistant
</p>

</div>

<FaThumbtack className="chat-pin" />

</div>

</div>

{chatList.map((user) =>

            <div
              key={user.username}
              className="chat-user-card"
              onClick={() => openChat(user.username)}
              onContextMenu={(e) => openContext(e, user.username)}
              onTouchStart={(e) => startHold(e, user.username)}
              onTouchEnd={cancelHold}
              onTouchMove={cancelHold}>
              

<div className="chat-user-row">

<div className="chat-user-avatar">
<img src={user.photo} alt="profile" />

</div>

<div className="chat-user-info">

<div className="chat-title-row">

<div className="chat-name-row">
<span>{user.name}</span>

{(user.role === "owner" || user.role === "friend" || user.role === "pookie" || user.role === "verified") &&
                      <MdVerified
                        className="owner-tick"
                        title={
                        user.role === "owner" ?
                        "Verified Owner" :
                        user.role === "friend" ?
                        "Sparse Project Teammate" :
                        user.role === "pookie" ?
                        "Loyal User" :
                        "Verified User"
                        } />

                      }
</div>

<span className="chat-time">
{formatChatTime(user.lastTime)}
</span>

{user.unread > 0 &&
                    <div className="chat-unread-badge">
		{user.unread > 99 ? "99+" : user.unread}
	</div>
                    }

</div>

<p className="chat-last">

{user.lastSender === myUid ?

                    <>
<span className="chat-you">You:</span> {formatPreview(user.lastMessage)}

<span className={`chat-ticks ${user.lastSeen ? "seen" : "sent"}`}>
{user.lastSeen ? <FaCheckDouble /> : <FaCheck />}
</span>
</> :



                    <span className="received-msg">
{user.typing ? "typing..." : formatPreview(user.lastMessage) || `@${user.username}`}
</span>

                    }

</p>

</div>

</div>

</div>

            )}

</div>

          }

{!loading && search === "" && chatList.length === 0 &&

          <div className="chat-list">

<div
              className="chat-user-card odoy-card"
              onClick={openOdoyChat}>
              

<div className="chat-user-row">

<div className="chat-user-avatar">
<img src={odoyLogo} alt="Odoy AI" />
</div>

<div className="chat-user-info">

<h3>
Odoy AI
<MdVerified className="odoy-tick" />
</h3>

<p className="chat-last">
AI Assistant
</p>

</div>

<FaThumbtack className="chat-pin" />

</div>

</div>

<div className="chat-empty">

<FaComments className="chat-empty-icon" />

<p>No chats yet</p>
<span>Start chatting — search mutual followers</span>

</div>

</div>

          }

</>
        }

{activeView === "groups" &&
        <>

<div className="chat-search-card chat-groups-search-card">

<div className="chat-search-box">

<FaSearch className="chat-search-icon" />

<input
                type="text"
                placeholder="Search groups"
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                className="chat-search-input"
                disabled />
              

{groupSearch !== "" &&
              <FaTimes
                className="chat-search-clear"
                onClick={() => setGroupSearch("")} />

              }

</div>

</div>

{(groupViewLoading || groupLoading || myGroupsLoading) &&
          <div className="chat-list">
    <div className="chat-empty chat-groups-empty">
      <div className="chat-groups-empty-hero">
        <div className="chat-groups-empty-icon-wrap">
          <FaUsers className="chat-empty-icon chat-groups-empty-main-icon" />
        </div>
        <p>Groups not available yet</p><br />
        <span>Groups feature will be integrated soon. Stay tuned!</span>
      </div>
    </div>
  </div>
          }

{!groupViewLoading && !groupLoading && groupSearch !== "" &&
          <div className="chat-list">
    <div className="chat-empty">
      <p>Groups not available yet</p>
    </div>
  </div>
          }

{!groupViewLoading && groupSearch === "" &&
          <div className="chat-list">
    <div className="chat-empty chat-groups-empty">
      <div className="chat-groups-empty-hero">
        <div className="chat-groups-empty-icon-wrap">
          <FaUsers className="chat-empty-icon chat-groups-empty-main-icon" />
        </div>
        <p>Groups not available yet</p><br />
        <span>Groups feature will be integrated soon. Stay tuned!</span>
      </div>
    </div>
  </div>
          }

<button
            type="button"
            className="chat-groups-add-btn"
            onClick={() => window.showAlert?.("Groups feature will be available in future, not integrated yet", "info")}>
            
<FaPlus />
</button>

</>
        }

</div>

{menuChat &&

      <div
        className="chat-menu-overlay"
        onClick={() => setMenuChat(null)}>
        

<div
          className="chat-menu"
          style={{ top: menuPos.y, left: menuPos.x }}
          onClick={(e) => e.stopPropagation()}>
          

<button
            className="chat-menu-delete"
            onClick={() => deleteChat(menuChat)}>
            
Delete Chat
</button>

</div>

</div>

      }

<BottomNav />

</>);



}

export default Chats;