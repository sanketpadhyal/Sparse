import DashboardNavbar from "../components/DashboardNavbar";
import BottomNav from "../components/BottomNav";
import "../settings/Settings.css";

import { useNavigate } from "react-router-dom";
import { useLayoutEffect } from "react";

import {
  FaArrowLeft,
  FaRocket,
  FaCheckCircle,
  FaBolt,
  FaUser,
  FaUsers,
  FaRobot,
  FaComments } from
"react-icons/fa";

function Journey() {

  const navigate = useNavigate();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

<h2>Journey</h2>

<div style={{ width: "32px" }}></div>

</div>

<div className="settings-card">

<div className="settings-section">

<p className="settings-heading">Sparse Evolution</p>

<div className="settings-item">
<div className="settings-icon purple"><FaRocket /></div>
<div className="settings-text">
<h4>From Idea to Production 🚀</h4>
<p>
Sparse evolved from a simple idea into a real-time social platform built for speed, clarity, and meaningful connections.
</p>
</div>
</div>

</div>

<div className="settings-section">

<p className="settings-heading">Timeline</p>

<div className="settings-item">
<div className="settings-icon yellow"><FaRocket /></div>
<div className="settings-text">
<h4>6 March 2026</h4>
<p>Repository created — the idea begins</p>
</div>
</div>

<div className="settings-item">
<div className="settings-icon blue"><FaBolt /></div>
<div className="settings-text">
<h4>13 March 2026</h4>
<p>First prototype launched</p>
</div>
</div>

<div className="settings-item">
<div className="settings-icon blue"><FaBolt /></div>
<div className="settings-text">
<h4>14 March 2026</h4>
<p>Public release with early users onboard</p>
</div>
</div>

<div className="settings-item">
<div className="settings-icon green"><FaCheckCircle /></div>
<div className="settings-text">
<h4>16 March 2026</h4>
<p>Core system stabilized with major improvements</p>
</div>
</div>

<div className="settings-item">
<div className="settings-icon green"><FaCheckCircle /></div>
<div className="settings-text">
<h4>18 March 2026</h4>
<p>Production-ready version released</p>
</div>
</div>

<div className="settings-item">
<div className="settings-icon cyan"><FaBolt /></div>
<div className="settings-text">
<h4>24 March 2026</h4>
<p>Major feature updates and system enhancements shipped</p>
</div>
</div>

<div className="settings-item">
<div className="settings-icon purple"><FaRobot /></div>
<div className="settings-text">
<h4>25 March 2026</h4>
<p>AI features and performance optimizations introduced</p>
</div>
</div>

</div>

<div className="settings-section">

<p className="settings-heading">26 March 2026 — Quick Update ⚡</p>

<div className="settings-item">
<div className="settings-icon cyan"><FaComments /></div>
<div className="settings-text">
<h4>Chat System Fix</h4>
<p>Chatroom bugs fixed and message stability improved</p>
</div>
</div>

<div className="settings-item">
<div className="settings-icon blue"><FaBolt /></div>
<div className="settings-text">
<h4>Live Chat Improvements</h4>
<p>Typing indicators and unread counts now update in real-time</p>
</div>
</div>

<div className="settings-item">
<div className="settings-icon green"><FaCheckCircle /></div>
<div className="settings-text">
<h4>Profile Skeleton Fix</h4>
<p>Resolved loading skeleton issues on profile page</p>
</div>
</div>

<div className="settings-item">
<div className="settings-icon purple"><FaUser /></div>
<div className="settings-text">
<h4>Edit Profile Optimized</h4>
<p>Faster and smoother profile update experience</p>
</div>
</div>

<div className="settings-item">
<div className="settings-icon yellow"><FaUsers /></div>
<div className="settings-text">
<h4>Follow System Boost</h4>
<p>Response time improved from ~8s to ~1s</p>
</div>
</div>

</div>

<div className="settings-section">

<p className="settings-heading">Preview</p>

<div className="web-preview">

<div className="web-header">
<div className="web-dots">
<span className="dot red"></span>
<span className="dot yellow"></span>
<span className="dot green"></span>
</div>
<div className="web-url">https://www.sparse.in</div>
</div>

<div className="web-body">

<p className="web-text">
Experience Sparse directly on the web — a fast, responsive, and optimized platform designed for seamless real-time interaction.
</p>

<p className="web-text">
Built with a focus on performance, simplicity, and meaningful usage, Sparse delivers a clean social experience without unnecessary distractions.
</p>

<p className="web-text highlight">
Thank you for supporting Sparse and being part of the journey.
</p>

</div>

</div>

</div>

</div>

</div>

<BottomNav />

</>);



}

export default Journey;