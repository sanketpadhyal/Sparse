import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import DashboardNavbar from "../components/DashboardNavbar";
import BottomNav from "../components/BottomNav";

import { FaBell, FaTimes } from "react-icons/fa";
import { MdLogin } from "react-icons/md";

import "./Activity.css";

function formatActivityTime(time) {

  const date = new Date(time);
  const now = new Date();

  const today =
  date.getDate() === now.getDate() &&
  date.getMonth() === now.getMonth() &&
  date.getFullYear() === now.getFullYear();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
  date.getDate() === yesterday.getDate() &&
  date.getMonth() === yesterday.getMonth() &&
  date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });

  if (today) return `Today • ${timeStr}`;
  if (isYesterday) return `Yesterday • ${timeStr}`;

  return `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • ${timeStr}`;
}

function ActivityPage() {

  const navigate = useNavigate();

  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedAvatars, setLoadedAvatars] = useState({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleAvatarLoad = (i) => {
    setLoadedAvatars((prev) => ({ ...prev, [i]: true }));
  };

  useEffect(() => {

    window.scrollTo(0, 0);

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchActivity(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsub();

  }, []);

  const fetchActivity = async (uid) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        const data = snap.data();
        setActivity(data.activity || []);
      }
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const deleteNotification = async (index) => {
    try {
      const uid = auth.currentUser.uid;
      const newActivity = [...activity];
      newActivity.splice(index, 1);
      await updateDoc(doc(db, "users", uid), { activity: newActivity });
      setActivity(newActivity);
    } catch (err) {
      console.log(err);
    }
  };

  const clearAllActivity = async () => {
    try {
      const uid = auth.currentUser.uid;
      await updateDoc(doc(db, "users", uid), { activity: [] });
      setActivity([]);
      setShowClearConfirm(false);
    } catch (err) {
      console.log(err);
    }
  };

  return (

    <>

<DashboardNavbar />

<div className="activity-page">

{loading ?

        <div className="activity-loader">
{[1, 2, 3].map((i) =>
          <div key={i} className="activity-card-skeleton"></div>
          )}
</div> :



        <>

<div className="activity-header">

<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

<div className="activity-header-title">
<span className="activity-title-strong">A</span>
<span className="activity-title-light">ctivities</span>
</div>

{activity.length > 0 &&
              <button
                onClick={() => setShowClearConfirm(true)}
                style={{
                  fontSize: "12px",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "#ccc",
                  cursor: "pointer"
                }}>
                
Clear all
</button>
              }

</div>

{showClearConfirm &&

            <div style={{
              marginTop: "10px",
              display: "flex",
              gap: "10px",
              alignItems: "center"
            }}>

<span style={{ fontSize: "12px", color: "#aaa" }}>
Clear all notifications?
</span>

<button
                onClick={clearAllActivity}
                style={{
                  fontSize: "12px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#ff4d4d",
                  color: "#fff",
                  cursor: "pointer"
                }}>
                
Yes
</button>

<button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  fontSize: "12px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid #555",
                  background: "transparent",
                  color: "#ccc",
                  cursor: "pointer"
                }}>
                
No
</button>

</div>

            }

</div>

<div className="activity-feed">

{activity.length === 0 &&

            <div className="activity-empty">
<FaBell size={56} />
<div className="activity-empty-title">No notifications yet</div>
<div className="activity-empty-desc">
When someone interacts with your account it will appear here
</div>
</div>

            }

{activity.slice().reverse().map((a, i) => {

              const displayText = a.type === "login" ? "New login detected from browser" : a.text;

              return (

                <div
                  key={i}
                  className={`activity-card ${a.type === "follow" ? "activity-card-follow" : ""}`}
                  onClick={() => {

                    if (a.type === "login") {navigate("/devices");}
                    if (a.type === "follow") {navigate("/u/" + a.username);}
                    if (a.type === "post") {navigate("/u/" + a.username);}
                    if (a.type === "story") {navigate("/story-preview/" + a.username);}

                  }}>
                  

<div className="activity-card-left">

{a.type === "follow" || a.type === "post" || a.type === "like" || a.type === "comment" || a.type === "story" ?

                    <div className="activity-avatar-wrap">

{!loadedAvatars[i] &&
                      <div className="activity-avatar-skeleton"></div>
                      }

<img
                        src={a.photo || "/assets/profile.png"}
                        className="activity-avatar"
                        onLoad={() => handleAvatarLoad(i)}
                        style={{ opacity: loadedAvatars[i] ? 1 : 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/u/" + a.username);
                        }} />
                      

</div> :



                    <div className={`activity-icon activity-${a.type}`}>
{a.type === "login" ? <MdLogin /> : <FaBell />}
</div>

                    }

<div className="activity-content">

<div className="activity-text">{displayText}</div>

{(a.type === "post" || a.type === "like" || a.type === "comment") && a.caption &&
                      <div className="activity-caption">
{a.caption.length > 60 ? a.caption.slice(0, 60) + "..." : a.caption}
</div>
                      }

<div className="activity-time">
{formatActivityTime(a.time)}
</div>

</div>

</div>

<button
                    className="activity-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(activity.length - 1 - i);
                    }}>
                    
<FaTimes />
</button>

</div>);



            })}

</div>

</>

        }

</div>

<BottomNav />

</>);



}

export default ActivityPage;