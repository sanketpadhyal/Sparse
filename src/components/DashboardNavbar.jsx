import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../auth/Login.css";
import { FaBell, FaCog, FaRegNewspaper } from "react-icons/fa";

function DashboardNavbar() {

  const navigate = useNavigate();
  const location = useLocation();

  const [logo, setLogo] = useState("");

  const isPC = typeof window !== "undefined" && window.innerWidth >= 768;

  useEffect(() => {

    const cached = localStorage.getItem("sparse_logo");

    if (cached) {
      setLogo(cached);
      return;
    }

    fetch("/assets/logo.png").
    then((res) => res.blob()).
    then((blob) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        localStorage.setItem("sparse_logo", base64);
        setLogo(base64);
      };
      reader.readAsDataURL(blob);
    });

  }, []);

  const handleLogoClick = () => {

    if (location.pathname === "/dashboard") {

      if (window.lenis) {
        window.lenis.scrollTo(0, {
          duration: 1.2
        });
      } else {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }

    } else {
      navigate("/dashboard");
    }

  };

  return (

    <div
      className="login-navbar"
      style={!isPC ? { paddingLeft: "20px", userSelect: "none" } : { userSelect: "none" }}>
      

<div
        className="login-navbar-brand"
        onClick={handleLogoClick}
        style={isPC ? { marginLeft: "140px", userSelect: "none" } : { marginLeft: "0px", userSelect: "none" }}>
        

<img
          src={logo || "/assets/logo.png"}
          className="login-navbar-logo"
          alt="Sparse"
          draggable="false" />
        

<span className="login-navbar-title" style={{ userSelect: "none" }}>
<span className="sparse-brand">Sparse</span>{" "}
<span className="pvt-trademark">Ltd</span>
</span>

</div>

<div
        style={{
          position: "absolute",
          right: "22px",
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
        


<FaBell
          className="navbar-notification"
          onClick={() => navigate("/activity")} />
        

<FaCog
          className="navbar-notification"
          onClick={() => navigate("/dashboard/settings")} />
        

</div>

</div>);



}

export default DashboardNavbar;