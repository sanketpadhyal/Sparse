import "./ChatRoom.css";
import { FiArrowLeft, FiSend, FiGift, FiCamera } from "react-icons/fi";
import ChatMessage from "./ChatMessage";
import { MdVerified } from "react-icons/md";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { db, auth, storage } from "../firebase";
import { supabase, sendPushNotification } from "../supabase";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import {
  doc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  onSnapshot } from
"firebase/firestore";

function formatTime(dateString) {
  if (!dateString) return "";

  const d = new Date(dateString);

  const h = (d.getHours() + 11) % 12 + 1;
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = d.getHours() >= 12 ? "PM" : "AM";

  return `${h}:${m} ${ampm}`;
}

function formatDay(date) {
  if (!date) return null;

  const d = new Date(date);

  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);

  const same = (a, b) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

  if (same(d, today)) return "Today";
  if (same(d, y)) return "Yesterday";

  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ChatRoom() {

  const navigate = useNavigate();
  const [params] = useSearchParams();
  const friendUsername = params.get("with");

  const [myUid, setMyUid] = useState("");
  const [myName, setMyName] = useState("");
  const [friendUid, setFriendUid] = useState("");
  const [chatId, setChatId] = useState("");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [replyMsg, setReplyMsg] = useState(null);
  const [reactionMsg, setReactionMsg] = useState(null);
  const [typing, setTyping] = useState("");
  const [profilePic, setProfilePic] = useState("/assets/profile.png");
  const [fullName, setFullName] = useState(friendUsername);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState({});
  const [friendNotificationEnabled, setFriendNotificationEnabled] = useState(true);




  const [imagePreview, setImagePreview] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const prevMsgCount = useRef(0);
  const typingTimeout = useRef(null);
  const touchStartX = useRef(0);
  const swipeMsg = useRef(null);
  const holdTimer = useRef(null);
  const [sending, setSending] = useState(false);
  const [viewImage, setViewImage] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [showDesktopWarning, setShowDesktopWarning] = useState(false);


  function resizeTextarea(el, reset = false) {
    if (!el) return;

    if (reset) {
      el.style.height = `${el.offsetHeight}px`;

      requestAnimationFrame(() => {
        el.style.height = "40px";
      });

      return;
    }

    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  function handleImageLoad(id) {
    const el = scrollRef.current;
    if (!el) return;

    const prevHeight = el.scrollHeight;

    setLoadedImages((prev) => ({
      ...prev,
      [id]: true
    }));

    requestAnimationFrame(() => {
      const newHeight = el.scrollHeight;
      el.scrollTop += newHeight - prevHeight;
    });
  }

  useEffect(() => {
    window.isChatRoomOpen = true;

    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const isMobileViewport = window.matchMedia("(pointer: coarse), (max-width: 768px)").matches;

    setShowDesktopWarning(!isMobileViewport);

    const setViewportHeight = () => {
      const viewportHeight = isMobileViewport ?
      window.visualViewport?.height || window.innerHeight :
      window.innerHeight;

      const viewportOffsetTop = isMobileViewport ?
      window.visualViewport?.offsetTop || 0 :
      0;

      html.style.setProperty("--chatroom-vh", `${viewportHeight}px`);
      html.style.setProperty("--chatroom-offset-top", `${viewportOffsetTop}px`);
    };

    setViewportHeight();

    if (isMobileViewport) {
      html.classList.add("chatroom-open");
      body.classList.add("chatroom-open");
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
    }

    window.addEventListener("resize", setViewportHeight);
    if (isMobileViewport) {
      window.visualViewport?.addEventListener("resize", setViewportHeight);
      window.visualViewport?.addEventListener("scroll", setViewportHeight);
    }

    return () => {
      window.isChatRoomOpen = false;
      window.removeEventListener("resize", setViewportHeight);
      window.visualViewport?.removeEventListener("resize", setViewportHeight);
      window.visualViewport?.removeEventListener("scroll", setViewportHeight);
      html.classList.remove("chatroom-open");
      body.classList.remove("chatroom-open");
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      html.style.removeProperty("--chatroom-vh");
      html.style.removeProperty("--chatroom-offset-top");
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {

    function closeReaction() {
      setReactionMsg(null);
    }

    document.addEventListener("touchstart", closeReaction);
    document.addEventListener("click", closeReaction);

    return () => {
      document.removeEventListener("touchstart", closeReaction);
      document.removeEventListener("click", closeReaction);
    };

  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    if (message !== "") return;
    resizeTextarea(textareaRef.current, true);
  }, [message]);

  useEffect(() => {

    const handleResize = () => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    };

    window.visualViewport?.addEventListener("resize", handleResize);

    return () => window.visualViewport?.removeEventListener("resize", handleResize);

  }, []);

  useEffect(() => {

    let unsubscribe = null;

    const loadUser = async () => {

      const q = query(
        collection(db, "users"),
        where("username", "==", friendUsername)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {

        const docSnap = snap.docs[0];

        unsubscribe = onSnapshot(doc(db, "users", docSnap.id), (snapData) => {

          const data = snapData.data();

          setFullName(data.name || data.username);
          setProfilePic(data.profilePhoto || "/assets/profile.png");
          setRole(data.role || "");
          setFriendUid(docSnap.id);

          setFriendNotificationEnabled(data.notifications !== false);

        });

      }

    };

    loadUser();

    return () => {
      if (unsubscribe) unsubscribe();
    };

  }, [friendUsername]);

  useEffect(() => {
    const loadMe = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setMyUid(user.uid);
        setMyName(snap.data().name || snap.data().username);
      }
    };
    loadMe();
  }, []);

  useEffect(() => {
    if (myUid && friendUid) {
      setChatId([myUid, friendUid].sort().join("_"));
    }
  }, [myUid, friendUid]);

  const loadMessages = useCallback(async () => {

    if (!chatId) return;

    setLoading(true);

    const { data, error } = await supabase.
    from("messages").
    select("*").
    eq("chat_id", chatId).
    order("created_at", { ascending: true });

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setMessages(data || []);
    setLoading(false);

  }, [chatId]);

  useEffect(() => {

    if (!chatId) return;

    loadMessages(true);

    const channel = supabase.
    channel("chat-" + chatId).
    on("postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `chat_id=eq.${chatId}`
    },
    (payload) => {

      setMessages((prev) => {

        if (prev.some((m) => m.id === payload.new.id)) return prev;

        const updated = [...prev, payload.new];
        updated.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        return updated;

      });

    }).
    on("postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "messages",
      filter: `chat_id=eq.${chatId}`
    },
    (payload) => {

      setMessages((prev) =>
      prev.map((m) =>
      m.id === payload.new.id ? payload.new : m
      )
      );

    }).
    subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [chatId, myUid, loadMessages]);



  async function handleTyping(value) {

    setMessage(value);

    await supabase.
    from("typing").
    upsert({
      chat_id: chatId,
      username: myUid,
      typing: true
    });

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(async () => {

      await supabase.
      from("typing").
      upsert({
        chat_id: chatId,
        username: myUid,
        typing: false
      });

    }, 1200);

  }

  useEffect(() => {

    if (!chatId) return;

    const channel = supabase.
    channel("typing-" + chatId).
    on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "typing",
        filter: `chat_id=eq.${chatId}`
      },
      (payload) => {
        if (payload.new.username !== myUid && payload.new.typing) {
          setTyping(payload.new.username);
        } else {
          setTyping("");
        }
      }
    ).
    subscribe();

    return () => supabase.removeChannel(channel);

  }, [chatId, myUid]);

  useEffect(() => {

    if (!chatId || !myUid) return;

    const unseen = messages.filter((m) =>
    m.sender !== myUid && !m.seen
    );

    if (unseen.length === 0) return;

    const markSeen = async () => {
      const ids = unseen.map((m) => m.id);
      await supabase.
      from("messages").
      update({ seen: true }).
      in("id", ids);
    };

    markSeen();

  }, [messages, chatId, myUid]);

  const sendMessage = async () => {

    if (!chatId) return;
    if (message.trim() === "" && !imagePreview) return;
    if (sending) return;

    setSending(true);

    const meSnap = await getDoc(doc(db, "users", myUid));
    const myFollowing = meSnap.data().followingList || [];

    const friendSnap = await getDoc(doc(db, "users", friendUid));
    const theirFollowing = friendSnap.data().followingList || [];

    const isMutual =
    myFollowing.includes(friendUid) &&
    theirFollowing.includes(myUid);

    if (!isMutual) {
      window.showAlert?.("Follow each other to chat", "error");
      setSending(false);
      return;
    }

    let imageUrl = null;

    if (imagePreview) {
      imageUrl = await uploadChatImage();
    }

    const tempId = "temp-" + Date.now();

    const tempMsg = {
      id: tempId,
      chat_id: chatId,
      sender: myUid,
      text: message.trim(),
      image: imageUrl,
      created_at: new Date().toISOString(),
      seen: false,
      status: "sending"
    };

    setMessages((prev) => [...prev, tempMsg]);
    setMessage("");
    setReplyMsg(null);
    setImagePreview(null);

    const { data, error } = await supabase.
    from("messages").
    insert({
      chat_id: chatId,
      sender: myUid,
      text: tempMsg.text,
      image: imageUrl,
      reply_to: replyMsg ? replyMsg.text : null
    }).
    select().
    single();

    setSending(false);

    if (error) {
      setMessages((prev) =>
      prev.map((m) =>
      m.id === tempId ? { ...m, status: "failed" } : m
      )
      );
      return;
    }

    setMessages((prev) =>
    prev.map((m) =>
    m.id === tempId ?
    { ...data, status: "sent" } :
    m
    )
    );

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });

    if (friendUid && friendNotificationEnabled) {
      sendPushNotification({
        receiver_uid: friendUid,
        sender_name: myName || "Someone",
        message: tempMsg.text || "Sent a photo 📷"
      });
    }

  };

  function handleTouchStart(e, msg) {
    touchStartX.current = e.touches[0].clientX;
    swipeMsg.current = msg;
  }

  function handleTouchMove(e) {

    if (!swipeMsg.current) return;

    const dx = e.touches[0].clientX - touchStartX.current;

    const row = e.currentTarget;

    if (dx > 0 && dx < 120) {
      row.style.transform = `translateX(${dx}px)`;
    }

  }

  function handleTouchEnd(e) {

    const row = e.currentTarget;
    const dx = row.style.transform.replace("translateX(", "").replace("px)", "");

    row.style.transform = "";

    if (dx > 70) {
      setReplyMsg(swipeMsg.current);
    }

    swipeMsg.current = null;

  }

  function handleHoldStart(msg) {
    holdTimer.current = setTimeout(() => {
      setReactionMsg(msg);
    }, 600);
  }

  function handleHoldEnd() {
    clearTimeout(holdTimer.current);
  }

  async function sendReaction(emoji) {

    if (!reactionMsg) return;

    setMessages((prev) =>
    prev.map((m) =>
    m.id === reactionMsg.id ?
    { ...m, reaction: emoji } :
    m
    )
    );

    await supabase.
    from("messages").
    update({ reaction: emoji }).
    eq("id", reactionMsg.id);

    setReactionMsg(null);

  }

  function openImagePicker() {
    fileInputRef.current.click();
  }

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setImageLoaded(false);

    e.target.value = "";
  }

  async function uploadChatImage() {

    if (!imagePreview) return null;

    const response = await fetch(imagePreview);
    const blob = await response.blob();

    const id = Date.now();

    const storageRef = ref(storage, `chat_images/${chatId}/${id}`);

    await uploadBytes(storageRef, blob);

    const url = await getDownloadURL(storageRef);

    return url;
  }

  return (

    <section className="chatroom-page">

<div className="chatroom-topbar">

<div className="left-all">

<div className="left-section" onClick={() => navigate(-1)}>
<FiArrowLeft className="topbar-back-icon" />
</div>

<div className="topbar-user">

<img
              src={profilePic}
              className="topbar-photo"
              alt="profile"
              onClick={() => navigate(`/u/${friendUsername}`)}
              style={{ cursor: "pointer" }} />
            

<div className="user-txt">

<h3>
{fullName}
{(role === "owner" || role === "friend" || role === "pookie" || role === "verified") &&
                <MdVerified className="chat-verified" />
                }
</h3>

<div className="topbar-sub">
{typing === friendUid ? "typing..." : `@${friendUsername}`}
</div>

</div>

</div>

</div>

<button
          className="gift-btn"
          onClick={() => {
            window.showAlert?.("🎁 Gift feature coming soon", "alert");
          }}>
          
<FiGift />
</button>

</div>

<div className="chat-body" ref={scrollRef}>

{loading &&
        <>

<div className="skeleton-day"></div>
<div className="skeleton-msg left"></div>
<div className="skeleton-msg right"></div>
</>
        }

{}

{!loading && messages.length === 0 &&
        <div className="empty-chat">
<span>No chat yet</span>
<p>Send a message to start the conversation</p>
</div>
        }


{!loading && messages.map((msg, i) => {

          const prev = messages[i - 1];
          const isMe = msg.sender === myUid;

          return (
            <ChatMessage
              key={msg.id}
              msg={msg}
              prev={prev}
              isMe={isMe}
              profilePic={profilePic}
              formatDay={formatDay}
              formatTime={formatTime}
              loadedImages={loadedImages}
              handleImageLoad={handleImageLoad}
              setViewImage={setViewImage}
              setViewerLoading={setViewerLoading}
              reactionMsg={reactionMsg}
              sendReaction={sendReaction}
              handleTouchStart={handleTouchStart}
              handleTouchMove={handleTouchMove}
              handleTouchEnd={handleTouchEnd}
              handleHoldStart={handleHoldStart}
              handleHoldEnd={handleHoldEnd}
              setReplyMsg={setReplyMsg}
              setReactionMsg={setReactionMsg} />);



        })}

</div>

<div className="typing-bar">

{imagePreview &&

        <div className="image-preview-bar">

<div className="preview-wrap">

<img src={imagePreview} className="preview-img" alt="" onLoad={() => setImageLoaded(true)} />

{(sending || imagePreview && !imageLoaded) &&
            <div className="preview-loader">
<div className="loader"></div>
</div>
            }

</div>

<button
            className="preview-remove"
            onClick={() => !sending && setImagePreview(null)}>
            
✕
</button>

</div>

        }

{replyMsg &&

        <div className="reply-preview">

<div className="reply-text">
Replying to: {replyMsg.text}
</div>

<div className="reply-cancel" onClick={() => setReplyMsg(null)}>
✕
</div>

</div>

        }

<div className="typing-row">

<button
            className="t-btn attach-btn"
            onClick={openImagePicker}>
            
<FiCamera />
</button>

<input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageSelect}
            style={{ display: "none" }} />
          

<textarea
            ref={textareaRef}
            className="t-input"
            placeholder="Message…"
            rows="1"
            value={message}
            onChange={(e) => {
              handleTyping(e.target.value);
              resizeTextarea(e.target);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }} />
          

<button
            className="t-btn send-btn"
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={sendMessage}
            disabled={sending || imagePreview && !imageLoaded}
            style={{ opacity: sending || imagePreview && !imageLoaded ? 0.5 : 1 }}>
            
<FiSend />
</button>

</div>

</div>

{viewImage &&
      <div className="image-viewer" onClick={() => setViewImage(null)}>

{viewerLoading &&
        <div className="viewer-skeleton"></div>
        }

<img
          src={viewImage}
          className="image-viewer-img"
          onLoad={() => setViewerLoading(false)}
          style={{
            opacity: viewerLoading ? 0 : 1,
            transition: "opacity .3s ease"
          }} />
        

</div>
      }

{showDesktopWarning &&
      <div className="chatroom-desktop-warning">
<div className="chatroom-desktop-warning-card">
<h3>Better On Mobile</h3>
<p>
For a good experience, try chatting on mobile. On PC, chat scrolling is currently not working properly.
</p>
<button
            className="chatroom-desktop-warning-btn"
            onClick={() => setShowDesktopWarning(false)}>
            
OK
</button>
</div>
</div>
      }

</section>);







}