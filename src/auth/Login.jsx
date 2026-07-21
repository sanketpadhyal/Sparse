import React, { useEffect, useState } from "react";
import "./Login.css";
import { FaUserPlus, FaKey, FaArrowLeft } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

import { auth, db } from "../firebase";

import {
  signInWithEmailAndPassword,
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

function Login() {

  const navigate = useNavigate();
  const location = useLocation();

  const [valid, setValid] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

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

    let sessionId = localStorage.getItem("session_id");

    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem("session_id", sessionId);
    }

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
    if (ua.includes("Chrome")) browser = "Chrome";
    if (ua.includes("Firefox")) browser = "Firefox";
    if (ua.includes("Safari")) browser = "Safari";
    if (ua.includes("Edge")) browser = "Edge";
    const now = new Date();
    const activity = {
      type: "login",
      text: `New login from ${browser} ${device}`,
      time: now.toISOString()
    };
    await updateDoc(doc(db, "users", uid), {
      activity: arrayUnion(activity)
    });

    sessionStorage.setItem(lastLoginKey, "true");
    sessionStorage.setItem("last_login_logged", sessionId);
  };

  useEffect(() => {

    window.scrollTo(0, 0);

    const unsubscribe = onAuthStateChanged(auth, (user) => {

      if (user) {
        const authDeviceSync = sessionStorage.getItem("auth_device_sync");

        if (authDeviceSync === "pending") {
          return;
        }

        if (user.emailVerified) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/verify-email", { replace: true });
        }

        return;

      }

      const params = new URLSearchParams(location.search);

      const authParam = params.get("auth");
      const sessParam = params.get("sess");

      if (!authParam || !sessParam) {
        navigate("/home", { replace: true });
        return;
      }

      if (authParam.length < 20 || sessParam.length < 20) {
        navigate("/home", { replace: true });
        return;
      }

      const savedAuth = sessionStorage.getItem("auth_token");
      const savedSess = sessionStorage.getItem("session_token");

      if (!savedAuth || !savedSess) {

        sessionStorage.setItem("auth_token", authParam);
        sessionStorage.setItem("session_token", sessParam);

      }

      setValid(true);
      setAuthReady(true);

    });

    return () => unsubscribe();

  }, [location, navigate]);

  const handleBack = () => {

    const { authToken, sessionToken } = getTokens();

    navigate(`/home?auth=${authToken}&sess=${sessionToken}`);

  };

  const handleLogin = async (e) => {

    e.preventDefault();

    setLoading(true);
    sessionStorage.setItem("auth_device_sync", "pending");

    try {

      let input = identifier.trim();
      let loginEmail = input;
      let username = "";

      if (!input.includes("@")) {

        username = input.toLowerCase();

        const usernameRef = doc(db, "usernames", username);
        const usernameSnap = await getDoc(usernameRef);

        if (!usernameSnap.exists()) {
          throw new Error("Username not found");
        }

        loginEmail = usernameSnap.data().email;

      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        password
      );

      const user = userCredential.user;

      const userSnap = await getDoc(doc(db, "users", user.uid));
      const userData = userSnap.data();

      const usernameRef = doc(db, "usernames", userData.username);
      const usernameSnap = await getDoc(usernameRef);

      if (usernameSnap.exists()) {

        const data = usernameSnap.data();

        if (!data.email) {

          await updateDoc(usernameRef, {
            email: userData.email
          });

        }

      } else {

        await setDoc(usernameRef, {
          uid: user.uid,
          email: userData.email
        }, { merge: true });

      }


      await saveDeviceLogin(
        user.uid,
        userData.email,
        userData.username
      );
      await saveLoginActivity(user.uid);
      sessionStorage.setItem("auth_device_sync", "ready");

      const freshSnap = await getDoc(doc(db, "users", user.uid));
      const freshData = freshSnap.data();

      const ua = navigator.userAgent;

      let device = "Desktop";
      if (/android/i.test(ua)) device = "Android";
      if (/iphone/i.test(ua)) device = "iPhone";
      if (/mobile/i.test(ua)) device = "Mobile";

      let browser = "Browser";
      if (ua.includes("Chrome")) browser = "Chrome";
      if (ua.includes("Firefox")) browser = "Firefox";
      if (ua.includes("Safari")) browser = "Safari";
      if (ua.includes("Edge")) browser = "Edge";

      fetch("https://sparse-mail-backend-425667854809.europe-west1.run.app/send-login-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: userData.email,
          name: userData.name,
          username: userData.username,
          profilePhoto: freshData.profilePhoto || user.photoURL || "",
          device,
          browser
        })
      });


      if (user.emailVerified) {

        window.showAlert("Login successful", "success");
        navigate("/dashboard", { replace: true });

      } else {

        window.showAlert("Please verify your email first", "info");
        navigate("/verify-email", { replace: true });

      }

    } catch (err) {

      sessionStorage.removeItem("auth_device_sync");
      window.showAlert("Invalid username/email or password", "error");

    }

    setLoading(false);

  };

  const handleGoogleLogin = async () => {

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

      const freshSnap = await getDoc(doc(db, "users", user.uid));
      const freshData = freshSnap.data();

      const ua = navigator.userAgent;

      let device = "Desktop";
      if (/android/i.test(ua)) device = "Android";
      if (/iphone/i.test(ua)) device = "iPhone";
      if (/mobile/i.test(ua)) device = "Mobile";

      let browser = "Browser";
      if (ua.includes("Chrome")) browser = "Chrome";
      if (ua.includes("Firefox")) browser = "Firefox";
      if (ua.includes("Safari")) browser = "Safari";
      if (ua.includes("Edge")) browser = "Edge";

      fetch("https://sparse-mail-backend-425667854809.europe-west1.run.app/send-login-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: user.email,
          name: freshData.name,
          username: freshData.username,
          profilePhoto: freshData.profilePhoto || user.photoURL || "",
          device,
          browser
        })
      });


      window.showAlert("Google login successful", "success");

      navigate("/dashboard", { replace: true });

    } catch (err) {

      sessionStorage.removeItem("auth_device_sync");
      window.showAlert("Google login failed", "error");

    }

    setGoogleLoading(false);

  };

  const handleSignup = () => {

    const { authToken, sessionToken } = getTokens();

    navigate(`/signup?auth=${authToken}&sess=${sessionToken}`);

  };

  const handleRecover = () => {
    navigate("/recover");
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
Sign in to your account
</h2>

<form
          className="login-form"
          onSubmit={handleLogin}>
          

<input
            type="text"
            placeholder="Username or Email"
            className="login-input"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required />
          

<input
            type="password"
            placeholder="Password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required />
          

<button
            type="submit"
            className="login-button"
            disabled={loading}>
            

{loading ?
            <div className="login-loader"></div> :

            "Sign In"
            }

</button>

</form>

<br />

<div className="login-options">

<button
            className="create-account-button"
            onClick={handleSignup}>
            
<FaUserPlus className="signup-icon" /> Sign Up
</button>

<button
            className="create-account-button"
            onClick={handleRecover}>
            
<FaKey className="signup-icon" /> Recover Account
</button>

</div>

<div className="login-divider">
<span>or</span>
</div>

<button
          className="google-button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}>
          

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

export default Login;