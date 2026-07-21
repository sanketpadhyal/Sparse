import DashboardNavbar from "../components/DashboardNavbar";
import BottomNav from "../components/BottomNav";
import "./Settings.css";

import { useNavigate } from "react-router-dom";
import { useLayoutEffect, useEffect, useState } from "react";

import {
  FaArrowLeft,
  FaEnvelope,
  FaKey,
  FaUndo } from
"react-icons/fa";

import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function PasswordSecurity() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [photo, setPhoto] = useState("");
  const [email, setEmail] = useState("");

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        navigate("/home");
        return;
      }

      setEmail(user.email || "");

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

<div className="settings-page">

<div className="edit-navbar">

<button
            className="back-btn"
            onClick={() => navigate(-1)}>
            
<FaArrowLeft />
</button>

<h2>Password & Security</h2>

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
</div>
</div>

<div className="skeleton-line"></div>
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
                  alt="profile" />
                

<div className="account-profile-info">

<h4>{name}</h4>
<p>@{username}</p>

</div>

</div>

</div>


<div className="settings-section">

<p className="settings-heading">
Bound email
</p>

<div className="settings-item">

<div className="settings-icon blue">
<FaEnvelope />
</div>

<div className="settings-text">

<h4>{email}</h4>
<p>Your login email</p>

</div>

</div>

</div>


<div className="settings-section">

<p className="settings-heading">
Security actions
</p>

<div
                className="settings-item"
                onClick={() => navigate("/change-password")}>
                

<div className="settings-icon green">
<FaKey />
</div>

<div className="settings-text">

<h4>Change password</h4>
<p>Update your account password</p>

</div>

</div>

<div
                className="settings-item"
                onClick={() => navigate("/recover")}>
                

<div className="settings-icon orange">
<FaUndo />
</div>

<div className="settings-text">

<h4>Recover your old account</h4>
<p>Access previous account data</p>

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

export default PasswordSecurity;