import React, { useEffect, useState } from "react";
import "./Login.css";
import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

import { auth, db } from "../firebase";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged } from
"firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp } from
"firebase/firestore";

function Signup() {

  const navigate = useNavigate();
  const location = useLocation();

  const [valid, setValid] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {

    window.scrollTo(0, 0);

    const unsubscribe = onAuthStateChanged(auth, (user) => {

      if (user) {
        const authDeviceSync = sessionStorage.getItem("auth_device_sync");

        if (authDeviceSync === "pending") {
          return;
        }
      }

      if (user && user.emailVerified) {
        navigate("/dashboard", { replace: true });
        return;
      }

      const params = new URLSearchParams(location.search);

      const authToken = params.get("auth");
      const sessToken = params.get("sess");

      if (!authToken || !sessToken) {
        navigate("/home", { replace: true });
        return;
      }

      setValid(true);
      setAuthReady(true);

    });

    return () => unsubscribe();

  }, [location, navigate]);

  const generateToken = (length = 32) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateSessionId = () => {
    return crypto.randomUUID();
  };

  const generateRandomUsername = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let username = "";
    for (let i = 0; i < 8; i++) {
      username += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return username;
  };

  const generateUniqueUsername = async () => {

    let username = "";
    let exists = true;

    while (exists) {

      username = generateRandomUsername();

      const usernameRef = doc(db, "usernames", username);
      const snap = await getDoc(usernameRef);

      exists = snap.exists();

    }

    return username;

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

  const getDeviceInfo = () => {

    const ua = navigator.userAgent;

    let device = "Desktop";

    if (/mobile/i.test(ua)) device = "Mobile";
    if (/tablet/i.test(ua)) device = "Tablet";

    const sessionId = generateSessionId();

    localStorage.setItem("session_id", sessionId);

    return {
      sessionId: sessionId,
      device: device,
      platform: navigator.platform,
      userAgent: ua,
      loginTime: new Date()
    };

  };

  const saveDeviceLogin = async (uid, email, username) => {
    const deviceInfo = getDeviceInfo();
    const ref = doc(db, "devicelogins", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        email: email,
        username: username,
        devices: [deviceInfo]
      });
    } else {
      const existing = snap.data().devices || [];
      const already = existing.find((d) => d.sessionId === deviceInfo.sessionId);
      if (!already) {
        await updateDoc(ref, {
          devices: arrayUnion(deviceInfo)
        });
      }
    }
  };


  const saveLoginActivity = async (uid) => {
    const sessionId = localStorage.getItem("session_id") || "unknown";
    const lastLoginKey = `last_login_logged_${uid}_${sessionId}`;

    if (sessionStorage.getItem(lastLoginKey)) return;

    const ua = navigator.userAgent;
    let device = "Desktop";
    if (/android/i.test(ua)) device = "Android";
    if (/iphone|ipad|ipod/i.test(ua)) device = "iPhone";
    if (/mobile/i.test(ua)) device = "Mobile";
    let browser = "Browser";
    if (ua.includes("Edg")) browser = "Edge";else
    if (ua.includes("Chrome")) browser = "Chrome";else
    if (ua.includes("Firefox")) browser = "Firefox";else
    if (ua.includes("Safari")) browser = "Safari";
    const now = new Date();
    await updateDoc(doc(db, "users", uid), {
      activity: arrayUnion({
        type: "login",
        text: `New login from ${browser} ${device}`,
        time: now.toISOString()
      })
    });

    sessionStorage.setItem(lastLoginKey, "true");
    sessionStorage.setItem("last_login_logged", sessionId);
  };

  const handleBack = () => {

    const { authToken, sessionToken } = getTokens();

    navigate(`/login?auth=${authToken}&sess=${sessionToken}`);

  };

  const handleSignup = async (e) => {

    e.preventDefault();

    if (password !== confirmPassword) {
      window.showAlert("Passwords do not match", "error");
      return;
    }

    if (name.length > 15) {
      window.showAlert("Name must be 15 characters or less", "error");
      return;
    }

    const usernameRegex = /^[a-z0-9._]{4,15}$/;

    if (!usernameRegex.test(username)) {
      window.showAlert("Username must be 4–15 characters using a-z 0-9 . _", "error");
      return;
    }

    setLoading(true);
    sessionStorage.setItem("auth_device_sync", "pending");

    try {

      const usernameLower = username.toLowerCase();

      const usernameRef = doc(db, "usernames", usernameLower);
      const usernameSnap = await getDoc(usernameRef);

      if (usernameSnap.exists()) {
        window.showAlert("Username already taken", "error");
        sessionStorage.removeItem("auth_device_sync");
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name: name,
        username: usernameLower,
        email: email,
        profilePhoto: "",
        bio: "",
        status: "",
        gender: "Confidential",
        createdAt: serverTimestamp()
      });

      await setDoc(usernameRef, {
        uid: user.uid,
        email: email
      });

      await saveDeviceLogin(user.uid, email, usernameLower);
      await saveLoginActivity(user.uid);
      sessionStorage.setItem("auth_device_sync", "ready");

      await sendEmailVerification(user);

      window.showAlert("Verification email sent", "success");

      navigate("/verify-email");

    } catch (err) {

      sessionStorage.removeItem("auth_device_sync");
      window.showAlert(err.message, "error");

    }

    setLoading(false);

  };

  const handleGoogleSignup = async () => {

    setGoogleLoading(true);
    sessionStorage.setItem("auth_device_sync", "pending");

    try {

      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      let usernameGenerated = "";

      if (!userSnap.exists()) {

        usernameGenerated = await generateUniqueUsername();

        await setDoc(userRef, {
          name: (user.displayName || "User").slice(0, 15),
          username: usernameGenerated,
          email: user.email,
          profilePhoto: user.photoURL || "",
          bio: "",
          status: "",
          gender: "Confidential",
          createdAt: serverTimestamp()
        });

        const usernameRef = doc(db, "usernames", usernameGenerated);

        await setDoc(usernameRef, {
          uid: user.uid,
          email: user.email
        }, { merge: true });

      } else {

        usernameGenerated = userSnap.data().username;

        const usernameRef = doc(db, "usernames", usernameGenerated);
        const usernameSnap = await getDoc(usernameRef);

        if (usernameSnap.exists()) {

          const data = usernameSnap.data();

          if (!data.email) {

            await updateDoc(usernameRef, {
              email: user.email
            });

          }

        } else {

          await setDoc(usernameRef, {
            uid: user.uid,
            email: user.email
          }, { merge: true });

        }

      }

      await saveDeviceLogin(user.uid, user.email, usernameGenerated);
      await saveLoginActivity(user.uid);
      sessionStorage.setItem("auth_device_sync", "ready");

      window.showAlert("Google login successful", "success");

      navigate("/dashboard", { replace: true });

    } catch (err) {

      sessionStorage.removeItem("auth_device_sync");
      window.showAlert("Google login failed", "error");

    }

    setGoogleLoading(false);

  };

  const handleLoginRedirect = () => {

    const { authToken, sessionToken } = getTokens();

    navigate(`/login?auth=${authToken}&sess=${sessionToken}`);

  };

  if (!authReady) return null;
  if (!valid) return null;

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
<span className="identity-brand">Identity</span>{" "}
<span className="pvt-trademark">Secure</span>
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
Create your account
</h2>

<form className="login-form" onSubmit={handleSignup}>

<input type="text" placeholder="Name" className="login-input" value={name} onChange={(e) => setName(e.target.value)} required />

<input type="text" placeholder="Username" className="login-input" value={username} onChange={(e) => setUsername(e.target.value)} required />

<input type="email" placeholder="Email address" className="login-input" value={email} onChange={(e) => setEmail(e.target.value)} required />

<input type="password" placeholder="Password" className="login-input" value={password} onChange={(e) => setPassword(e.target.value)} required />

<input type="password" placeholder="Confirm Password" className="login-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

<button type="submit" className="login-button" disabled={loading}>
{loading ? <div className="login-loader"></div> : "Create Account"}
</button>

</form>

<div className="login-options">

<p className="account-text">
Already have an account?{" "}
<span className="create-account-link" onClick={handleLoginRedirect}>
Sign in
</span>
</p>

</div>

<div className="login-divider">
<span>or</span>
</div>

<button className="google-button" onClick={handleGoogleSignup} disabled={googleLoading}>

{googleLoading ?
          <div className="google-loader"></div> :

          <>
<img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              style={{ width: "16px", height: "16px", marginRight: "8px" }} />
            
Continue with Google
</>
          }

</button>

</div>

</div>);



}

export default Signup;