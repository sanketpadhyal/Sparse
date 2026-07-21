import DashboardNavbar from "../components/DashboardNavbar";
import BottomNav from "../components/BottomNav";
import "./Settings.css";

import { useNavigate } from "react-router-dom";
import { useLayoutEffect } from "react";

import { FaArrowLeft, FaDesktop } from "react-icons/fa";

function Theme() {

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

<h2>Theme</h2>

<div style={{ width: "32px" }}></div>

</div>

<div className="settings-card">

<div className="settings-section">

<p className="settings-heading">
Theme settings
</p>

<div className="settings-item">

<div className="settings-icon cyan">
<FaDesktop />
</div>

<div className="settings-text">
<h4>System Theme</h4>
<p>Web theme follows your device theme automatically</p>
</div>

</div>

{}
<div className="theme-note">
Theme is based on your device settings.  
You cannot change it manually.  
Switch your system theme to see changes here.
</div>

</div>

</div>

</div>

<BottomNav />

</>);



}

export default Theme;