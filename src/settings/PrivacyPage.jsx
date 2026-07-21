import DashboardNavbar from "../components/DashboardNavbar";
import BottomNav from "../components/BottomNav";
import "./Settings.css";

import { useNavigate } from "react-router-dom";
import { useLayoutEffect } from "react";

import { FaArrowLeft, FaShieldAlt, FaEye, FaUsers, FaBalanceScale } from "react-icons/fa";

function AccountPrivacy() {

  const navigate = useNavigate();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

<h2>Account Privacy</h2>

<div style={{ width: "32px" }}></div>

</div>

<div className="settings-card">

<div className="settings-section">

<div className="settings-item">

<div className="settings-icon blue">
<FaShieldAlt />
</div>

<div className="settings-text">
<h4>Privacy Information</h4>
<p>
Sparse provides equal and exclusive privacy for every user. Accounts work in a balanced public-private mode where posts, likes, and comments can be viewed by users on the platform, allowing open interaction and engagement. However, your followers and following lists remain private and cannot be viewed by other users.
</p>
</div>

</div>

</div>

<div className="settings-section">

<p className="settings-heading">
How it works
</p>

<div className="settings-item">

<div className="settings-icon green">
<FaEye />
</div>

<div className="settings-text">
<h4>Post visibility</h4>
<p>Users on Sparse can view your posts and interact through likes and comments.</p>
</div>

</div>

<div className="settings-item">

<div className="settings-icon yellow">
<FaUsers />
</div>

<div className="settings-text">
<h4>Followers privacy</h4>
<p>Your followers and following lists are hidden and cannot be accessed by other users.</p>
</div>

</div>

<div className="settings-item">

<div className="settings-icon purple">
<FaBalanceScale />
</div>

<div className="settings-text">
<h4>Equal privacy</h4>
<p>All users receive the same level of privacy protection across the platform.</p>
</div>

</div>

</div>

</div>

</div>

<BottomNav />

</>);



}

export default AccountPrivacy;