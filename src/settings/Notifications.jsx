import DashboardNavbar from "../components/DashboardNavbar";
import BottomNav from "../components/BottomNav";
import "./Settings.css";

import { useNavigate } from "react-router-dom";
import { useLayoutEffect, useEffect, useState } from "react";

import { FaArrowLeft, FaBell, FaBellSlash } from "react-icons/fa";

import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function Notifications() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        navigate("/home");
        return;
      }

      try {

        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setEnabled(snap.data().notifications !== false);
        }

      } catch (err) {
        console.log(err);
      }

      setLoading(false);

    });

    return () => unsubscribe();

  }, [navigate]);

  const toggleNotifications = async () => {

    const user = auth.currentUser;
    if (!user) return;

    const newValue = !enabled;

    setEnabled(newValue);

    try {

      await updateDoc(doc(db, "users", user.uid), {
        notifications: newValue
      });

      window.showAlert(
        newValue ?
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
					<FaBell />
					<span>Notifications enabled</span>
				</span> :

        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
					<FaBellSlash />
					<span>Notifications disabled</span>
				</span>,

        "success"
      );

    } catch (err) {
      console.log(err);
      window.showAlert("Failed to update", "error");
    }

  };

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

<h2>Notifications</h2>

<div style={{ width: "32px" }}></div>

</div>

<div className="settings-card">

{loading ?

          <div className="settings-skeleton">

<div className="skeleton-line"></div>
<div className="skeleton-line"></div>

</div> :



          <>

<div className="settings-section">

<p className="settings-heading">
Control notifications
</p>

<div className="settings-item">

<div className="settings-icon yellow">
<FaBell />
</div>

<div className="settings-text">

<h4>Chat notifications</h4>
<p>Turn message alerts on or off</p>

</div>

<button
                  onClick={toggleNotifications}
                  style={{
                    marginLeft: "auto",
                    background: enabled ? "#4caf50" : "#888",
                    color: "#fff",
                    border: "none",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontWeight: "600"
                  }}>
                  

{enabled ? "ON" : "OFF"}

</button>

</div>

<div className="dev-note">
More features will be added frequently. Stay tuned!
</div>

</div>

</>

          }

</div>

</div>

<BottomNav />

</>);



}

export default Notifications;