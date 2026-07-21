import DashboardNavbar from "../components/DashboardNavbar";
import BottomNav from "../components/BottomNav";
import "./Settings.css";

import { useNavigate } from "react-router-dom";
import { useLayoutEffect, useEffect, useState } from "react";

import { FaArrowLeft, FaHeart, FaTimes } from "react-icons/fa";

import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function LikedMemes() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [photo, setPhoto] = useState("");
  const [likedMemes, setLikedMemes] = useState([]);

  const [uid, setUid] = useState("");
  const [selected, setSelected] = useState(null);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        navigate("/home");
        return;
      }

      setUid(user.uid);

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {

        const data = snap.data();

        setName(data.name || "");
        setUsername(data.username || "");
        setPhoto(data.profilePhoto || "");
        setLikedMemes(data.likedMemes || []);

      }

      setLoading(false);

    });

    return () => unsubscribe();

  }, [navigate]);

  const unlikeMeme = async (url) => {

    const updated = likedMemes.filter((m) => m !== url);

    setLikedMemes(updated);

    await updateDoc(doc(db, "users", uid), {
      likedMemes: updated
    });

    if (selected === url) {
      setSelected(null);
    }

  };

  return (

    <>

<DashboardNavbar />

<div className="settings-page">

<div className="edit-navbar">

<button className="back-btn" onClick={() => navigate(-1)}>
<FaArrowLeft />
</button>

<h2>Liked Memes</h2>

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
Your liked collection
</p>

{likedMemes.length === 0 ?

              <div className="settings-item">

<div className="settings-icon red">
<FaHeart />
</div>

<div className="settings-text">
<h4>No saved memes</h4>
<p>Double tap memes to save them here</p>
</div>

</div> :



              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
                  gap: "14px"
                }}>
                

{[...likedMemes].reverse().map((url, index) =>

                <div
                  key={index}
                  style={{
                    borderRadius: "16px",
                    overflow: "hidden",
                    position: "relative",
                    background: "var(--card-bg)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    cursor: "pointer"
                  }}
                  onClick={() => setSelected(url)}>
                  

<img
                    src={url}
                    style={{
                      width: "100%",
                      height: "180px",
                      objectFit: "cover"
                    }}
                    alt=""
                    draggable="false" />
                  

<div
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      background: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      padding: "4px 8px",
                      borderRadius: "8px",
                      fontSize: "11px"
                    }}>
                    
Saved
</div>

<button
                    onClick={(e) => {
                      e.stopPropagation();
                      unlikeMeme(url);
                    }}
                    style={{
                      position: "absolute",
                      bottom: "10px",
                      right: "10px",
                      background: "#ff3040",
                      border: "none",
                      borderRadius: "50%",
                      width: "38px",
                      height: "38px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      cursor: "pointer",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
                    }}>
                    
<FaHeart />
</button>

</div>

                )}

</div>

              }

</div>

</>

          }

</div>

</div>

{}

{selected &&

      <div
        onClick={() => setSelected(null)}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
        

<img
          src={selected}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            borderRadius: "16px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            transform: "scale(1.02)"
          }}
          alt="" />
        

<button
          onClick={() => setSelected(null)}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "rgba(0,0,0,0.6)",
            border: "none",
            borderRadius: "50%",
            width: "42px",
            height: "42px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            cursor: "pointer"
          }}>
          
<FaTimes />
</button>

</div>

      }

<BottomNav />

</>);



}

export default LikedMemes;