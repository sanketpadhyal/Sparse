import "./Footer.css";
import { FaGithub, FaUserLock, FaEnvelope, FaInfoCircle, FaStar, FaShieldAlt, FaLock, FaFileAlt, FaPhone } from "react-icons/fa";

function Footer() {

  return (

    <footer className="footer">

<div className="footer-container">

<div className="footer-left">

<div className="footer-brand">
<img src="/assets/logo.png" alt="Sparse" className="footer-logo" />
<span className="footer-name">Sparse</span>
</div>

<p className="footer-desc">
A calm social network built for meaningful interaction.
No ads, no algorithms, no distractions.
</p>

</div>

<div className="footer-links">

<div className="footer-column">
<h4>Platform</h4>

<a href="/developers">
<FaInfoCircle /> About
</a>

<a href="/recover">
<FaUserLock /> Recover Account
</a>

</div>

<div className="footer-column">
<h4>Resources</h4>

<a href="tel:9284024617">
<FaPhone /> 9284024617
</a>

<a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=sanketpadhyal3@gmail.com"
              target="_blank"
              rel="noopener noreferrer">
              
<FaEnvelope /> sanketpadhyal3@gmail.com
</a>

</div>

<div className="footer-column">
<h4>Connect</h4>

<a
              href="https://github.com/sanketpadhyal"
              target="_blank"
              rel="noopener noreferrer">
              
<FaGithub /> Github
</a>

<a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=sanketpadhyal3@gmail.com"
              target="_blank"
              rel="noopener noreferrer">
              
<FaEnvelope /> Gmail
</a>

</div>

</div>

</div>

<div className="footer-bottom">
<p>© {new Date().getFullYear()} Sparse. All rights reserved.</p>
</div>

</footer>);



}

export default Footer;