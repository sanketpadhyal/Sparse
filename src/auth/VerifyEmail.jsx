import React, { useEffect, useState } from "react";
import "./Login.css";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";
import { sendEmailVerification, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

function Verify() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant"
    });

    const user = auth.currentUser;

    if (!user) {
      navigate("/home", { replace: true });
      return;
    }

    if (user.emailVerified) {
      navigate("/dashboard", { replace: true });
      return;
    }

    setEmail(user.email);

    const stored = localStorage.getItem("verify_resend_timer");

    if (stored) {

      const remaining = parseInt(stored) - Date.now();

      if (remaining > 0) {
        setCooldown(Math.ceil(remaining / 1000));
      } else {
        localStorage.removeItem("verify_resend_timer");
      }

    } else {

      const expire = Date.now() + 50000;
      localStorage.setItem("verify_resend_timer", expire);
      setCooldown(50);

    }

  }, [navigate]);

  useEffect(() => {

    if (cooldown <= 0) return;

    const timer = setInterval(() => {

      setCooldown((prev) => {

        const next = prev - 1;

        if (next <= 0) {
          localStorage.removeItem("verify_resend_timer");
          return 0;
        }

        return next;

      });

    }, 1000);

    return () => clearInterval(timer);

  }, [cooldown]);

  useEffect(() => {

    const interval = setInterval(async () => {

      try {

        const user = auth.currentUser;
        if (!user) return;

        await user.reload();

        if (user.emailVerified && !emailSent) {

          setEmailSent(true);
          clearInterval(interval);

          const sentKey = "welcome_sent_" + user.uid;

          if (!localStorage.getItem(sentKey)) {

            try {

              const snap = await getDoc(doc(db, "users", user.uid));
              const data = snap.data();

              const founderSnap = await getDoc(
                doc(db, "users", "3rTUSWqha4cF8S2K3xZXOx23mS93")
              );
              const founder = founderSnap.data();

              await fetch("https://sparse-mail-backend-425667854809.europe-west1.run.app/send-welcome-email", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  email: user.email,
                  name: data.name,
                  username: data.username,
                  profilePhoto: data.profilePhoto || "",


                  founderName: founder.name,
                  founderUsername: founder.username,
                  founderPhoto: founder.profilePhoto || ""
                })
              });

              localStorage.setItem(sentKey, "true");

            } catch (err) {
              console.log("WELCOME EMAIL ERROR:", err);
            }

          }

          window.showAlert("Email verified successfully", "success");

          navigate("/dashboard", { replace: true });

        }

      } catch (err) {}

    }, 3000);

    return () => clearInterval(interval);

  }, [navigate, emailSent]);

  const handleBack = () => {
    navigate("/home", { replace: true });
  };

  const handleResend = async () => {

    if (cooldown > 0) return;

    setLoading(true);

    try {

      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }

      window.showAlert("Verification email sent again", "success");

      const expire = Date.now() + 50000;
      localStorage.setItem("verify_resend_timer", expire);

      setCooldown(50);

    } catch (err) {

      window.showAlert("Failed to send verification email", "error");

    }

    setLoading(false);

  };

  const handleAbort = async () => {

    try {
      await signOut(auth);
    } catch (err) {}

    navigate("/home", { replace: true });

  };

  return (

    <div className="login-page">

<div className="login-navbar">

<div
          className="login-navbar-brand"
          onClick={() => navigate("/home")}>
          

<img
            src="/assets/logo.png"
            className="login-navbar-logo"
            alt="Sparse" />
          

<span className="login-navbar-title">
<span className="sparse-brand">Sparse</span>{" "}
<span className="identity-brand">Verify</span>{" "}
<span className="pvt-trademark">Gateway</span>
</span>

</div>

</div>

<div className="login-card">

<button className="back-button" onClick={handleBack}>
<FaArrowLeft />
</button>

<div className="login-brand">

<img
            src="/assets/logo.png"
            className="login-logo"
            alt="Sparse" />
          

<span className="login-title">
Sparse
</span>

</div>

<h2 className="login-heading">
Verify your email
</h2>

<p className="verify-text">
A verification email has been sent to <b>{email}</b>.  
Since Sparse is a new platform, some email providers may place our email in the spam or junk folder.  
Please check there if you do not see it in your inbox and kindly cooperate with us while we improve delivery reliability.
</p>

<div className="spam-guide">

{!imageLoaded && <div className="spam-skeleton"></div>}

<img
            src="/assets/spam.png"
            alt="Spam folder guide"
            className={`spam-image ${imageLoaded ? "show" : ""}`}
            onLoad={() => setImageLoaded(true)} />
          

</div>

<div className="verify-actions">

<button
            className="login-button"
            onClick={handleResend}
            disabled={loading || cooldown > 0}>
            

{loading ?
            <div className="login-loader"></div> :
            cooldown > 0 ?
            `Resend in ${cooldown}s` :

            "Resend Email"
            }

</button>

<button
            className="verify-abort-button"
            onClick={handleAbort}>
            
Abort Session
</button>

</div>

</div>

</div>);



}

export default Verify;