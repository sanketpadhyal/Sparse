import DashboardNavbar from "../components/DashboardNavbar";
import BottomNav from "../components/BottomNav";
import "./Settings.css";

import { useNavigate } from "react-router-dom";
import { useLayoutEffect, useEffect, useState } from "react";

import { FaArrowLeft, FaTrash, FaDatabase, FaExclamationTriangle } from "react-icons/fa";

import { auth, db, storage } from "../firebase";

import { ref, deleteObject } from "firebase/storage";

import {
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  signOut } from
"firebase/auth";

import {
  doc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayRemove } from
"firebase/firestore";

function DeleteAccount() {

  const navigate = useNavigate();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [photo, setPhoto] = useState("");
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmStep, setConfirmStep] = useState(0);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        navigate("/home");
        return;
      }

      try {

        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || "");
          setUsername(data.username || "");
          setPhoto(data.profilePhoto || "");
        }

      } catch (err) {
        console.error(err);
      }

      setLoadingProfile(false);

    });

    return () => unsubscribe();

  }, [navigate]);

  const startDeleteFlow = () => {

    if (confirmText !== "DELETE") {
      window.showAlert("Type DELETE to confirm", "error");
      return;
    }

    if (password.trim() === "") {
      window.showAlert("Enter your password", "error");
      return;
    }

    setConfirmStep(1);

  };

  const deleteUserStories = async (uid) => {

    const q = query(
      collection(db, "stories"),
      where("uid", "==", uid)
    );

    const snap = await getDocs(q);

    const deletions = [];

    for (const d of snap.docs) {

      const data = d.data();

      if (data.media) {
        const fileRef = ref(storage, data.media);
        deletions.push(deleteObject(fileRef).catch(() => {}));
      }

      deletions.push(deleteDoc(doc(db, "stories", d.id)));

    }

    await Promise.all(deletions);

  };

  const deleteUserPosts = async (uid) => {

    const q = query(
      collection(db, "posts"),
      where("uid", "==", uid)
    );

    const snap = await getDocs(q);

    const deletions = [];

    for (const d of snap.docs) {

      const data = d.data();

      if (data.photo) {
        const fileRef = ref(storage, data.photo);
        deletions.push(deleteObject(fileRef).catch(() => {}));
      }

      deletions.push(deleteDoc(doc(db, "posts", d.id)));

    }

    await Promise.all(deletions);

  };

  const removeUserLikesAndComments = async (uid) => {

    const postsSnap = await getDocs(collection(db, "posts"));

    const updates = [];

    postsSnap.forEach((d) => {

      const data = d.data();

      const likes = data.likes || [];
      const comments = data.comments || [];

      const newLikes = likes.filter((id) => id !== uid);
      const newComments = comments.
      filter((c) => c.uid !== uid).
      map((c) => ({
        ...c,
        likes: (c.likes || []).filter((id) => id !== uid),
        replies: (c.replies || []).filter((reply) => reply.uid !== uid)
      }));

      const commentsChanged =
      newComments.length !== comments.length ||
      newComments.some((comment, index) => {
        const original = comments[index];
        return (
          (comment.likes || []).length !== (original?.likes || []).length ||
          (comment.replies || []).length !== (original?.replies || []).length);

      });

      if (newLikes.length !== likes.length || commentsChanged) {

        updates.push(
          updateDoc(doc(db, "posts", d.id), {
            likes: newLikes,
            comments: newComments
          })
        );

      }

    });

    await Promise.all(updates);

  };

  const removeUserFromConnections = async (uid) => {

    const usersRef = collection(db, "users");

    const followersQuery = query(
      usersRef,
      where("followingList", "array-contains", uid)
    );

    const followingQuery = query(
      usersRef,
      where("followersList", "array-contains", uid)
    );

    const followersSnap = await getDocs(followersQuery);
    const followingSnap = await getDocs(followingQuery);

    const updates = [];

    followersSnap.forEach((d) => {
      updates.push(
        updateDoc(doc(db, "users", d.id), {
          followingList: arrayRemove(uid)
        })
      );
    });

    followingSnap.forEach((d) => {
      updates.push(
        updateDoc(doc(db, "users", d.id), {
          followersList: arrayRemove(uid)
        })
      );
    });

    await Promise.all(updates);

  };

  const deleteUsernameReference = async (username) => {

    try {
      await deleteDoc(doc(db, "usernames", username));
    } catch (err) {
      console.log(err);
    }

  };

  const executeDelete = async () => {

    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);

    try {

      const credential = EmailAuthProvider.credential(
        user.email,
        password
      );

      await reauthenticateWithCredential(user, credential);

      await deleteUserStories(user.uid);

      await deleteUserPosts(user.uid);

      await removeUserLikesAndComments(user.uid);

      await removeUserFromConnections(user.uid);

      await deleteDoc(doc(db, "users", user.uid));

      await deleteDoc(doc(db, "devicelogins", user.uid));

      if (username) {
        await deleteUsernameReference(username);
      }

      await deleteUser(user);

      window.showAlert("Account deleted successfully", "success");

      await signOut(auth);

      navigate("/home");

    } catch (err) {

      if (
      err.code === "auth/wrong-password" ||
      err.code === "auth/invalid-credential")
      {
        window.showAlert("Incorrect password", "error");
      } else
      if (err.code === "auth/requires-recent-login") {

        window.showAlert("Session expired. Please login again", "info");

        await signOut(auth);
        navigate("/login");

      } else
      {
        window.showAlert("Failed to delete account", "error");
      }

    }

    setLoading(false);

  };

  return (

    <>

<DashboardNavbar />

<div className="settings-page">

<div className="edit-navbar">

<button className="back-btn" onClick={() => navigate(-1)}>
<FaArrowLeft />
</button>

<h2>Delete Account</h2>

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
Delete your account
</p>

<p className="danger-text">
This action is permanent. Your profile, stories and all data will be erased forever.
</p>

</div>

<div className="settings-section">

<p className="settings-heading">
Confirm deletion
</p>

<div className="settings-input-group">

<input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="settings-input" />
                

</div>

<div className="settings-input-group">

<input
                  type="text"
                  placeholder='Type "DELETE" to confirm'
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="settings-input" />
                

</div>

<button
                className="delete-btn"
                onClick={startDeleteFlow}
                disabled={loading}>
                

Permanently Delete Account

</button>

</div>

</>

          }

</div>

</div>

{confirmStep > 0 &&

      <div className="delete-modal">

<div className="delete-modal-card">

{confirmStep === 1 &&
          <>
<FaExclamationTriangle className="delete-icon" />
<h3>Are you sure?</h3>
<p>This action cannot be undone.</p>
<button className="delete-next" onClick={() => setConfirmStep(2)}>
Continue
</button>
</>
          }

{confirmStep === 2 &&
          <>
<FaDatabase className="delete-icon" />
<h3>Your data will be erased</h3>
<p>All profile info, stories and settings will be permanently removed.</p>
<button className="delete-next" onClick={() => setConfirmStep(3)}>
Continue
</button>
</>
          }

{confirmStep === 3 &&
          <>
<FaTrash className="delete-icon" />
<h3>Final confirmation</h3>
<p>Your account will now be permanently deleted.</p>
<button
              className="delete-final"
              onClick={executeDelete}
              disabled={loading}>
              
{loading ? "Deleting..." : "Delete Account"}
</button>
</>
          }

<button
            className="delete-cancel"
            onClick={() => setConfirmStep(0)}>
            
Cancel
</button>

</div>

</div>

      }

<BottomNav />

</>);



}

export default DeleteAccount;