import { useEffect, useState, useCallback } from "react";
import "./UserProfile.css";
import "../Profile.css";

import { auth, db } from "../../firebase";
import { sendPushNotification } from "../../supabase";
import { FaCrown, FaGem, FaHeart, FaComment } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  getDocs } from
"firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";

import {
  FaShareAlt,
  FaMars,
  FaVenus,
  FaTransgenderAlt,
  FaLock,
  FaBirthdayCake,
  FaArrowLeft,
  FaUserPlus,
  FaUserCheck } from
"react-icons/fa";

function UserProfile() {

  const navigate = useNavigate();
  const { username } = useParams();

  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasStory, setHasStory] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState({});

  const [userData, setUserData] = useState({
    uid: "",
    name: "",
    username: "",
    profilePhoto: "",
    bio: "",
    status: "",
    gender: "Confidential",
    dob: "",
    followers: 0,
    following: 0,
    role: ""
  });

  const [isFollowing, setIsFollowing] = useState(false);
  const [isMutual, setIsMutual] = useState(false);
  const [theyFollowMe, setTheyFollowMe] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [currentUid, setCurrentUid] = useState("");

  const generateToken = (length = 32) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const redirectLogin = () => {
    const authToken = generateToken(32);
    const sessionToken = generateToken(32);
    sessionStorage.setItem("auth_token", authToken);
    sessionStorage.setItem("session_token", sessionToken);
    navigate(`/login?auth=${authToken}&sess=${sessionToken}`);
  };

  const redirectSignup = () => {
    const authToken = generateToken(32);
    const sessionToken = generateToken(32);
    sessionStorage.setItem("auth_token", authToken);
    sessionStorage.setItem("session_token", sessionToken);
    navigate(`/signup?auth=${authToken}&sess=${sessionToken}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const getGenderIcon = () => {
    if (userData.gender === "Male") return <FaMars style={{ color: "#007bff" }} />;
    if (userData.gender === "Female") return <FaVenus style={{ color: "#e91e63" }} />;
    if (userData.gender === "Other") return <FaTransgenderAlt style={{ color: "#9c27b0" }} />;
    return <FaLock style={{ color: "#666" }} />;
  };

  const checkStory = useCallback(async (uid) => {
    try {

      const q = query(
        collection(db, "stories"),
        where("uid", "==", uid)
      );

      const snap = await getDocs(q);

      let active = false;

      snap.forEach((doc) => {
        const data = doc.data();
        if (data.expiresAt && data.expiresAt > Date.now()) {
          active = true;
        }
      });

      setHasStory(active);

    } catch {
      setHasStory(false);
    }
  }, []);

  const handleImageLoad = (id) => {
    setLoadedImages((prev) => ({
      ...prev,
      [id]: true
    }));
  };

  const fetchPosts = async (uid) => {

    try {

      setPostsLoading(true);

      const q = query(
        collection(db, "posts"),
        where("uid", "==", uid)
      );

      const snap = await getDocs(q);

      const list = [];

      snap.forEach((doc) => {
        list.push({
          id: doc.id,
          ...doc.data()
        });
      });

      list.sort((a, b) => {
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });

      setPosts(list);
      setLoadedImages({});

    } catch (e) {
      console.log("USER POSTS ERROR:", e);
    }

    setPostsLoading(false);

  };

  const fetchUser = useCallback(async (currentUser) => {
    try {

      const q = query(
        collection(db, "users"),
        where("username", "==", username)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        navigate("/home");
        return;
      }

      const docSnap = snap.docs[0];
      const data = docSnap.data();

      if (currentUser && currentUser.uid === docSnap.id) {
        navigate("/dashboard/profile");
        return;
      }

      const followersList = data.followersList || [];
      const followingList = data.followingList || [];

      setUserData({
        uid: docSnap.id,
        name: data.name || data.username,
        username: data.username,
        profilePhoto: data.profilePhoto || "",
        bio: data.bio || "",
        status: data.status || "",
        gender: data.gender || "Confidential",
        dob: data.dob || "",
        followers: followersList.length,
        following: followingList.length,
        role: data.role || ""
      });

      checkStory(docSnap.id);
      fetchPosts(docSnap.id);

      if (currentUser) {

        const meRef = doc(db, "users", currentUser.uid);
        const meSnap = await getDoc(meRef);

        if (meSnap.exists()) {
          const meData = meSnap.data();
          const myFollowing = meData.followingList || [];
          const myFollowers = meData.followersList || [];
          const following = myFollowing.includes(docSnap.id);
          const followsMe = myFollowers.includes(docSnap.id);
          const mutual = following && followsMe;
          setTheyFollowMe(followsMe);
          setIsFollowing(following);
          setIsMutual(mutual);
        } else {
          setTheyFollowMe(false);
          setIsFollowing(false);
          setIsMutual(false);
        }

      } else {
        setTheyFollowMe(false);
        setIsFollowing(false);
        setIsMutual(false);
      }

    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  }, [checkStory, navigate, username]);

  useEffect(() => {

    window.scrollTo(0, 0);

    const unsubscribe = onAuthStateChanged(auth, (user) => {

      if (user) {
        setIsLoggedIn(true);
        setCurrentUid(user.uid);
        fetchUser(user);
      } else {
        setIsLoggedIn(false);
        fetchUser(null);
      }

      setAuthChecked(true);

    });

    return () => unsubscribe();

  }, [username, fetchUser]);


  const handleFollow = async () => {

    if (!isLoggedIn) {
      redirectLogin();
      return;
    }

    if (followingLoading) return;

    setFollowingLoading(true);

    const myRef = doc(db, "users", currentUid);
    const theirRef = doc(db, "users", userData.uid);

    if (isFollowing) {

      setIsFollowing(false);
      setIsMutual(false);
      setUserData((prev) => ({ ...prev, followers: prev.followers - 1 }));

      updateDoc(myRef, {
        followingList: arrayRemove(userData.uid)
      });

      updateDoc(theirRef, {
        followersList: arrayRemove(currentUid)
      });

    } else {

      setIsFollowing(true);
      setIsMutual(theyFollowMe);
      setUserData((prev) => ({ ...prev, followers: prev.followers + 1 }));

      updateDoc(myRef, {
        followingList: arrayUnion(userData.uid)
      });

      updateDoc(theirRef, {
        followersList: arrayUnion(currentUid)
      });

      (async () => {

        try {

          const meSnap = await getDoc(doc(db, "users", currentUid));
          const meData = meSnap.data();

          updateDoc(theirRef, {
            activity: arrayUnion({
              type: "follow",
              uid: currentUid,
              username: meData.username,
              name: meData.name,
              photo: meData.profilePhoto || "",
              text: `${meData.username} started following you`,
              time: new Date().toISOString()
            })
          });

          await sendPushNotification({
            receiver_uid: userData.uid,
            sender_name: meData.name,
            message: "started following you"
          });

        } catch (e) {
          console.log("FOLLOW BG ERROR", e);
        }

      })();

    }

    setFollowingLoading(false);
  };

  const openStory = () => {
    if (!hasStory) return;
    if (!isLoggedIn) {
      redirectLogin();
      return;
    }
    navigate("/story-preview/" + userData.username);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + "/u/" + userData.username);
    window.showAlert?.("Profile link copied", "success");
  };

  const openFollowers = () => {
    if (!isLoggedIn) {
      redirectLogin();
      return;
    }
    navigate("/u/" + userData.username + "/connections/followers");
  };

  const openFollowing = () => {
    if (!isLoggedIn) {
      redirectLogin();
      return;
    }
    navigate("/u/" + userData.username + "/connections/following");
  };

  const handleOwnerClick = () => {
    window.showAlert?.("Founder of Sparse", "alert");
  };

  const handleFriendClick = () => {
    window.showAlert?.("Sparse Project Teammate", "alert");
  };

  const handlePookieClick = () => {
    window.showAlert?.("Loyal user", "alert");
  };

  const openPost = (post) => {
    navigate("/dashboard/post-view", {
      state: { post }
    });
  };
  if (!authChecked || loading) {

    return (

      <div className="profile-page">

<div className="profile-header-card">

<div className="profile-top">

<div className="profile-avatar-wrapper">
<div className="profile-avatar skeleton-avatar"></div>
</div>

<div className="profile-main">
<div className="skeleton-line" style={{ width: "160px", height: "22px" }}></div>
<div className="skeleton-line" style={{ width: "120px", marginTop: "6px" }}></div>
<div className="skeleton-line" style={{ width: "140px", marginTop: "8px" }}></div>
<div className="skeleton-line" style={{ width: "220px", marginTop: "10px" }}></div>
</div>

</div>

<div className="profile-stats-panel">

<div className="stat-box">
<span>{posts.length}</span>
<p>Posts</p>
</div>

<div className="stat-divider"></div>

<div className="stat-box" onClick={openFollowers}>
<span>{userData.followers}</span>
<p>Followers</p>
</div>

<div className="stat-divider"></div>

<div className="stat-box" onClick={openFollowing}>
<span>{userData.following}</span>
<p>Following</p>
</div>

</div>

<div className="profile-actions">
<div className="skeleton-button"></div>
<div className="skeleton-button"></div>
</div>

</div>

</div>);



  }

  return (

    <div className="profile-page">

<div className="profile-header-card">

<button className="back-button" onClick={() => navigate(-1)}>
<FaArrowLeft />
</button>

<div className="profile-top">

<div className="profile-avatar-wrapper">

{userData.status &&
            <div className="status-bubble">
{userData.status}
</div>
            }

<div
              className={`profile-avatar ${hasStory ? "story-ring" : ""}`}
              onClick={openStory}>
              

<img
                src={userData.profilePhoto || "/assets/profile.png"}
                alt="profile"
                className="profile-avatar-img" />
              

</div>

</div>

<div className="profile-main">

<h2 className="profile-name">
{userData.name}

{userData.role === "owner" &&
              <FaCrown
                className="owner-crown"
                onClick={handleOwnerClick}
                title="Founder" />

              }
{userData.role === "friend" &&
              <FaGem
                className="friend-badge"
                style={{ color: "#e10e0e" }}
                onClick={handleFriendClick}
                title="Sparse Project Teammate" />

              }
{userData.role === "pookie" &&
              <span
                className="pookie-badge"
                onClick={handlePookieClick}
                title="Pookie">
                
🎀
</span>
              }

</h2>
<p className="profile-username">
@{userData.username}
{(userData.role === "owner" || userData.role === "friend" || userData.role === "pookie" || userData.role === "verified") &&
              <MdVerified
                className="owner-tick"
                title={
                userData.role === "owner" ?
                "Verified Owner" :
                userData.role === "friend" ?
                "Sparse Project Teammate" :
                userData.role === "pookie" ?
                "Loyal User" :
                "Verified User"
                } />

              }
</p>

<p className="profile-gender">
<span className="gender-icon">{getGenderIcon()}</span>
{userData.gender}
</p>

{userData.dob &&
            <div className="profile-dob">
<FaBirthdayCake /> {formatDate(userData.dob)}
</div>
            }

<p className="profile-bio">
{userData.bio || "No bio"}
</p>

</div>

</div>

<div className="profile-stats-panel">

<div className="stat-box">
<span>{posts.length}</span>
<p>Posts</p>
</div>

<div className="stat-divider"></div>

<div className="stat-box" onClick={openFollowers}>
<span>{userData.followers}</span>
<p>Followers</p>
</div>

<div className="stat-divider"></div>

<div className="stat-box" onClick={openFollowing}>
<span>{userData.following}</span>
<p>Following</p>
</div>

</div>

<div className="profile-actions">

{isLoggedIn ?

          <>
<button
              className={`follow-btn ${isFollowing ? "following" : "follow"} ${followingLoading ? "loading" : ""}`}
              onClick={handleFollow}
              disabled={followingLoading}>
              

<span className="follow-icon">
{isFollowing ? <FaUserCheck /> : <FaUserPlus />}
</span>

<span className="follow-text">
{followingLoading ? "Loading..." : isFollowing ? "Following" : "Follow"}
</span>

</button>

{isMutual &&
            <button
              className="message-btn"
              onClick={() => navigate(`/chatroom?with=${userData.username}&session=${Date.now()}`)}>
              
<span className="message-btn-icon">
<FaComment />
</span>
<span className="message-btn-text">
Message
</span>
</button>
            }

<button
              className="share-profile-btn"
              onClick={handleShare}>
              
<FaShareAlt /> Share
</button>
</> :



          <>
<button
              className="follow-btn follow"
              onClick={redirectLogin}>
              
Login to Follow
</button>

<button
              className="share-profile-btn"
              onClick={redirectSignup}>
              
Sign Up
</button>
</>

          }

</div>

</div>

<div className={`profile-posts ${!isLoggedIn ? "posts-locked" : ""}`}>

<h3 className="posts-title">
<span className="posts-p">P</span>
<span className="posts-rest">osts</span>
</h3>

{!isLoggedIn ?

        <div className="posts-login-lock">
<p>Can't show posts</p>
<span>You need to be logged in</span>
<button onClick={redirectLogin}>Login</button>
</div> :

        postsLoading ?

        <div className="posts-grid">
{[1, 2, 3, 4, 5, 6].map((i) =>
          <div key={i} className="post-tile">
<div className="post-skeleton"></div>
</div>
          )}
</div> :

        posts.length === 0 ?

        <div className="posts-placeholder">
<p>No posts yet</p>
</div> :



        <div className="posts-grid">

{posts.map((post) =>
          <div
            key={post.id}
            className="post-tile"
            onClick={() => openPost(post)}>
            

{!loadedImages[post.id] &&
            <div className="post-skeleton"></div>
            }

<img
              src={post.photo}
              alt="post"
              loading="lazy"
              onLoad={() => handleImageLoad(post.id)}
              style={{
                opacity: loadedImages[post.id] ? 1 : 0
              }} />
            

<div className="post-overlay">

<div className="post-stat">
<FaHeart /> {post.likes?.length || 0}
</div>

<div className="post-stat">
<FaComment /> {post.comments?.length || 0}
</div>

</div>

</div>
          )}

</div>

        }

</div>

</div>);



}

export default UserProfile;