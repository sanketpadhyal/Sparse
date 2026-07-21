import "./ChatRoom.css";
import { FiArrowLeft, FiMoreVertical, FiSend } from "react-icons/fi";
import { MdVerified } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

function formatTime(ts) {
  const d = new Date(ts);
  const h = (d.getHours() + 11) % 12 + 1;
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = d.getHours() >= 12 ? "PM" : "AM";
  return `${h}:${m} ${ampm}`;
}

function formatDay(ts) {
  const d = new Date(ts);
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

export default function AIChat() {

  const navigate = useNavigate();
  const location = useLocation();

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("odoy_ai_chat");
    return saved ? JSON.parse(saved) : [
    { from: "ai", text: "Hey 👋 I am Odoy AI. Ask me anything!", ts: Date.now() }];

  });

  const [message, setMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [odoyLogo, setOdoyLogo] = useState(() => {
    const cached = localStorage.getItem("odoy_logo_cache");
    return cached || "/logo/logo.png";
  });

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

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

  useEffect(() => {
    document.body.classList.add("hide-navbar");
    return () => document.body.classList.remove("hide-navbar");
  }, []);

  useEffect(() => {
    window.isChatRoomOpen = true;

    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const isMobileViewport = window.matchMedia("(pointer: coarse), (max-width: 768px)").matches;

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
    const cached = localStorage.getItem("odoy_logo_cache");

    if (cached) {
      setOdoyLogo(cached);
      return;
    }

    fetch("https://odoy.in/logo/logo.png").
    then((r) => r.blob()).
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

  useEffect(() => {
    localStorage.setItem("odoy_ai_chat", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 200;
      }
    }, 50);
  }, [messages, typing]);

  useEffect(() => {
    if (message !== "") return;
    resizeTextarea(textareaRef.current, true);
  }, [message]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/home");
      }
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const urlAuth = params.get("auth");
    const urlSess = params.get("sess");

    const savedAuth = sessionStorage.getItem("odoy_auth");
    const savedSess = sessionStorage.getItem("odoy_sess");

    if (!urlAuth || !urlSess) {
      navigate("/dashboard");
      return;
    }

    if (urlAuth !== savedAuth || urlSess !== savedSess) {
      navigate("/dashboard");
    }

  }, [location, navigate]);

  const sendMessage = async () => {

    if (!message.trim()) return;

    const userMsg = {
      from: "user",
      text: message,
      ts: Date.now()
    };

    setMessages((prev) => [...prev, userMsg]);

    const userText = message;

    setMessage("");

    setTyping(true);

    try {

      const history = messages.slice(-10).map((m) => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text
      }));

      const res = await fetch(
        process.env.REACT_APP_ODOY_AI_URL || "https://your-ai-service.run.app/ai",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            history,
            message: userText
          })
        }
      );

      const data = await res.json();

      setTyping(false);

      const reply = (data?.reply || "AI did not respond.").
      replace(/\n{3,}/g, "\n\n").
      trim();

      setMessages((prev) => [
      ...prev,
      {
        from: "ai",
        text: reply,
        ts: Date.now()
      }]
      );

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });

    } catch {

      setTyping(false);

      setMessages((prev) => [
      ...prev,
      {
        from: "ai",
        text: "Server not responding.",
        ts: Date.now()
      }]
      );

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });

    }

  };

  const clearChat = () => {
    localStorage.removeItem("odoy_ai_chat");
    setMessages([]);
    setMenuOpen(false);
  };

  return (

    <section className="chatroom-page">

<div className="chatroom-topbar animate-topbar">

<div className="left-all">

<div className="left-section" onClick={() => navigate(-1)}>
<FiArrowLeft className="topbar-back-icon" />
</div>

<div className="topbar-user">
<img
              src={odoyLogo}
              className="topbar-photo"
              onClick={() => window.location.href = "https://odoy.in"}
              style={{ cursor: "pointer" }} />
            

<div className="user-txt">
<h3 className="odoy-title">
Odoy AI
<MdVerified className="odoy-ai-tick" />
</h3>

<div className="topbar-sub">
{typing ? "typing…" : "online"}
</div>

</div>
</div>

</div>

<FiMoreVertical
          className="topbar-menu-icon"
          onClick={() => setMenuOpen(!menuOpen)} />
        

</div>

{menuOpen &&

      <div className="poppup-menu fade-in">

<div className="popup-item" onClick={clearChat}>
Clear Chat
</div>

<div className="poppup-close" onClick={() => setMenuOpen(false)}>
Cancel
</div>

</div>

      }

<div className="chat-body" ref={scrollRef}>

{messages.map((msg, i) => {

          const prev = messages[i - 1];
          const showDay = !prev || formatDay(prev.ts) !== formatDay(msg.ts);
          const isMe = msg.from === "user";

          return (

            <div key={i}>

{showDay &&
              <>
<div className="date-divider">
<span>{formatDay(msg.ts)}</span>
</div>
<br />
</>
              }

<div className={`msg-row ${isMe ? "msg-me" : "msg-them"}`}>

{!isMe && <img src={odoyLogo} className="msg-avatar" />}

<div className={`msg-bubble ${isMe ? "bubble-me" : "bubble-them"}`}>
<div className="msg-text">{msg.text}</div>
<div className="msg-time">{formatTime(msg.ts)}</div>
</div>

</div>

</div>);



        })}

</div>

<div className="typing-bar">

<div className="typing-row">

<textarea
            ref={textareaRef}
            className="t-input"
            placeholder="Message…"
            rows="1"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
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
            onClick={sendMessage}>
            
<FiSend />
</button>

</div>

</div>

</section>);



}