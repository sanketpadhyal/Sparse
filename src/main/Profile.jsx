import { useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";
import "./Profile.css";

import { auth, db, storage } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

import { useNavigate } from "react-router-dom";

import { FaUserEdit, FaShareAlt, FaSyncAlt, FaMars, FaVenus, FaTransgenderAlt, FaLock, FaPlus, FaBirthdayCake, FaQrcode, FaCrown, FaGem, FaHeart, FaComment } from "react-icons/fa";
import { MdVerified } from "react-icons/md";

function Profile() {

  const navigate = useNavigate();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasStory, setHasStory] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState({});

  const [userData, setUserData] = useState({
    name: "",
    username: "",
    email: "",
    profilePhoto: "",
    bio: "",
    status: "",
    gender: "Confidential",
    pronoun: "",
    dob: "",
    followers: 0,
    following: 0,
    posts: 0,
    role: ""
  });
  const formatBio = (text) => {

    if (!text) return "";

    let formatted = text;

    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    formatted = formatted.replace(/\*(.*?)\*/g, "<i>$1</i>");
    formatted = formatted.replace(/\n/g, "<br/>");

    return formatted;

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

  const checkStory = async (uid) => {

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
      return active;

    } catch {

      setHasStory(false);
      return false;

    }

  };

  const getFollowersCount = async (uid) => {

    const q = query(
      collection(db, "users"),
      where("followingList", "array-contains", uid)
    );

    const snap = await getDocs(q);

    return snap.size;

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
      setUserData((prev) => ({
        ...prev,
        posts: list.length
      }));

      const cached = JSON.parse(localStorage.getItem("profile_cache") || "{}");

      localStorage.setItem(
        "profile_cache",
        JSON.stringify({
          ...cached,
          posts: list.length
        })
      );

    } catch (e) {
      console.log("POST FETCH ERROR:", e);
    }

    setPostsLoading(false);

  };

  const handleImageLoad = (id) => {
    setLoadedImages((prev) => ({
      ...prev,
      [id]: true
    }));
  };

  const migrateBase64Photo = async (base64, uid) => {

    const storageRef = ref(storage, `profilePhotos/${uid}`);

    await uploadString(storageRef, base64, "data_url");

    const url = await getDownloadURL(storageRef);

    await updateDoc(doc(db, "users", uid), {
      profilePhoto: url,
      profilePhotoUpdatedAt: Date.now()
    });

    return url;

  };

  const fetchProfile = async (user) => {

    try {

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {

        const data = snap.data();

        let photo = data.profilePhoto || "";

        if (photo && photo.startsWith("data:image")) {

          photo = await migrateBase64Photo(photo, user.uid);

        }

        const followersCount = await getFollowersCount(user.uid);

        const storyActive = await checkStory(user.uid);

        const profileInfo = {
          name: data.name,
          username: data.username,
          email: data.email,
          profilePhoto: photo,
          bio: data.bio || "",
          status: data.status || "",
          gender: data.gender || "Confidential",
          pronoun: data.pronoun || "",
          dob: data.dob || "",
          followers: followersCount,
          following: (data.followingList || []).length,
          posts: userData.posts,
          hasStory: storyActive,
          role: data.role || ""
        };

        setUserData(profileInfo);

        localStorage.setItem(
          "profile_cache",
          JSON.stringify(profileInfo)
        );

      }

    } catch {

      window.showAlert?.("Failed to refresh profile", "error");

    }

    setRefreshing(false);

  };

  useEffect(() => {

    window.scrollTo(0, 0);

    const unsubscribe = onAuthStateChanged(auth, (user) => {

      if (!user) {
        navigate("/home");
        return;
      }

      const cached = localStorage.getItem("profile_cache");

      if (cached) {
        const parsed = JSON.parse(cached);
        setUserData(parsed);
        setHasStory(parsed.hasStory || false);
        fetchPosts(user.uid);
        setLoading(false);
      } else {
        fetchProfile(user);
        fetchPosts(user.uid);
        setLoading(false);
      }

    });

    return () => unsubscribe();

  }, [navigate]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + "/u/" + userData.username);
    window.showAlert?.("Profile link copied", "success");
  };

  const handleRefresh = () => {
    const user = auth.currentUser;

    if (user) {

      setRefreshing(true);

      localStorage.removeItem("profile_cache");

      fetchProfile(user);
      fetchPosts(user.uid);

    }
  };

  const openStory = () => {
    if (loading) return;
    if (!hasStory) return;
    navigate("/story-preview/" + userData.username);
  };

  const openFollowers = () => {
    navigate(`/u/${userData.username}/connections/followers`);
  };

  const openFollowing = () => {
    navigate(`/u/${userData.username}/connections/following`);
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

  return (

    <>

<div className="profile-page">

<div className="profile-header-card">

<div className="profile-top">

<div className="profile-avatar-wrapper">

<div
                className={`status-bubble ${!userData.status || userData.status.trim() === "" ? "status-default" : ""}`}
                onClick={() => navigate("/edit-profile")}
                style={{ cursor: "pointer" }}>
                
{userData.status && userData.status.trim() !== "" ? userData.status : "What u doin?"}
</div>

<div
                className={`profile-avatar ${hasStory ? "story-ring" : ""}`}
                onClick={openStory}>
                

<img
                  src={
                  userData.profilePhoto && userData.profilePhoto.trim() !== "" ?
                  userData.profilePhoto :
                  "/assets/profile.png"
                  }
                  alt="profile"
                  className="profile-avatar-img" />
                

<div
                  className="story-add"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/add-story");
                  }}>
                  
<FaPlus />
</div>

</div>

</div>

<div className="profile-main">

<h2 className="profile-name">

{loading ? "Loading..." : userData.name}

{userData.role === "owner" &&
                <FaCrown
                  className="owner-crown"
                  onClick={handleOwnerClick}
                  title="Founder" />

                }

{userData.role === "friend" &&
                <FaGem
                  className="friend-badge"
                  style={{ color: "#e10e0eff" }}
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
                  "Verified Teammate" :
                  userData.role === "pookie" ?
                  "Loyal User" :
                  "Verified"
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

<p
                className="profile-bio"
                dangerouslySetInnerHTML={{
                  __html: userData.bio ? formatBio(userData.bio) : "No bio"
                }}>
              </p>

</div>

<div className="refresh-section">

<button
                className="refresh-btn"
                onClick={handleRefresh}>

                

{refreshing ?

                <div className="refresh-spin"></div> :

                <FaSyncAlt />
                }

</button>

</div>

</div>

<div className="profile-stats-panel">

<div className="stat-box">
<span>{posts.length}</span>
<p>Posts</p>
</div>

<div className="stat-divider"></div>

<div
              className="stat-box"
              onClick={openFollowers}
              style={{ cursor: "pointer" }}>
              
<span>{userData.followers}</span>
<p>Followers</p>
</div>

<div className="stat-divider"></div>

<div
              className="stat-box"
              onClick={openFollowing}
              style={{ cursor: "pointer" }}>
              
<span>{userData.following}</span>
<p>Following</p>
</div>

</div>

<div className="profile-actions">

<button
              className="edit-profile-btn"
              onClick={() => navigate("/edit-profile")}>

              

<FaUserEdit />
Edit Profile

</button>

<button
              className="share-profile-btn"
              onClick={() => navigate("/profile-qr")}>
              

    <FaQrcode />
Share Profile
</button>

</div>

</div>

<div className="profile-posts">

<div className="posts-header">

<h3 className="posts-title">
<span className="posts-p">P</span>
<span className="posts-rest">osts</span>
</h3>

<button
              className="posts-add-btn"
              onClick={() => navigate("/dashboard/post-editor")}>
              
<FaPlus />
</button>

</div>

{postsLoading ?

          <div className="posts-grid">
{[...Array(6)].map((_, i) =>
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

</div>

<BottomNav />

</>);



}

export default Profile;