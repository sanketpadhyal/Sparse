import DashboardNavbar from "../components/DashboardNavbar";
import BottomNav from "../components/BottomNav";
import "./Settings.css";
import { FaCode } from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import { useState, useEffect, useLayoutEffect } from "react";

import {
  FaUserShield,
  FaBell,
  FaClock,
  FaDatabase,
  FaLock,
  FaUserFriends,
  FaMobileAlt,
  FaSignOutAlt,
  FaChartLine,
  FaHeart,
  FaCommentDots,
  FaHistory,
  FaMoon } from
"react-icons/fa";

import { BiGitCompare } from "react-icons/bi";

import { auth } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";

function Settings() {

  const navigate = useNavigate();

  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/home");
      }
    });
    return unsubscribe;
  }, [navigate]);

  const confirmLogout = async () => {

    setLoggingOut(true);

    await new Promise((r) => setTimeout(r, 2000));

    try {

      await signOut(auth);

      localStorage.removeItem("session_id");

      window.showAlert("Logged out successfully", "success");

      navigate("/login");

    } catch (err) {

      window.showAlert("Logout failed", "error");

    }

    setLoggingOut(false);

  };

  return (

    <>

<DashboardNavbar />

<div className="settings-page">

<h2 className="settings-title">
Settings and activity
</h2>

<div className="settings-card">

<div className="settings-section">

<p className="settings-heading">
Your account
</p>

<div
              className="settings-item"
              onClick={() => navigate("/account-center")}>
              

<div className="settings-icon blue">
<FaUserShield />
</div>

<div className="settings-text">
<h4>Account Center</h4>
<p>Password, security, personal details</p>
</div>

</div>

<div
              className="settings-item"
              onClick={() => navigate("/liked-memes")}>
              

<div className="settings-icon red">
<FaHeart />
</div>

<div className="settings-text">
<h4>Liked Memes</h4>
<p>View and manage your liked memes</p>
</div>

</div>

<div
              className="settings-item"
              onClick={() => navigate("/story-memories")}>
              

<div className="settings-icon purple">
<FaHistory />
</div>

<div className="settings-text">
<h4>Recent Stories</h4>
<p>View and repost your story memories</p>
</div>

</div>

<div
              className="settings-item"
              onClick={() => navigate("/notifications")}>
              

<div className="settings-icon yellow">
<FaBell />
</div>

<div className="settings-text">
<h4>Notifications</h4>
<p>Manage your notification preferences</p>
</div>

</div>

<div
              className="settings-item"
              onClick={() => navigate("/theme")}>
              

<div className="settings-icon dark">
<FaMoon />
</div>

<div className="settings-text">
<h4>Theme</h4>
<p>Switch between light and dark mode</p>
</div>

</div>

</div>


<div className="settings-section">

<p className="settings-heading">
How you use the app
</p>

<div
              className="settings-item"
              onClick={() => navigate("/insights")}>
              

<div className="settings-icon green">
<FaChartLine />
</div>

<div className="settings-text">
<h4>Insights</h4>
<p>Track app usage</p>
</div>

</div>

<div
              className="settings-item"
              onClick={() => navigate("/app-storage")}>
              

<div className="settings-icon purple">
<FaDatabase />
</div>

<div className="settings-text">
<h4>Storage</h4>
<p>Manage app storage and cache</p>
</div>

</div>

</div>


<div className="settings-section">

<p className="settings-heading">
Who can see your content
</p>

<div
              className="settings-item"
              onClick={() => navigate("/privacy-page")}>
              

<div className="settings-icon red">
<FaLock />
</div>

<div className="settings-text">
<h4>Account privacy</h4>
<p>Who can see your profile</p>
</div>

</div>

</div>


<div className="settings-section">

<p className="settings-heading">
Quick settings
</p>

<div
              className="settings-item"
              onClick={() => navigate("/devices")}>
              

<div className="settings-icon cyan">
<FaMobileAlt />
</div>

<div className="settings-text">
<h4>Manage devices</h4>
<p>View and control logged in devices</p>
</div>

</div>

<div
              className="settings-item"
              onClick={() => navigate("/developers")}>
              

<div className="settings-icon purple">
<FaCode />
</div>

<div className="settings-text">
<h4>About developers</h4>
<p>Learn about the creators of Sparse</p>
</div>

</div>

<div
              className="settings-item"
              onClick={() => window.location.href = "mailto:sanketpadhyal@gmail.com?subject=Meaningful Feedback"}>
              

<div className="settings-icon blue">
<FaCommentDots />
</div>

<div className="settings-text">
<h4>Meaningful Feedback</h4>
<p>Help us improve Sparse with your suggestions</p>
</div>

</div>

<div
              className="settings-item"
              onClick={() => navigate("/journey")}>
              

<div className="settings-icon cyan">
<BiGitCompare />
</div>

<div className="settings-text">
<h4>Journey</h4>
<p>View Sparse's evolution and web experience</p>
</div>

</div>

{!showLogout &&

            <button
              className="logout-btn"
              onClick={() => setShowLogout(true)}>
              
<FaSignOutAlt />
Quick logout
</button>

            }

{showLogout &&

            <div className="logout-inline">

<div className="logout-inline-actions">

<button
                  className="logout-cancel"
                  onClick={() => setShowLogout(false)}>
                  
Cancel
</button>

<button
                  className="logout-confirm"
                  onClick={confirmLogout}
                  disabled={loggingOut}>
                  

{loggingOut ?
                  <div className="logout-loader"></div> :
                  "Yes"}

</button>

</div>

</div>

            }

</div>

</div>

</div>

<BottomNav />

</>);



}

export default Settings;