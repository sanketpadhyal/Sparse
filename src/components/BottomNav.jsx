import React, { useEffect, useState } from "react";
import { Home, Search, MessageCircle, User } from "lucide-react";
import { FaRegNewspaper } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import "./BottomNav.css";

import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function BottomNav() {

  const navigate = useNavigate();
  const location = useLocation();

  const [profilePhoto, setProfilePhoto] = useState("");
  const [theme, setTheme] = useState("dark");

  useEffect(() => {

    const cached = localStorage.getItem("profile_photo_cache");

    if (cached) {
      setProfilePhoto(cached);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (!user) return;

      try {

        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {

          const data = snap.data();
          const photo = data.profilePhoto || "";

          setProfilePhoto(photo);

          localStorage.setItem("profile_photo_cache", photo);

        }

      } catch (err) {
        console.log(err);
      }

    });

    const refreshListener = () => {

      const cached = localStorage.getItem("profile_photo_cache");

      if (cached) {
        setProfilePhoto(cached);
      }

    };

    window.addEventListener("profileUpdated", refreshListener);

    return () => {

      unsubscribe();
      window.removeEventListener("profileUpdated", refreshListener);

    };

  }, []);

  useEffect(() => {

    const media = window.matchMedia("(prefers-color-scheme: light)");

    const handleThemeChange = (e) => {
      setTheme(e.matches ? "light" : "dark");
      document.body.setAttribute("data-theme", e.matches ? "light" : "dark");
    };

    handleThemeChange(media);

    media.addEventListener("change", handleThemeChange);

    return () => media.removeEventListener("change", handleThemeChange);

  }, []);

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  return (

    <>

<div className="bottom-nav">

<div
          className={`nav-btn ${isActive("/dashboard")}`}
          onClick={() => navigate("/dashboard")}>
          
<Home size={22} />
</div>

<div
          className={`nav-btn ${isActive("/dashboard/search")}`}
          onClick={() => navigate("/dashboard/search")}>
          
<Search size={22} />
</div>

<div
          className={`nav-btn ${isActive("/dashboard/chat")}`}
          onClick={() => navigate("/dashboard/chat")}>
          
<MessageCircle size={22} />
</div>

<div
          className={`nav-btn ${isActive("/dashboard/profile")}`}
          onClick={() => navigate("/dashboard/profile")}>
          
<img
            src={profilePhoto || "/assets/profile.png"}
            className={`nav-profile ${isActive("/dashboard/profile") ? "nav-profile-active" : ""}`}
            alt="profile" />
          
</div>

<div
          className={`nav-btn ${isActive("/dashboard/posts")}`}
          onClick={() => navigate("/dashboard/posts")}>
          
<FaRegNewspaper size={20} />
</div>

</div>

<div className="sidebar-nav">

<button
          className={`side-btn ${isActive("/dashboard")}`}
          onClick={() => navigate("/dashboard")}>

          

<Home size={22} />
<span>Home</span>
</button>

<button
          className={`side-btn ${isActive("/dashboard/search")}`}
          onClick={() => navigate("/dashboard/search")}>

          

<Search size={22} />
<span>Search</span>
</button>


<button
          className={`side-btn ${isActive("/dashboard/chat")}`}
          onClick={() => navigate("/dashboard/chat")}>

          

<MessageCircle size={22} />
<span>Chat</span>
</button>

<button
          className={`side-btn ${isActive("/dashboard/posts")}`}
          onClick={() => navigate("/dashboard/posts")}>
          
<FaRegNewspaper size={20} />
<span>Posts Feed</span>
</button>

<button
          className={`side-btn ${isActive("/dashboard/profile")}`}
          onClick={() => navigate("/dashboard/profile")}>

          

<User size={22} />
<span>Profile</span>
</button>

</div>

</>);



}

export default BottomNav;