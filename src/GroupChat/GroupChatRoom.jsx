import "./GroupChatRoom.css";
import { FiArrowLeft, FiSend, FiCheck, FiClock, FiCamera } from "react-icons/fi";
import { FaUsers } from "react-icons/fa";
import { MdErrorOutline } from "react-icons/md";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db, storage } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { supabaseGroup } from "../supabaseGroup";
const userProfileCache = new Map();

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
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";

  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function GroupChatRoom() {

  const navigate = useNavigate();
  const { username } = useParams();

  const [group, setGroup] = useState(null);
  const [myUid, setMyUid] = useState("");
  const [myName, setMyName] = useState("");
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [imagePreview, setImagePreview] = useState(null);

  const [typingUsers, setTypingUsers] = useState([]);

  const [selectedMsg, setSelectedMsg] = useState(null);
  const holdTimer = useRef(null);

  const [loadedImages, setLoadedImages] = useState({});

  const [replyMsg, setReplyMsg] = useState(null);

  const [imagePreviews, setImagePreviews] = useState([]);
  const [showDesktopWarning, setShowDesktopWarning] = useState(false);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);

  const messageQueue = useRef([]);
  const flushTimer = useRef(null);

  const memberMap = members.reduce((acc, member) => {
    acc[member.uid] = member;
    return acc;
  }, {});

  const typingNames = typingUsers.
  map((u) => memberMap[u.uid]?.name || memberMap[u.uid]?.username).
  filter(Boolean);

  const typingText = (() => {
    const total = typingUsers.length;
    if (total === 0) return null;

    const names = typingUsers.
    map((u) => memberMap[u.uid]?.name || memberMap[u.uid]?.username).
    filter(Boolean);

    if (names.length === 0) return null;

    if (total === 1) {
      return `${names[0]} typing...`;
    }

    if (total === 2) {
      return `${names[0]}, ${names[1]} typing...`;
    }

    const first = names[0];
    const second = names[1];

    const latestUser = typingUsers.
    slice().
    sort((a, b) => b.time - a.time)[0];

    const latestName = memberMap[latestUser.uid]?.name || memberMap[latestUser.uid]?.username;

    if (!latestName || latestName === first || latestName === second) {
      return `${first}, ${second} +${total - 2} typing...`;
    }

    return `${first}, ${second}, ${latestName} +${total - 3} typing...`;
  })();

  const resizeTextarea = useCallback((el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  useEffect(() => {
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

      html.style.setProperty("--groupchat-vh", `${viewportHeight}px`);
      html.style.setProperty("--groupchat-offset-top", `${viewportOffsetTop}px`);
    };

    setViewportHeight();

    if (isMobileViewport) {
      html.classList.add("groupchat-open");
      body.classList.add("groupchat-open");
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
      window.removeEventListener("resize", setViewportHeight);
      window.visualViewport?.removeEventListener("resize", setViewportHeight);
      window.visualViewport?.removeEventListener("scroll", setViewportHeight);
      html.classList.remove("groupchat-open");
      body.classList.remove("groupchat-open");
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      html.style.removeProperty("--groupchat-vh");
      html.style.removeProperty("--groupchat-offset-top");
      window.scrollTo(0, scrollY);
    };
  }, []);

  function openImagePicker() {
    fileInputRef.current.click();
  }

  function handleImageSelect(e) {
    const files = Array.from(e.target.files).slice(0, 4);

    const previews = files.map((file) => URL.createObjectURL(file));

    setImagePreviews(previews);
  }

  async function handleTyping(value) {

    setMessage(value);

    if (!group?.id || !myUid) return;

    await supabaseGroup.
    from("group_typing").
    upsert({
      group_id: group.id,
      user_id: myUid,
      updated_at: new Date().toISOString()
    });

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(async () => {
      await supabaseGroup.
      from("group_typing").
      upsert({
        group_id: group.id,
        user_id: myUid,
        updated_at: null
      });
    }, 2000);

  }

  function handleHoldStart(msg) {
    holdTimer.current = setTimeout(() => {
      setSelectedMsg(msg);
    }, 600);
  }

  function handleHoldEnd() {
    clearTimeout(holdTimer.current);
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

  function scrollToMessage(id) {
    const el = document.getElementById("msg-" + id);
    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    el.classList.add("highlight-msg");

    setTimeout(() => {
      el.classList.remove("highlight-msg");
    }, 1500);
  }

  useEffect(() => {
    const loadMe = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setMyUid(user.uid);

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setMyName(data.name || data.username || "You");
      }
    };

    loadMe();
  }, []);

  const loadGroup = useCallback(async () => {

    if (!username) return;

    setLoading(true);
    setError("");

    try {
      const { data: groupData, error: groupError } = await supabaseGroup.
      from("groups").
      select("id,name,username,profile_photo,member_count,owner_uid").
      eq("username", username).
      maybeSingle();

      if (groupError) throw groupError;
      if (!groupData) {
        setError("Group not found");
        setLoading(false);
        return;
      }

      setGroup(groupData);

      const { data: memberRows, error: memberError } = await supabaseGroup.
      from("group_members").
      select("uid,role").
      eq("group_id", groupData.id);

      if (memberError) throw memberError;

      const resolvedMembers = await Promise.all(
        (memberRows || []).map(async (member) => {
          try {
            let data = userProfileCache.get(member.uid);

            if (!data) {
              const snap = await getDoc(doc(db, "users", member.uid));
              data = snap.exists() ? snap.data() : {};
              userProfileCache.set(member.uid, data);
            }

            return {
              uid: member.uid,
              role: member.role || "member",
              name: data.name || data.username || "Unknown User",
              username: data.username || "unknown",
              photo: data.profilePhoto || "/assets/profile.png"
            };
          } catch {
            return {
              uid: member.uid,
              role: member.role || "member",
              name: "Unknown User",
              username: "unknown",
              photo: "/assets/profile.png"
            };
          }
        })
      );

      setMembers(resolvedMembers);

      const { data: messageRows, error: messageError } = await supabaseGroup.
      from("group_messages").
      select("*").
      eq("group_id", groupData.id).
      order("created_at", { ascending: true });

      if (messageError) throw messageError;

      if (messageRows.length === 0) {
        setMessages([]);
      } else {
        setMessages(messageRows);
      }
    } catch (err) {
      console.log(err);
      setError("Failed to load group");
    } finally {
      setLoading(false);
    }

  }, [username]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  useEffect(() => {
    if (!group?.id) return;

    const channel = supabaseGroup.
    channel("group-room-" + group.id).
    on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "group_messages",
      filter: `group_id=eq.${group.id}`
    }, (payload) => {

      messageQueue.current.push(payload.new);

      if (!flushTimer.current) {
        flushTimer.current = setTimeout(() => {

          setMessages((prev) => {
            const combined = [...prev, ...messageQueue.current];

            const unique = combined.filter(
              (msg, index, self) =>
              index === self.findIndex((m) => m.id === msg.id)
            );

            messageQueue.current = [];
            flushTimer.current = null;

            return unique.sort(
              (a, b) => new Date(a.created_at) - new Date(b.created_at)
            );
          });

        }, 16);
      }

    }).
    on("postgres_changes", {
      event: "UPDATE",
      schema: "public",
      table: "group_messages",
      filter: `group_id=eq.${group.id}`
    }, (payload) => {
      setMessages((prev) => prev.map((msg) => msg.id === payload.new.id ? payload.new : msg));
    }).
    on("postgres_changes", {
      event: "DELETE",
      schema: "public",
      table: "group_messages",
      filter: `group_id=eq.${group.id}`
    }, (payload) => {

      setMessages((prev) =>
      prev.filter((msg) => msg.id !== payload.old.id)
      );

    }).
    subscribe((status) => {
      console.log("MSG CHANNEL:", status);
    });

    return () => supabaseGroup.removeChannel(channel);
  }, [group?.id]);

  useEffect(() => {

    if (!group?.id || !myUid) return;

    const channel = supabaseGroup.
    channel("group-typing-" + group.id).
    on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "group_typing",
      filter: `group_id=eq.${group.id}`
    }, (payload) => {

      const data = payload.new;
      if (!data) return;
      if (data.user_id === myUid) return;

      setTypingUsers((prev) => {
        const now = Date.now();


        if (data.updated_at === null) {
          return prev.filter((u) => u.uid !== data.user_id);
        }

        const updated = [...prev.filter((u) => now - u.time < 2000)];

        const exists = updated.find((u) => u.uid === data.user_id);

        if (exists) {
          exists.time = now;
        } else {
          updated.push({ uid: data.user_id, time: now });
        }

        return updated;
      });

    }).
    subscribe((status) => {
      console.log("TYPING CHANNEL:", status);
    });

    return () => supabaseGroup.removeChannel(channel);

  }, [group?.id, myUid]);

  useEffect(() => {

    const interval = setInterval(() => {

      setTypingUsers((prev) =>
      prev.filter((u) => Date.now() - u.time < 2000)
      );

    }, 1000);

    return () => clearInterval(interval);

  }, []);

  useEffect(() => {

    if (!group?.id || !myUid) return;

    const unseen = messages.filter((m) =>
    !m.seen_by?.includes(myUid)
    );

    if (unseen.length === 0) return;

    const markSeen = async () => {

      const ids = unseen.map((m) => m.id);

      await supabaseGroup.
      from("group_messages").
      update({
        seen_by: supabaseGroup.rpc ?
        undefined :
        null
      });

      for (const msg of unseen) {
        await supabaseGroup.
        from("group_messages").
        update({
          seen_by: [...(msg.seen_by || []), myUid]
        }).
        eq("id", msg.id);
      }

    };

    markSeen();

  }, [messages, group?.id, myUid]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => el.scrollTop = el.scrollHeight);
  }, [messages.length]);

  useEffect(() => {
    if (message !== "") return;
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "40px";
  }, [message]);

  useEffect(() => {
    const handleResize = () => {
      const el = scrollRef.current;
      if (!el) return;
      requestAnimationFrame(() => el.scrollTop = el.scrollHeight);
    };

    window.visualViewport?.addEventListener("resize", handleResize);

    return () => window.visualViewport?.removeEventListener("resize", handleResize);
  }, []);

  async function sendMessage() {
    if (!group?.id || !myUid) return;
    if (!message.trim() && imagePreviews.length === 0 || sending) return;

    setSending(true);

    let imageUrls = [];

    for (const preview of imagePreviews) {
      try {
        const blob = await fetch(preview).then((r) => r.blob());
        const id = Date.now() + Math.random();

        const storageRef = ref(storage, `group_images/${group.id}/${id}`);

        await uploadBytes(storageRef, blob);

        const url = await getDownloadURL(storageRef);

        imageUrls.push(url);
      } catch (err) {
        console.log("UPLOAD FAILED:", err);
      }
    }

    const tempId = "temp-" + Date.now();
    const tempMsg = {
      id: tempId,
      group_id: group.id,
      sender_uid: myUid,
      text: message.trim(),
      image: imageUrls,
      reply_to: replyMsg ? replyMsg.id : null,
      created_at: new Date().toISOString(),
      status: "sending",
      seen_by: [myUid]
    };

    setMessages((prev) => [...prev, tempMsg]);
    setMessage("");
    setImagePreviews([]);
    setReplyMsg(null);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "40px";
        textareaRef.current.focus();
      }
    });

    const { data, error: sendError } = await supabaseGroup.
    from("group_messages").
    insert({
      group_id: group.id,
      sender_uid: myUid,
      text: tempMsg.text,
      image: imageUrls,
      reply_to: replyMsg ? replyMsg.id : null,
      seen_by: [myUid]
    }).
    select().
    single();

    if (sendError) {
      console.log(sendError);
      setMessages((prev) =>
      prev.map((msg) =>
      msg.id === tempId ?
      { ...msg, status: "failed" } :
      msg
      )
      );
      window.showAlert?.("Failed to send message", "error");
      setSending(false);
      return;
    }

    setMessages((prev) =>
    prev.map((msg) =>
    msg.id === tempId ?
    { ...data, status: "sent" } :
    msg
    )
    );
    setSending(false);

    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }, 50);
  }

  async function deleteForEveryone() {

    if (!selectedMsg) return;

    if (String(selectedMsg.id).startsWith("temp-")) {
      setMessages((prev) => prev.filter((m) => m.id !== selectedMsg.id));
      setSelectedMsg(null);
      return;
    }

    const isOwner = group?.owner_uid === myUid;

    const { error } = await supabaseGroup.
    from("group_messages").
    update({
      deleted: true,
      deleted_by: isOwner ? "admin" : "user"
    }).
    eq("id", selectedMsg.id);

    if (error) {
      console.log("DELETE ERROR:", error);
      window.showAlert?.("Delete failed", "error");
      return;
    }

    setMessages((prev) => prev.map((m) => m.id === selectedMsg.id ? { ...m, deleted: true, deleted_by: isOwner ? "admin" : "user" } : m));

    setSelectedMsg(null);

  }

  return (
    <section className="groupchat-page">

<div className="groupchat-topbar">

<div className="groupchat-topbar-left">
<button
            type="button"
            className="groupchat-back-btn"
            onClick={() => navigate(-1)}>
            
<FiArrowLeft />
</button>

<button
            type="button"
            className="groupchat-group-link"
            onClick={() => navigate(`/group/${username}/info`)}>
            
{group?.profile_photo ?
            <img src={group.profile_photo} alt="group" className="groupchat-photo" /> :

            <div className="groupchat-photo groupchat-photo-fallback">
<FaUsers />
</div>
            }

<div className="groupchat-group-copy">
<h3>{group?.name || "Group"}</h3>
<div className="groupchat-subline">
{typingText || `${group?.member_count || members.length || 0} members`}
</div>
</div>
</button>
</div>
</div>

<div className="groupchat-body" ref={scrollRef}>

{loading &&
        <>
<div className="groupchat-skeleton-day"></div>
<div className="groupchat-skeleton-msg left"></div>
<div className="groupchat-skeleton-msg right"></div>
<div className="groupchat-skeleton-msg left short"></div>
</>
        }

{!loading && error &&
        <div className="groupchat-empty">
<span>{error}</span>
</div>
        }

{!loading && !error && messages.length === 0 &&
        <div className="groupchat-empty">
<span>No messages yet</span>
<p>{myName ? `${myName}, start the conversation.` : "Start the conversation."}</p>
</div>
        }

{!loading && !error && messages.map((msg, index) => {
          const prev = messages[index - 1];

          const repliedMessage = messages.find((m) => m.id === msg.reply_to);

          const isMe = (msg.sender_uid || msg.sender) === myUid;
          const senderId = msg.sender_uid || msg.sender;

          const showAvatar = !isMe;
          const showName = !isMe;

          const sender = memberMap[senderId];

          const currentDay = formatDay(msg.created_at);
          const prevDay = prev ? formatDay(prev.created_at) : null;

          return (
            <div id={"msg-" + msg.id} key={msg.id}>

{currentDay !== prevDay &&
              <div className="groupchat-date-divider">
<span>{currentDay}</span>
</div>
              }

<div className={`groupchat-row ${isMe ? "me" : "them"}`}
              onTouchStart={() => handleHoldStart(msg)}
              onTouchEnd={handleHoldEnd}
              onMouseDown={() => handleHoldStart(msg)}
              onMouseUp={handleHoldEnd}>
                

{showAvatar ?
                <img
                  src={sender?.photo || "/assets/profile.png"}
                  alt="member"
                  className="groupchat-avatar" /> :


                <div className="groupchat-avatar-spacer"></div>
                }

<div className={`groupchat-bubble-stack ${isMe ? "me" : "them"}`}>
<div
                    className={`groupchat-bubble ${isMe ? "me" : "them"}`}>
                    

{showName &&
                    <div className="groupchat-sender-name">
{sender?.name || sender?.username}
</div>
                    }

{msg.reply_to &&
                    <div
                      className="reply-bubble"
                      onClick={() => scrollToMessage(msg.reply_to)}
                      style={repliedMessage?.deleted ? { opacity: 0.7 } : {}}>
                      
    {repliedMessage?.deleted ?
                      "Deleted message" :
                      repliedMessage?.text || "Photo"}
  </div>
                    }

{msg.deleted ?
                    <div className="groupchat-deleted">
{msg.deleted_by === "admin" ?
                      "This message was deleted by admin" :
                      "This message was deleted"}
</div> :

                    <>
{Array.isArray(msg.image) && msg.image.length > 0 &&
                      <div className="msg-image-grid">
    {msg.image.map((img, i) =>
                        <div key={i} className="msg-image-wrap">
        {!loadedImages[msg.id + '-' + i] &&
                          <div className="msg-image-skeleton"></div>
                          }
        <img
                            src={img}
                            alt=""
                            className="msg-image"
                            onLoad={() => handleImageLoad(msg.id + '-' + i)}
                            style={{
                              opacity: loadedImages[msg.id + '-' + i] ? 1 : 0
                            }} />
                          
      </div>
                        )}
  </div>
                      }

{msg.text &&
                      <div className="groupchat-message-text">
{msg.text}
</div>
                      }
</>
                    }

<div className="groupchat-meta">
{formatTime(msg.created_at)}

{isMe &&
                      <span className="msg-status-text">
{msg.status === "sending" && <FiClock />}
{msg.status === "failed" && "Failed"}

{msg.status === "sent" && (
                        msg.seen_by?.length > 1 ?
                        "Seen" :
                        "Sent")
                        }
</span>
                      }
</div>

</div>

</div>

</div>

</div>);

        })}

</div>

<div className="groupchat-composer">
{replyMsg &&
        <div className="reply-preview">

    <div
            className="reply-text"
            onClick={() => scrollToMessage(replyMsg.id)}>
            
      Replying to: {
            replyMsg.deleted ?
            "Deleted message" :
            replyMsg.text || (Array.isArray(replyMsg.image) ? "Photo" : "Message")
            }
    </div>

    <div
            className="reply-cancel"
            onClick={() => setReplyMsg(null)}>
            
      ✕
    </div>

  </div>
        }

{imagePreviews.length > 0 &&
        <div className="groupchat-preview-bar">
<div className="groupchat-preview-card">
<div className="preview-images">
  {imagePreviews.map((preview, i) =>
              <img key={i} src={preview} alt="" className="groupchat-preview-image" />
              )}
</div>
{sending &&
            <div className="preview-loader">
    <div className="loader"></div>
  </div>
            }
<div className="groupchat-preview-copy">
<strong>{imagePreviews.length} photo{imagePreviews.length > 1 ? 's' : ''} ready</strong>
<span>It will be sent with your next message.</span>
</div>
</div>

<button
            type="button"
            className="groupchat-preview-remove"
            onClick={() => setImagePreviews([])}
            disabled={sending}>
            
Remove
</button>
</div>
        }

<div className="groupchat-composer-row">

<button
            type="button"
            onClick={openImagePicker}
            className="groupchat-image-btn">
            
<FiCamera />
</button>

<textarea
            ref={textareaRef}
            className="groupchat-input"
            placeholder="Message..."
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
          

<input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={handleImageSelect}
            accept="image/*"
            style={{ display: 'none' }} />
          

<button
            type="button"
            className="groupchat-send-btn"
            onClick={sendMessage}
            disabled={sending}>
            
<FiSend />
</button>
</div>
</div>





{selectedMsg &&
      <div className="msg-action-overlay" onClick={() => setSelectedMsg(null)}>

<div className="msg-action-sheet" onClick={(e) => e.stopPropagation()}>

{(selectedMsg.sender_uid === myUid || group?.owner_uid === myUid) &&
          <button
            className="msg-action-delete"
            onClick={deleteForEveryone}>
            
Delete message
</button>
          }

<button
            className="msg-action-reply"
            onClick={() => {setReplyMsg(selectedMsg);setSelectedMsg(null);}}>
            
Reply
</button>

<button
            className="msg-action-cancel"
            onClick={() => setSelectedMsg(null)}>
            
Cancel
</button>

</div>

</div>
      }

{showDesktopWarning &&
      <div className="groupchat-desktop-warning">
<div className="groupchat-desktop-warning-card">
<h3>Best on mobile</h3>
<p>
For a good experience, try chatting on mobile. On PC, group chat scrolling is currently not working properly.
</p>
<button
            type="button"
            className="groupchat-desktop-warning-btn"
            onClick={() => setShowDesktopWarning(false)}>
            
Continue anyway
</button>
</div>
</div>
      }

</section>);


}