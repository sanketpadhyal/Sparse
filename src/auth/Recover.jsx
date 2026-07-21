import React, { useState, useCallback } from "react";
import "./Login.css";
import { FaArrowLeft, FaEnvelope, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

function Recover() {

  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [userData, setUserData] = useState(null);
  const [skeleton, setSkeleton] = useState(false);

  const generateToken = (length = 32) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const getTokens = () => {
    let authToken = sessionStorage.getItem("auth_token");
    let sessionToken = sessionStorage.getItem("session_token");

    if (!authToken || !sessionToken) {
      authToken = generateToken(32);
      sessionToken = generateToken(32);
      sessionStorage.setItem("auth_token", authToken);
      sessionStorage.setItem("session_token", sessionToken);
    }

    return { authToken, sessionToken };
  };

  const maskEmail = (email) => {
    if (!email) return "";
    const [name, domain] = email.split("@");
    const visible = name.slice(0, 2);
    const last = name.slice(-1);
    return `${visible}***${last}@${domain}`;
  };

  const handleFind = useCallback(async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setSkeleton(true);

    try {

      let input = identifier.trim();
      let uid = null;
      let email = input;

      if (!input.includes("@")) {

        const username = input.toLowerCase();
        const usernameRef = doc(db, "usernames", username);
        const usernameSnap = await getDoc(usernameRef);

        if (!usernameSnap.exists()) throw new Error();

        uid = usernameSnap.data().uid;
        email = usernameSnap.data().email;

      } else {

        const q = query(collection(db, "users"), where("email", "==", input));
        const snap = await getDocs(q);

        if (snap.empty) throw new Error();

        uid = snap.docs[0].id;
      }

      const userSnap = await getDoc(doc(db, "users", uid));
      if (!userSnap.exists()) throw new Error();

      const data = userSnap.data();

      setTimeout(() => {
        setUserData({
          uid: uid,
          email: data.email,
          name: data.name,
          username: data.username,
          photo: data.profilePhoto
        });
        setSkeleton(false);
        setStep(2);
      }, 400);

    } catch (err) {

      setSkeleton(false);
      window.showAlert("Can't find your account", "error");

    }

    setLoading(false);

  }, [identifier, loading]);

  const handleSendReset = useCallback(async () => {

    if (sending) return;

    setSending(true);

    try {
      await sendPasswordResetEmail(auth, userData.email);
      window.showAlert("Password reset link sent", "success");
    } catch (err) {
      window.showAlert("Failed to send reset email", "error");
      setSending(false);
      return;
    }

    const { authToken, sessionToken } = getTokens();
    navigate(`/login?auth=${authToken}&sess=${sessionToken}`, { replace: true });

    setSending(false);

  }, [sending, userData, navigate]);

  return (

    <div className="login-page">

<div className="login-navbar">

<div
          className="login-navbar-brand"
          onClick={() => navigate("/home")}
          style={{ transform: "translateZ(0)" }}>
          

<img
            src="/assets/logo.png"
            className="login-navbar-logo"
            alt="Sparse"
            loading="eager"
            decoding="async" />
          

<span className="login-navbar-title">
<span className="sparse-brand">Sparse</span>{" "}
<span className="identity-brand">Recovery</span>{" "}
<span className="pvt-trademark">Secure</span>
</span>

</div>

</div>

<div className="login-card" style={{ transform: "translateZ(0)" }}>

<button
          className="back-button"
          onClick={() => navigate(-1)}
          aria-label="Back">
          
<FaArrowLeft />
</button>

<div className="login-brand">

<img
            src="/assets/logo.png"
            className="login-logo"
            alt="Sparse"
            loading="lazy"
            decoding="async" />
          

<span className="login-title">
Sparse
</span>

</div>

{step === 1 &&

        <>

<h2 className="login-heading">
Find your account
</h2>

<p className="verify-text">
Search for your account using your username or the email address linked to it.  
Enter the details below and we’ll help you securely recover access to your account.
</p>

<form className="login-form" onSubmit={handleFind}>

<input
              type="text"
              placeholder="Username or Email"
              className="login-input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required />
            

<button
              type="submit"
              className="login-button"
              disabled={loading}>
              

{loading ?
              <div className="login-loader"></div> :

              "Find Account"
              }

</button>

</form>

</>

        }

{step === 2 &&

        <>

<h2 className="login-heading">
Account found
</h2>

			{skeleton || !userData ?

          <div className="recover-account-card skeleton">

			<div className="recover-avatar-skeleton"></div>
			<div className="skeleton-line"></div>
			<div className="skeleton-line short"></div>

			</div> :



          <div className="recover-account-card">

			{userData.photo ?
            <img
              src={userData.photo}
              className="recover-avatar show"
              alt="profile"
              loading="lazy"
              decoding="async" /> :


            <FaUserCircle size={80} className="recover-avatar" />
            }

			<p className="recover-name">
			{userData.name}
			</p>

			<p className="recover-username">
			@{userData.username}
			</p>

				</div>

          }

<div className="recover-methods">

<p className="recover-method-title">
Recover using
</p>

<div className="recover-method-option">

<FaEnvelope />

<span className="recover-email">
{userData ? maskEmail(userData.email) : "loading"}
</span>

</div>

</div>

<button
            className="login-button"
            onClick={handleSendReset}
            disabled={sending}>
            

{sending ?
            <div className="login-loader"></div> :

            "Send Reset Link"
            }

</button>

</>

        }

</div>

</div>);



}

export default Recover;