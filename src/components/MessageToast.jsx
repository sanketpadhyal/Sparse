import { MdVerified } from "react-icons/md";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./MessageToast.css";

export default function MessageToast({ data, close }) {

  const startY = useRef(null);
  const navigate = useNavigate();
  const moved = useRef(false);

  useEffect(() => {

    if (!data) return;

    const timer = setTimeout(() => {
      close();
    }, 4000);

    return () => clearTimeout(timer);

  }, [data, close]);

  if (!data) return null;

  const showTick = ["owner", "friend", "pookie", "verified"].includes(data.role);

  function handleStart(e) {
    moved.current = false;
    startY.current = e.touches ? e.touches[0].clientY : e.clientY;
  }

  function handleMove(e) {

    if (startY.current === null) return;

    const currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const diff = startY.current - currentY;

    if (diff > 40) {
      moved.current = true;
      close();
      startY.current = null;
    }

  }

  function handleEnd() {
    startY.current = null;
  }

  return (

    <div
      className="msg-toast"
      onClick={() => {
        if (moved.current) return;

        if (data.text) {
          navigate(`/u/${data.username}`);
        } else {
          const session = Math.random().toString(36).substring(2, 12) + Date.now().toString(36);

          window.dispatchEvent(new CustomEvent("chatOpened", {
            detail: { username: data.username }
          }));

          navigate(`/chatroom?with=${data.username}&session=${session}`);
        }

        close();
      }}

      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}

      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}>
      

<img
        src={data.photo}
        className="msg-toast-avatar"
        alt="profile" />
      

<div className="msg-toast-info">

<div className="msg-toast-name">

{data.name}

{showTick &&
          <MdVerified className="msg-toast-tick" />
          }

</div>

<div className="msg-toast-text">
{data.text || "Got New Message"}
</div>

</div>

<button
        className="msg-toast-close"
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}>
        
✕
</button>

</div>);



}