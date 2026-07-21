import DashboardNavbar from "../components/DashboardNavbar";
import BottomNav from "../components/BottomNav";
import "./Settings.css";

import { useNavigate } from "react-router-dom";
import { useLayoutEffect, useEffect, useState } from "react";

import { FaArrowLeft } from "react-icons/fa";

import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import {
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut } from
"firebase/auth";

function ChangePassword() {

  const navigate = useNavigate();

  const [loadingProfile, setLoadingProfile] = useState(true);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [photo, setPhoto] = useState("");
  const [lastChanged, setLastChanged] = useState("");

  const [needsCurrent, setNeedsCurrent] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [strength, setStrength] = useState(0);

  const [loading, setLoading] = useState(false);

  const currentSession = localStorage.getItem("session_id");

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const formatDate = (ts) => {

    if (!ts) return "";

    const date = ts.seconds ?
    new Date(ts.seconds * 1000) :
    new Date(ts);

    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  };

  const calculateStrength = (pass) => {

    let score = 0;

    if (pass.length >= 6) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    setStrength(score);

  };

  useEffect(() => {
    calculateStrength(newPassword);
  }, [newPassword]);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        navigate("/home");
        return;
      }

      try {

        await user.getIdToken(true);

        const providers = user.providerData.map((p) => p.providerId);

        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {

          const data = snap.data();

          setName(data.name || "");
          setUsername(data.username || "");
          setPhoto(data.profilePhoto || "");
          setLastChanged(data.passwordChangedAt || "");

          if (providers.includes("google.com") && !data.passwordChangedAt) {
            setNeedsCurrent(false);
          } else {
            setNeedsCurrent(true);
          }

        }

      } catch (err) {
        console.error(err);
      }

      setLoadingProfile(false);

    });

    return () => unsubscribe();

  }, [navigate]);

  const logoutOtherDevices = async (user) => {

    try {

      const ref = doc(db, "devicelogins", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) return;

      let devices = snap.data().devices || [];

      devices = devices.filter((d) => d.sessionId === currentSession);

      await updateDoc(ref, { devices });

    } catch (err) {
      console.error(err);
    }

  };

  const handleChangePassword = async () => {

    const user = auth.currentUser;
    if (!user) return;

    if (needsCurrent && currentPassword.trim() === "") {
      window.showAlert("Enter your current password", "error");
      return;
    }

    if (newPassword.length < 6) {
      window.showAlert("Password must be at least 6 characters", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      window.showAlert("Passwords do not match", "error");
      return;
    }

    setLoading(true);

    try {

      await user.reload();
      await user.getIdToken(true);

      const providers = user.providerData.map((p) => p.providerId);

      if (needsCurrent && providers.includes("password")) {

        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );

        await reauthenticateWithCredential(user, credential);

      }

      await updatePassword(user, newPassword);

      try {
        await fetch("https://sparse-mail-backend-425667854809.europe-west1.run.app/send-password-changed", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: user.email,
            name: name,
            username: username,
            profilePhoto: photo
          })
        });
      } catch (e) {}

      const ref = doc(db, "users", user.uid);

      await updateDoc(ref, {
        passwordChangedAt: Date.now()
      });

      await logoutOtherDevices(user);

      setLastChanged(Date.now());

      window.showAlert("Password updated successfully", "success");

      navigate(-1);

    } catch (err) {

      if (err.code === "auth/requires-recent-login") {

        window.showAlert("Session expired. Please login again to continue.", "info");

        await signOut(auth);

        navigate("/login");

        return;

      }

      if (
      err.code === "auth/wrong-password" ||
      err.code === "auth/invalid-credential")
      {
        window.showAlert("Current password is incorrect", "error");
      } else
      if (err.code === "auth/weak-password") {
        window.showAlert("Password is too weak", "error");
      } else
      if (err.code === "auth/too-many-requests") {
        window.showAlert("Too many attempts. Try again later.", "error");
      } else
      {
        window.showAlert("Failed to update password", "error");
      }

    }

    setLoading(false);

  };

  return (

    <>

<DashboardNavbar />

<div className="settings-page">

<div className="edit-navbar">

<button
            className="back-btn"
            onClick={() => navigate(-1)}>
            
<FaArrowLeft />
</button>

<h2>Change Password</h2>

<div style={{ width: "32px" }}></div>

</div>

<div className="settings-card">

{loadingProfile ?

          <div className="settings-skeleton">

<div className="skeleton-avatar"></div>

<div className="skeleton-line"></div>
<div className="skeleton-line"></div>

<div className="skeleton-input"></div>
<div className="skeleton-input"></div>
<div className="skeleton-input"></div>

</div> :



          <>

<div className="settings-section">

<div className="account-profile-panel">

<img
                  src={photo || "/assets/profile.png"}
                  className="account-profile-photo"
                  alt="profile" />
                

<div className="account-profile-info">

<h4>{name}</h4>
<p>@{username}</p>

</div>

</div>

</div>

<div className="settings-section">

<p className="settings-heading">
Password info
</p>

{lastChanged &&

              <p className="password-last-changed">
Last changed on {formatDate(lastChanged)}
</p>

              }

</div>

<div className="settings-section">

<p className="settings-heading">
Update password
</p>

{needsCurrent &&

              <div className="settings-input-group">

<input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="settings-input" />
                

<p
                  className="recover-password-link"
                  onClick={() => navigate("/recover")}
                  style={{ cursor: "pointer" }}>
                  
Don't know your current password? Go to Recover Account
</p>

</div>

              }

<div className="settings-input-group">

<input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="settings-input" />
                

<div className="password-meter">

<div
                    className={`password-meter-fill strength-${strength}`}
                    style={{ width: `${strength * 25}%` }}>
                  </div>

</div>

</div>

<div className="settings-input-group">

<input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="settings-input" />
                

</div>

<button
                className="logout-btn"
                onClick={handleChangePassword}
                disabled={loading}>
                

{loading ?
                <div className="btn-loader"></div> :

                "Update password"
                }

</button>

</div>

</>

          }

</div>

</div>

<BottomNav />

</>);



}

export default ChangePassword;