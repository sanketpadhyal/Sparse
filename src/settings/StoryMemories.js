import DashboardNavbar from "../components/DashboardNavbar";
import BottomNav from "../components/BottomNav";
import "./Settings.css";

import { useNavigate } from "react-router-dom";
import { useLayoutEffect, useEffect, useState } from "react";

import { FaArrowLeft, FaHistory, FaRedo } from "react-icons/fa";

import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function StoryMemories() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [photo, setPhoto] = useState("");
  const [stories, setStories] = useState([]);
  const [loaded, setLoaded] = useState({});

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        navigate("/home");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setName(data.name || "");
        setUsername(data.username || "");
        setPhoto(data.profilePhoto || "");
      }

      const q = query(
        collection(db, "stories"),
        where("uid", "==", user.uid)
      );

      const snap = await getDocs(q);

      const arr = [];

      snap.forEach((doc) => {
        arr.push(doc.data());
      });

      arr.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setStories(arr);
      setLoading(false);

    });

    return () => unsubscribe();

  }, [navigate]);

  const timeAgo = (timestamp) => {

    if (!timestamp) return "Unknown";

    const now = Date.now();
    const diff = now - timestamp.seconds * 1000;

    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 60) return mins + "m ago";
    if (hours < 24) return hours + "h ago";
    return days + "d ago";

  };

  const formatDate = (timestamp) => {
    if (!timestamp) return null;

    const d = new Date(timestamp.seconds * 1000);
    return {
      day: d.toLocaleDateString("en-GB", { day: "2-digit" }),
      month: d.toLocaleDateString("en-GB", { month: "short" }),
      year: d.toLocaleDateString("en-GB", { year: "numeric" })
    };
  };

  const openEditor = (story) => {

    navigate("/story-editor", {
      state: {
        image: story.mediaType === "image" ? story.media : null,
        video: story.mediaType === "video" ? story.media : null,
        quote: story.layers?.[0]?.text || "",
        bg: story.background || "#000",
        caption: story.caption || "",
        layers: story.layers || []
      }
    });

  };

  return (

    <>

<DashboardNavbar />

<div className="settings-page">

<div className="edit-navbar">

<button className="back-btn" onClick={() => navigate(-1)}>
<FaArrowLeft />
</button>

<h2>Story Memories</h2>

<div style={{ width: "32px" }}></div>

</div>

<div className="settings-card">

{loading ?

          <div className="settings-skeleton">
<div className="skeleton-item"></div>
<div className="skeleton-item"></div>
<div className="skeleton-item"></div>
</div> :



          <>

<div className="settings-section">

<div className="account-profile-panel">

<img
                  src={photo || "/assets/profile.png"}
                  className="account-profile-photo"
                  alt=""
                  draggable="false" />
                

<div className="account-profile-info">
<h4>{name}</h4>
<p>@{username}</p>
</div>

</div>

</div>

<div className="settings-section">

<p className="settings-heading">
Your story archive
</p>

{stories.length === 0 ?

              <div className="settings-item">

<div className="settings-icon red">
<FaHistory />
</div>

<div className="settings-text">
<h4>No stories yet</h4>
<p>Your stories will appear here</p>
</div>

</div> :



              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
                  gap: "14px"
                }}>
                

{stories.map((story, index) => {

                  const expired = story.expiresAt < Date.now();
                  const formattedDate = formatDate(story.createdAt);

                  return (

                    <div
                      key={index}
                      style={{
                        borderRadius: "16px",
                        overflow: "hidden",
                        position: "relative",
                        background: "var(--card-bg)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
                      }}>
                      

<div style={{ position: "relative" }}>

{story.mediaType === "image" &&
                        <div style={{ position: "relative", height: "180px" }}>

    {!loaded[index] ?
                          <div className="story-skeleton"></div> :

                          <img
                            src={story.media}
                            style={{
                              width: "100%",
                              height: "180px",
                              objectFit: "cover"
                            }}
                            alt="" />

                          }

    <img
                            src={story.media}
                            style={{ display: "none" }}
                            onLoad={() => setLoaded((prev) => ({ ...prev, [index]: true }))}
                            alt="" />
                          

  </div>
                        }

{story.mediaType === "video" &&
                        <div style={{ position: "relative", height: "180px" }}>

    {!loaded[index] &&
                          <div className="story-skeleton"></div>
                          }

    <video
                            src={story.media}
                            muted
                            playsInline
                            autoPlay
                            preload="auto"

                            onLoadedData={(e) => {
                              const vid = e.target;

                              vid.play().
                              then(() => {
                                setLoaded((prev) => ({ ...prev, [index]: true }));
                              }).
                              catch(() => {
                                setLoaded((prev) => ({ ...prev, [index]: "fallback" }));
                              });
                            }}

                            onError={() => {
                              setLoaded((prev) => ({ ...prev, [index]: "fallback" }));
                            }}

                            style={{
                              width: "100%",
                              height: "180px",
                              objectFit: "cover",
                              display: loaded[index] === true ? "block" : "none"
                            }} />
                          

    {(loaded[index] === "fallback" || loaded[index] === undefined) &&
                          <img
                            src={story.thumbnail || "/assets/video-placeholder.jpg"}
                            style={{
                              width: "100%",
                              height: "180px",
                              objectFit: "cover"
                            }}
                            onLoad={() => setLoaded((prev) => ({ ...prev, [index]: "fallback-loaded" }))}
                            onError={() => setLoaded((prev) => ({ ...prev, [index]: "fallback-loaded" }))}
                            alt="" />

                          }

  </div>
                        }

{!story.media &&
                        <div style={{
                          height: "180px",
                          background: story.background || "#000",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff"
                        }}>
    Text Story
  </div>
                        }

<div style={{
                          position: "absolute",
                          top: "8px",
                          left: "8px",
                          background: expired ? "#ff3040" : "#22c55e",
                          color: "#fff",
                          padding: "4px 8px",
                          borderRadius: "8px",
                          fontSize: "11px"
                        }}>
{expired ? "Expired" : "Active"}
</div>

</div>

<div style={{ padding: "10px" }}>

<p style={{
                          fontSize: "13px",
                          opacity: "0.7"
                        }}>
{timeAgo(story.createdAt)}
</p>

{formattedDate &&
                        <p className="story-memory-date">
<span className="story-memory-date-day">{formattedDate.day}</span>
<span className="story-memory-date-meta">
{formattedDate.month} {formattedDate.year}
</span>
</p>
                        }

</div>

<button
                        onClick={() => openEditor(story)}
                        style={{
                          position: "absolute",
                          bottom: "10px",
                          right: "10px",
                          background: "#4f6cff",
                          border: "none",
                          borderRadius: "50%",
                          width: "38px",
                          height: "38px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          cursor: "pointer"
                        }}>
                        

<FaRedo />

</button>

</div>);



                })}

</div>

              }

</div>

</>

          }

</div>

</div>

<BottomNav />

</>);



}

export default StoryMemories;