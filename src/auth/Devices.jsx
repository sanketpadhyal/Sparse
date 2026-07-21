import React, { useEffect, useState, useRef } from "react";
import "./Login.css";
import { FaArrowLeft, FaDesktop, FaMobileAlt, FaLaptop, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { sendPushNotification } from "../supabase";

function Devices() {

  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  const prevDevicesRef = useRef([]);

  const currentSession = localStorage.getItem("session_id");

  useEffect(() => {

    window.scrollTo(0, 0);

    let unsubSnap = null;
    const unsubAuth = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const ref = doc(db, "devicelogins", user.uid);

        let first = true;

        unsubSnap = onSnapshot(ref, (snap) => {
          const newDevices = snap.exists() ? snap.data().devices || [] : [];

          if (first) {
            setDevices(newDevices);
            prevDevicesRef.current = newDevices;
            first = false;
            setLoading(false);
            return;
          }

          const prev = prevDevicesRef.current || [];

          const added = newDevices.filter((nd) => !prev.find((d) => d.sessionId === nd.sessionId));

          added.forEach((ad) => {
            if (ad.sessionId === currentSession) return;

            try {
              sendPushNotification({
                receiver_uid: user.uid,
                message: `New login from ${ad.platform || ad.device || 'a device'}`,
                sender_name: "Sparse Security"
              });
            } catch (e) {
              console.log(e);
            }

          });

          prevDevicesRef.current = newDevices;
          setDevices(newDevices);
          setLoading(false);

        });

      } catch (err) {
        window.showAlert("Failed to load devices", "error");
        setLoading(false);
      }

    });

    return () => {
      if (unsubAuth) unsubAuth();
      if (unsubSnap) unsubSnap();
    };

  }, [navigate, currentSession]);

  const handleRemoveDevice = async (sessionId) => {

    setRemoving(sessionId);

    await new Promise((r) => setTimeout(r, 2000));

    try {

      const user = auth.currentUser;
      if (!user) return;

      const ref = doc(db, "devicelogins", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) return;

      let list = snap.data().devices || [];

      list = list.filter((d) => d.sessionId !== sessionId);

      await updateDoc(ref, { devices: list });

      setDevices(list);

      window.showAlert("Device logged out", "success");

    } catch (err) {

      window.showAlert("Failed to remove device", "error");

    }

    setRemoving(null);
    setConfirming(null);

  };

  const handleLogoutAll = async () => {

    setLogoutAllLoading(true);

    try {

      const user = auth.currentUser;
      if (!user) return;

      const ref = doc(db, "devicelogins", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setLogoutAllLoading(false);
        return;
      }

      const list = snap.data().devices || [];

      const kept = list.filter((d) => d.sessionId === currentSession);

      await updateDoc(ref, { devices: kept });

      setDevices(kept);

      window.showAlert("Logged out other devices", "success");

    } catch (err) {
      console.log(err);
      window.showAlert("Failed to logout other devices", "error");
    }

    setLogoutAllLoading(false);

  };

  const detectBrowser = (ua) => {

    if (/Edg/i.test(ua)) return "Edge";
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return "Chrome";
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
    if (/Firefox/i.test(ua)) return "Firefox";

    return "Browser";

  };

  const detectOS = (ua) => {

    if (/iPhone|iPad/i.test(ua)) return "iOS";
    if (/Mac OS X/i.test(ua)) return "macOS";
    if (/Windows/i.test(ua)) return "Windows";
    if (/Android/i.test(ua)) return "Android";
    if (/Linux/i.test(ua)) return "Linux";

    return "OS";

  };

  const detectDeviceType = (ua) => {

    if (/iPhone|Android.*Mobile/i.test(ua)) return "Mobile";
    if (/iPad|Tablet/i.test(ua)) return "Tablet";
    if (/Macintosh|Windows|Linux/i.test(ua)) return "Desktop";

    return "Desktop";

  };

  const detectDeviceModel = (ua) => {

    if (/iPhone/.test(ua)) {

      if (/iPhone14,4/.test(ua)) return "iPhone 13 mini";
      if (/iPhone13,1/.test(ua)) return "iPhone 12 mini";

      return "iPhone";

    }

    if (/iPad/.test(ua)) return "iPad";

    if (/Android/.test(ua)) {

      const match = ua.match(/Android.*;\s([^)]+)\)/);

      if (match && match[1]) {
        return match[1];
      }

      return "Android Device";

    }

    if (/Macintosh/.test(ua)) return "Mac";
    if (/Windows/.test(ua)) return "Windows PC";

    return "Device";

  };

  const getIcon = (ua) => {

    if (/iPhone|Android.*Mobile/i.test(ua)) {
      return <FaMobileAlt className="device-icon" />;
    }

    if (/Macintosh|Windows|Linux/i.test(ua)) {
      return <FaLaptop className="device-icon" />;
    }

    return <FaDesktop className="device-icon" />;

  };

  return (

    <div className="login-page">

<div className="login-navbar">

<div
          className="login-navbar-brand"
          onClick={() => navigate("/dashboard")}>
          

<img
            src="/assets/logo.png"
            className="login-navbar-logo"
            alt="Sparse" />
          

<span className="login-navbar-title">
<span className="sparse-brand">Sparse</span>{" "}
<span className="identity-brand">Devices</span>{" "}
<span className="pvt-trademark">Lab</span>
</span>

</div>

</div>

<div className="login-card">

<button
          className="back-button"
          onClick={() => navigate(-1)}>
          
<FaArrowLeft />
</button>

<div className="login-brand">

<img
            src="/assets/logo.png"
            className="login-logo"
            alt="Sparse" />
          

<span className="login-title">
Devices
</span>

</div>

<h2 className="login-heading">
Logged in devices
</h2>

<div style={{ marginTop: 8, marginBottom: 12 }}>
	<button
            className="device-logout"
            onClick={handleLogoutAll}
            disabled={logoutAllLoading}>
            
		{logoutAllLoading ? <div className="login-loader"></div> : "Logout all other devices"}
	</button>
</div>

{loading ?

        <div className="device-list">

{[1, 2, 3].map((i) =>

          <div key={i} className="device-card device-skeleton">

<div className="device-left">

<div className="device-skeleton-icon"></div>

<div className="device-info">

<div className="device-skeleton-line"></div>
<div className="device-skeleton-line short"></div>
<div className="device-skeleton-line short"></div>

</div>
</div>

<div className="device-right">
<div className="device-skeleton-button"></div>
</div>

</div>

          )}

</div> :



        <div className="device-list">

{devices.length === 0 &&

          <p className="account-text">
No active devices found
</p>

          }

{devices.map((d, index) => {

            let time = "";

            if (d.loginTime?.seconds) {
              time = new Date(d.loginTime.seconds * 1000).toLocaleString();
            } else if (d.loginTime) {
              time = new Date(d.loginTime).toLocaleString();
            }

            const ua = d.userAgent || "";

            const browser = detectBrowser(ua);
            const os = detectOS(ua);
            const model = detectDeviceModel(ua);

            const title = `${model} • ${browser} • ${os}`;

            const isCurrent = d.sessionId === currentSession;

            return (

              <div key={index} className="device-card">

<div className="device-left">

{getIcon(ua)}

<div className="device-info">

<span className="device-title">
{title} {isCurrent && "(Current Device)"}
</span>

<span className="device-type">
{detectDeviceType(ua)}
</span>

<span className="device-time">
{time}
</span>

</div>

</div>

{!isCurrent && (

                confirming === d.sessionId ?

                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>

<button
                    className="device-logout"
                    onClick={() => handleRemoveDevice(d.sessionId)}
                    disabled={removing === d.sessionId}>
                    

{removing === d.sessionId ?
                    <div className="login-loader"></div> :
                    "Yes"}

</button>

<button
                    className="device-logout"
                    onClick={() => setConfirming(null)}>
                    
No
</button>

</div> :



                <button
                  className="device-logout"
                  onClick={() => setConfirming(d.sessionId)}>
                  
<FaSignOutAlt />
</button>)



                }

</div>);



          })}

</div>

        }

</div>

</div>);



}

export default Devices;