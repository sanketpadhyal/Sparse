import "./Hero.css";
import { FaSignInAlt, FaGithub, FaCode } from "react-icons/fa";
import { BiGitCompare } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function Hero() {

  const navigate = useNavigate();

  const [loaded, setLoaded] = useState(
    localStorage.getItem("hero_illus_loaded") === "true"
  );

  useEffect(() => {
    if (window.lenis) {
      window.lenis.scrollTo(80, { immediate: true });
    } else {
      window.scrollTo(0, 80);
    }
  }, []);

  const generateToken = (length = 32) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleImageLoad = () => {
    setLoaded(true);
    localStorage.setItem("hero_illus_loaded", "true");
  };

  const handleLoginRedirect = () => {
    const authToken = generateToken(32);
    const sessionToken = generateToken(32);

    sessionStorage.setItem("auth_token", authToken);
    sessionStorage.setItem("session_token", sessionToken);

    navigate(`/login?auth=${authToken}&sess=${sessionToken}`);
  };

  const goDevelopers = () => {
    navigate("/developers");
  };

  const goGithub = () => {
    window.open("https://github.com/sanketpadhyal", "_blank");
  };

  return (

    <section className="hero">

<div className="hero-left">

{!loaded && <div className="hero-skeleton"></div>}

<img
          src="/assets/illus1.png"
          alt="Minimal Social Illustration"
          className={`hero-image ${loaded ? "show" : ""}`}
          onLoad={handleImageLoad} />
        

</div>

<div className="hero-right">

<h1 className="hero-title">
A Minimal Social Media<br />
<span>For Distraction - Free Users</span>
</h1>

<p className="hero-desc">
Share posts, stories, follow people, chat privately and build a calm social experience designed for thoughtful interactions.
</p>

<div className="hero-buttons">

<button className="hero-signin" onClick={handleLoginRedirect}>
<FaSignInAlt size={14} />Login Page
</button>

<button className="hero-services" onClick={goDevelopers}>
<FaCode size={14} /> Developers
</button>

<button className="hero-privacy" onClick={goGithub}>
<FaGithub size={14} /> GitHub
</button>

<button className="hero-journey" onClick={() => navigate('/journey')}>
	<BiGitCompare size={14} /> Journey
</button>

</div>

<br />

</div>

</section>);



}

export default Hero;