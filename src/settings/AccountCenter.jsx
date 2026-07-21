import DashboardNavbar from "../components/DashboardNavbar";
import BottomNav from "../components/BottomNav";
import "./Settings.css";

import { useNavigate } from "react-router-dom";
import { useLayoutEffect, useEffect, useState } from "react";

import {
  FaArrowLeft,
  FaShareAlt,
  FaSignInAlt,
  FaShieldAlt,
  FaIdCard,
  FaUserLock,
  FaTrash } from
"react-icons/fa";

import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function AccountCenter() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [photo, setPhoto] = useState("");

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        navigate("/home");
        return;
      }

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {

        const data = snap.data();

        setName(data.name || "");
        setUsername(data.username || "");
        setPhoto(data.profilePhoto || "");

      }

      setLoading(false);

    });

    return () => unsubscribe();

  }, [navigate]);

  return (

    <>

<DashboardNavbar />

<div
        className="settings-page"
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none"
        }}>
        

<div className="edit-navbar">

<button
            className="back-btn"
            onClick={() => navigate(-1)}>
            
<FaArrowLeft />
</button>

<h2>Accounts Centre</h2>

<div style={{ width: "32px" }}></div>

</div>

<div className="settings-card">

{loading ?

          <div className="settings-skeleton">

<div className="skeleton-profile">
<div className="skeleton-avatar"></div>
<div className="skeleton-lines">
<div className="skeleton-line"></div>
<div className="skeleton-line small"></div>
<div className="skeleton-btn"></div>
</div>
</div>

<div className="skeleton-line"></div>

<div className="skeleton-item"></div>
<div className="skeleton-item"></div>
<div className="skeleton-item"></div>

<div className="skeleton-line"></div>

<div className="skeleton-item"></div>
<div className="skeleton-item"></div>

</div> :



          <>

<div className="settings-section">

<div className="account-profile-panel">

<img
                  src={photo || "/assets/profile.png"}
                  className="account-profile-photo"
                  alt="profile"
                  draggable="false" />
                

<div className="account-profile-info">

<h4>{name}</h4>
<p>@{username}</p>

</div>

</div>

</div>

<div className="settings-section">

<p className="settings-heading">
Account settings
</p>

<div
                className="settings-item"
                onClick={() => navigate("/password-security")}>
                

<div className="settings-icon blue">
<FaShieldAlt />
</div>

<div className="settings-text">
<h4>Password and security</h4>
<p>Manage login and security</p>
</div>

</div>

<div
                className="settings-item"
                onClick={() => navigate("/edit-profile")}>
                

<div className="settings-icon green">
<FaIdCard />
</div>

<div className="settings-text">
<h4>Personal details</h4>
<p>Name, age, and profile info</p>
</div>

</div>

<div className="settings-item"
              onClick={() => navigate("/your-data")}>
                

<div className="settings-icon red">
<FaUserLock />
</div>

<div className="settings-text">
<h4>Your information and permissions</h4>
<p>Access and manage data</p>
</div>

</div>

</div>

<div className="settings-section">

<p className="settings-heading">
Connected experiences
</p>

<div className="settings-item" onClick={() => navigate("/profile-qr")}>

<div className="settings-icon yellow">
<FaShareAlt />
</div>

<div className="settings-text">
<h4>Sharing across profiles</h4>
</div>

</div>

</div>

<div className="settings-section">

<p className="settings-heading">
Account actions
</p>

<div
                className="settings-item delete-account"
                onClick={() => navigate("/delete-account")}>
                

<div className="settings-icon red">
<FaTrash />
</div>

<div className="settings-text">
<h4>Delete my account</h4>
<p>Permanently delete your account</p>
</div>

</div>

</div>

</>

          }

</div>

</div>

<BottomNav />

</>);



}

export default AccountCenter;