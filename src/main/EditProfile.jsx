import React, { useEffect, useState, useRef } from "react";
import "./EditProfile.css";

import { auth, db, storage } from "../firebase";
import { sendPushNotification } from "../supabase";
import { doc, getDoc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

import BottomNav from "../components/BottomNav";
import DashboardNavbar from "../components/DashboardNavbar";

import ProfilePhotoCropper from "../components/ProfilePhotoCropper";

function EditProfile() {

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profilePhoto, setProfilePhoto] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState("");
  const [gender, setGender] = useState("Confidential");
  const [dob, setDob] = useState("");

  const [rawImage, setRawImage] = useState(null);

  const [improvingBio, setImprovingBio] = useState(false);

  useEffect(() => {

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, left: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        navigate("/home");
        return;
      }

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {

        const data = snap.data();

        setProfilePhoto(data.profilePhoto || "");
        setName(data.name || "");
        setUsername(data.username || "");
        setOriginalUsername(data.username || "");
        setBio(data.bio || "");
        setStatus(data.status || "");
        setDob(data.dob || "");

        if (data.gender) {
          setGender(data.gender);
        } else {
          setGender("Confidential");
          await updateDoc(ref, { gender: "Confidential" });
        }

      }

      setLoading(false);

    });

    return () => unsubscribe();

  }, [navigate]);

  const openFilePicker = () => {
    fileInputRef.current.click();
  };

  const handlePhotoChange = (e) => {

    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      window.showAlert("Image must be less than 5 MB", "error");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setRawImage(reader.result);
    };

    reader.readAsDataURL(file);

  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    if (value.length <= 15) {
      setName(value);
    }
  };

  const handleUsernameChange = (e) => {
    let value = e.target.value.toLowerCase();
    if (value.length <= 15) {
      setUsername(value);
    }
  };

  const handleBioChange = (e) => {
    const value = e.target.value;
    if (value.length <= 150) {
      setBio(value);
    }
  };

  const handleStatusChange = (e) => {
    const value = e.target.value;
    if (value.length <= 12) {
      setStatus(value);
    }
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);

    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();

    if (m < 0 || m === 0 && today.getDate() < birth.getDate()) {
      age--;
    }

    return age;
  };

  const handleSave = async () => {

    const user = auth.currentUser;
    if (!user) return;

    const usernameRegex = /^[a-z0-9._]{4,15}$/;

    if (!usernameRegex.test(username)) {
      window.showAlert("Username must be 4-15 characters and only a-z 0-9 . _ allowed", "error");
      return;
    }

    if (name.length > 15) {
      window.showAlert("Name max 15 characters", "error");
      return;
    }

    if (!dob) {
      window.showAlert("Please select date of birth", "error");
      return;
    }

    const age = calculateAge(dob);

    if (age < 12) {
      window.showAlert("Minimum age is 12", "error");
      return;
    }

    if (age > 80) {
      window.showAlert("Maximum age allowed is 80", "error");
      return;
    }

    setSaving(true);

    try {

      const oldSnap = await getDoc(doc(db, "users", user.uid));
      const oldData = oldSnap.data();
      const statusChanged = oldData.status !== status;

      const newUsername = username.toLowerCase().trim();

      if (newUsername !== originalUsername) {

        const usernameRef = doc(db, "usernames", newUsername);
        const usernameSnap = await getDoc(usernameRef);

        if (usernameSnap.exists()) {
          window.showAlert("Username already taken", "error");
          setSaving(false);
          return;
        }

        await deleteDoc(doc(db, "usernames", originalUsername));

        await setDoc(doc(db, "usernames", newUsername), {
          uid: user.uid,
          email: user.email
        });

        await updateDoc(doc(db, "devicelogins", user.uid), {
          username: newUsername
        });

      }

      let photoUrl = profilePhoto;

      if (profilePhoto && profilePhoto.startsWith("data:image")) {

        const storageRef = ref(storage, `profilePhotos/${user.uid}`);

        await uploadString(storageRef, profilePhoto, "data_url");

        photoUrl = await getDownloadURL(storageRef);

      }

      await updateDoc(doc(db, "users", user.uid), {
        name: name,
        username: newUsername,
        bio: bio,
        status: status,
        statusUpdatedAt: statusChanged ? Date.now() : oldData.statusUpdatedAt || 0,
        profilePhoto: photoUrl,
        gender: gender,
        dob: dob
      });

      let message = "";

      if (oldData.name !== name) {
        message = "changed their name";
      }

      if (oldData.status !== status) {
        message = "updated their status";
      }

      if (oldData.bio !== bio) {
        message = "updated their bio";
      }

      if (oldData.profilePhoto !== photoUrl) {
        message = "changed profile photo";
      }

      if (!message) message = "updated their profile";

      const followers = oldData.followersList || [];

      followers.forEach((follower) => {
        sendPushNotification({
          receiver_uid: follower,
          sender_name: name,
          message: "updated profile"
        });
      });

      window.showAlert("Profile updated", "success");
      navigate("/dashboard/profile");

    } catch (err) {

      console.error(err);
      window.showAlert("Failed to update profile", "error");

    }

    setSaving(false);

  };

  const improveBio = async () => {
    if (bio.trim().split(/\s+/).length < 10) {
      window.showAlert?.("Write at least 10 words in bio", "warning");
      return;
    }

    try {

      setImprovingBio(true);

      const prompt = `
Rewrite the following bio.

STRICT RULES:
- Do NOT change identity
- Do NOT say you are Odoy or anything else
- Only improve wording and clarity
- Keep same meaning
- Keep same person (user)
- No extra lines
- Use related Emojis
-  Keep under 120 characters
Bio:
${bio}
`;

      const res = await fetch(
        process.env.REACT_APP_ODOY_AI_URL || "https://your-ai-service.run.app/ai",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: prompt
          })
        }
      );

      const data = await res.json();

      let text = (data?.reply || bio).trim();

      text = text.
      replace(/["']/g, "").
      replace(/\(.*?\)/g, "").
      replace(/bio[:\-]*/gi, "").
      replace(/i am odoy|odoy ai|generated by odoy/gi, "").
      trim();

      setBio(text);

    } catch (e) {

      window.showAlert?.("AI failed", "error");

    }

    setImprovingBio(false);

  };

  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate());
  const minDate = new Date(today.getFullYear() - 80, today.getMonth(), today.getDate());

  const formatDate = (d) => d.toISOString().split("T")[0];

  return (

    <>
<DashboardNavbar />

<div className="edit-profile-page">

<div className="edit-navbar">

<button
            className="back-btn"
            onClick={() => navigate("/dashboard/profile")}>
            
<FaArrowLeft />
</button>

<h2>Edit profile</h2>

<button
            className="save-btn"
            onClick={handleSave}
            disabled={saving}>
            
{saving ? "Saving..." : "Done"}
</button>

</div>

<div className="edit-profile-content">

{loading ?

          <div className="edit-skeleton">

<div className="skeleton-avatar"></div>

<div className="skeleton-field"></div>
<div className="skeleton-field"></div>
<div className="skeleton-field"></div>
<div className="skeleton-field"></div>
<div className="skeleton-field"></div>

<div className="skeleton-field large"></div>

</div> :



          <>

<div className="photo-section">

<div className="photo-wrapper">
<img
                  src={profilePhoto || "/assets/profile.png"}
                  alt="profile" />
                
</div>

<input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                style={{ display: "none" }} />
              

<p
                className="edit-photo-text"
                onClick={openFilePicker}>
                
Edit picture
</p>

</div>

<div className="edit-fields">

<div className="edit-row">
<label>Name</label>
<input
                  value={name}
                  onChange={handleNameChange} />
                
<div className="bio-limit">
{name.length}/15
</div>
</div>

<div className="edit-row">
<label>Username</label>
<input
                  value={username}
                  onChange={handleUsernameChange} />
                
<div className="bio-limit">
{username.length}/15
</div>
</div>

<div className="edit-row">
<label>Status</label>
<input
                  value={status}
                  onChange={handleStatusChange}
                  placeholder="What are you doing?" />
                
<div className="bio-limit">
{status.length}/12
</div>
</div>

<div className="edit-row">
<label>Gender</label>
<select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="edit-select">
                  
<option>Confidential</option>
<option>Male</option>
<option>Female</option>
<option>Other</option>
</select>
</div>

<div className="edit-row">
<label>Date of birth</label>
<input
                  type="date"
                  value={dob}
                  min={formatDate(minDate)}
                  max={formatDate(maxDate)}
                  onChange={(e) => setDob(e.target.value)} />
                
</div>

<div className="edit-row">

<label>Bio</label>

<textarea
                  value={bio}
                  onChange={handleBioChange}
                  rows="4"
                  placeholder="Tell something about yourself" />
                

<button
                  onClick={improveBio}
                  disabled={improvingBio}
                  className={`ai-bio-btn ${bio.trim().split(/\s+/).length < 10 ? "disabled" : ""}`}>
                  
{improvingBio ?
                  <div className="ai-loader"></div> :

                  <>
<img src="https://odoy.in/logo/logo.png" alt="" className="ai-logo" />
Improve bio with Odoy AI
</>
                  }
</button>

<div className="bio-limit">
{bio.length}/150 characters
</div>

</div>

</div>

</>

          }

</div>

</div>

<BottomNav />

{rawImage &&

      <ProfilePhotoCropper
        image={rawImage}
        onCancel={() => setRawImage(null)}
        onComplete={(cropped) => {
          setProfilePhoto(cropped);
          setRawImage(null);
        }} />


      }

</>);



}

export default EditProfile;