import "./Navbar.css";
import { FaUser, FaInfoCircle, FaEnvelope, FaUserPlus, FaBars } from 'react-icons/fa';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Navbar() {

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    if (window.lenis) {
      window.lenis.scrollTo(0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const generateToken = (length = 32) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createAuthSession = () => {
    const authToken = generateToken(32);
    const sessionToken = generateToken(32);

    sessionStorage.setItem("auth_token", authToken);
    sessionStorage.setItem("session_token", sessionToken);

    return { authToken, sessionToken };
  };

  const handleLoginRedirect = () => {

    const { authToken, sessionToken } = createAuthSession();

    navigate(`/login?auth=${authToken}&sess=${sessionToken}`);
    setOpen(false);

  };

  const handleSignupRedirect = () => {

    const { authToken, sessionToken } = createAuthSession();

    navigate(`/signup?auth=${authToken}&sess=${sessionToken}`);
    setOpen(false);

  };

  return (

    <>
<nav className={`navbar ${scrolled ? "navbar-light" : ""}`}>

<div className="logo-container" onClick={scrollToTop}>
<img src="/assets/logo.png" alt="Sparse" className="logo" />
<span className="logo-text">Sparse</span>
</div>

<div className={`nav-buttons ${open ? "active" : ""}`}>

<div className="mobile-menu-header">
<FaBars size={14} />
<span>Menu</span>
</div>

<button
            className="about"
            onClick={() => {
              navigate("/developers");
              setOpen(false);
            }}>
            
<FaInfoCircle size={12} /> About
</button>

<button className="signin" onClick={handleLoginRedirect}>
<FaUser size={12} /> Sign In
</button>

<button className="signup" onClick={handleSignupRedirect}>
<FaUserPlus size={12} /> Sign Up
</button>

<button className="contact">
<FaEnvelope size={12} /> Contact Us!
</button>

</div>

<div className={`menu-toggle ${open ? "open" : ""}`} onClick={() => setOpen(!open)}>
<span></span>
<span></span>
<span></span>
</div>

</nav>

<div className={`menu-overlay ${open ? "active" : ""}`} onClick={() => setOpen(false)}></div>

</>);



}

export default Navbar;