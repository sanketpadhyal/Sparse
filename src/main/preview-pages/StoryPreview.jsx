import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./StoryPreview.css";

import { db, auth, storage } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  arrayUnion } from
"firebase/firestore";

import { ref, deleteObject } from "firebase/storage";

import { FaTimes, FaPause, FaPlay, FaVolumeMute, FaVolumeUp, FaTrash, FaClock, FaSpinner, FaEye } from "react-icons/fa";
import { MdVerified } from "react-icons/md";

function StoryPreview() {

  const { username } = useParams();
  const navigate = useNavigate();

  const [stories, setStories] = useState([]);
  const [index, setIndex] = useState(0);
  const [owner, setOwner] = useState(false);
  const [storyIds, setStoryIds] = useState([]);
  const [paused, setPaused] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showViewPanel, setShowViewPanel] = useState(false);
  const [viewUsers, setViewUsers] = useState([]);
  const [loadingViewUsers, setLoadingViewUsers] = useState(false);

  const [isMuted, setIsMuted] = useState(true);

  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [duration, setDuration] = useState(5);

  const timerRef = useRef(null);
  const videoRef = useRef(null);

  const holdRef = useRef(null);
  const isHolding = useRef(false);

  const startY = useRef(null);

  const [userInfo, setUserInfo] = useState({
    name: "",
    profilePhoto: "",
    role: ""
  });

  const story = stories[index];

  const bgColor = story && (story.background || story.bg) || "#000";

  const openProfile = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (owner) {
      navigate("/dashboard/profile");
    } else {
      navigate("/u/" + username);
    }
  };

  useEffect(() => {

    const fetchStories = async () => {

      try {

        const usernameRef = doc(db, "usernames", username);
        const usernameSnap = await getDoc(usernameRef);

        if (!usernameSnap.exists()) {
          navigate(-1);
          return;
        }

        const uid = usernameSnap.data().uid;

        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {

          const u = userSnap.data();

          setUserInfo({
            name: u.name || u.username || "User",
            profilePhoto: u.profilePhoto || "/assets/profile.png",
            role: u.role || ""
          });

        }

        if (auth.currentUser && auth.currentUser.uid === uid) {
          setOwner(true);
        }

        const q = query(
          collection(db, "stories"),
          where("uid", "==", uid)
        );

        const snap = await getDocs(q);

        const activeStories = [];
        const ids = [];

        snap.forEach((docSnap) => {

          const data = docSnap.data();

          data.views = data.views || [];

          if (data.expiresAt && data.expiresAt > Date.now()) {
            activeStories.push(data);
            ids.push(docSnap.id);
          }

        });

        if (activeStories.length === 0) {
          navigate(-1);
          return;
        }

        setStories(activeStories);
        setStoryIds(ids);

      } catch (err) {

        console.log(err);
        navigate(-1);

      }

    };

    fetchStories();

  }, [username, navigate]);


  useEffect(() => {

    if (stories.length === 0) return;
    if (paused) return;
    if (!mediaLoaded) return;

    const story = stories[index];

    if (story.mediaType === "video") return;

    timerRef.current = setTimeout(() => {

      nextStory();

    }, 5000);

    return () => clearTimeout(timerRef.current);

  }, [index, stories, paused, mediaLoaded]);


  useEffect(() => {
    setMediaLoaded(false);
    setIsBuffering(false);
    setConfirmDelete(false);
    setShowViewPanel(false);
  }, [index]);

  useEffect(() => {
    if (!mediaLoaded) return;
    markStoryViewed();
  }, [mediaLoaded, index]);


  useEffect(() => {
    if (story && !story.media) {
      setMediaLoaded(true);
    }
  }, [story]);

  useEffect(() => {
    if (showViewPanel) {
      fetchViewUsers();
    }
  }, [showViewPanel, index]);

  useEffect(() => {

    if (showViewPanel) {
      setPaused(true);

      if (videoRef.current) {
        videoRef.current.pause();
      }

      clearTimeout(timerRef.current);
    } else {
      setPaused(false);

      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    }

  }, [showViewPanel]);


  const handleVideoEnd = () => {
    nextStory();
  };


  const togglePause = () => {

    setPaused((prev) => !prev);

    if (videoRef.current) {

      if (paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }

    }

  };


  const startHold = () => {

    holdRef.current = setTimeout(() => {

      isHolding.current = true;
      setPaused(true);

      if (videoRef.current) {
        videoRef.current.pause();
      }

      clearTimeout(timerRef.current);

    }, 200);

  };


  const endHold = () => {

    clearTimeout(holdRef.current);

    if (isHolding.current) {

      setPaused(false);

      if (videoRef.current) {
        videoRef.current.play();
      }

      isHolding.current = false;
      return;
    }

    nextStory();

  };


  const handleTouchStart = (e) => {

    startY.current = e.touches[0].clientY;
    startHold();

  };


  const handleTouchEnd = (e) => {

    endHold();

    if (startY.current === null) return;

    const endY = e.changedTouches[0].clientY;
    const diff = endY - startY.current;

    if (diff > 120) {
      navigate(-1);
    }

    startY.current = null;

  };


  const nextStory = () => {
    if (index < stories.length - 1) {
      setIndex(index + 1);
    } else {
      navigate(-1);
    }

  };


  const prevStory = () => {
    if (index > 0) {
      setIndex(index - 1);
    }

  };


  const deleteStory = async () => {

    try {

      const id = storyIds[index];
      const currentStory = stories[index];

      if (currentStory.media) {

        const fileRef = ref(storage, currentStory.media);

        await deleteObject(fileRef).catch(() => {});

      }

      await deleteDoc(doc(db, "stories", id));

      const newStories = [...stories];
      const newIds = [...storyIds];

      newStories.splice(index, 1);
      newIds.splice(index, 1);

      if (newStories.length === 0) {
        navigate(-1);
        return;
      }

      setStories(newStories);
      setStoryIds(newIds);

      if (index >= newStories.length) {
        setIndex(newStories.length - 1);
      }

    } catch (err) {

      console.log(err);

    }

  };


  const markStoryViewed = async () => {

    try {

      if (!auth.currentUser) return;
      if (owner) return;
      if (!storyIds[index]) return;

      const uid = auth.currentUser.uid;
      const storyId = storyIds[index];

      await updateDoc(doc(db, "stories", storyId), {
        views: arrayUnion(uid)
      });

      setStories((prev) => {
        const updated = [...prev];

        if (!updated[index].views) {
          updated[index].views = [];
        }

        if (!updated[index].views.includes(uid)) {
          updated[index].views.push(uid);
        }

        return updated;
      });

    } catch (err) {
      console.log("VIEW ERROR", err);
    }

  };


  const fetchViewUsers = async () => {

    try {

      setLoadingViewUsers(true);

      if (!story?.views || story.views.length === 0) {
        setViewUsers([]);
        setLoadingViewUsers(false);
        return;
      }

      const users = [];

      for (const uid of story.views) {

        const snap = await getDoc(doc(db, "users", uid));

        if (snap.exists()) {
          const d = snap.data();

          users.push({
            uid,
            name: d.name || d.username,
            username: d.username,
            photo: d.profilePhoto || "/assets/profile.png",
            role: d.role || ""
          });
        }

      }

      setViewUsers(users);

    } catch (e) {
      console.log("VIEW USERS ERROR", e);
    } finally {
      setLoadingViewUsers(false);
    }

  };


  if (stories.length === 0) return null;

  const hoursLeft = Math.max(
    0,
    Math.ceil((story.expiresAt - Date.now()) / 3600000)
  );

  return (

    <div className="story-preview-page">

<div className="story-progress">

{stories.map((_, i) =>

        <div key={i} className="story-progress-bar">

<div
            className={`story-progress-fill 
${i < index ? "done" : ""} 
${i === index && mediaLoaded ? "active" : ""} 
${paused || isBuffering ? "paused" : ""}`}
            style={
            i === index ?
            { animationDuration: `${duration}s` } :
            {}
            }>
          </div>

</div>

        )}

</div>


<div className="story-user-header">

<img
          src={userInfo.profilePhoto}
          alt=""
          className="story-user-photo"
          onClick={(e) => openProfile(e)} />
        

<span
          className="story-user-name"
          onClick={(e) => openProfile(e)}>
          

{userInfo.name}

{(userInfo.role === "owner" || userInfo.role === "friend" || userInfo.role === "pookie" || userInfo.role === "verified") &&
          <MdVerified className="story-user-tick" />
          }

</span>

</div>

<button
        className="story-close"
        onClick={() => navigate(-1)}>
        
<FaTimes />
</button>



<div className="story-click-left" onClick={prevStory}></div>
<div className="story-click-right" onClick={nextStory}></div>


<div
        className="story-stage"
        style={{
          background: story && story.media ? "#000" : bgColor
        }}>
        

{!mediaLoaded && story.media &&
        <div className="story-skeleton"></div>
        }

{story.mediaType === "image" &&

        <img
          src={story.media}
          alt=""
          className="story-image"
          onLoad={() => setMediaLoaded(true)}
          style={{ display: mediaLoaded ? "block" : "none" }} />


        }


{story.mediaType === "video" &&

        <video
          ref={videoRef}
          src={story.media}
          className="story-image"
          autoPlay
          playsInline
          muted={isMuted}
          preload="auto"
          onLoadedData={() => {
            setMediaLoaded(true);
            setIsBuffering(false);
            videoRef.current?.play().catch(() => {});
          }}
          onLoadedMetadata={(e) => {
            const d = Math.min(e.target.duration || 5, 30);
            setDuration(d);
          }}
          onWaiting={() => {
            if (mediaLoaded) {
              setIsBuffering(true);
            }
          }}
          onStalled={() => {
            if (mediaLoaded) {
              setIsBuffering(true);
            }
          }}
          onPlaying={() => {
            setMediaLoaded(true);
            setIsBuffering(false);
          }}
          onCanPlay={() => {
            setMediaLoaded(true);
            setIsBuffering(false);
          }}
          onEnded={handleVideoEnd} />

        }

{story.mediaType === "video" &&
        <div className="story-side-actions">
	<button
            className="story-sound-btn"
            onClick={() => {
              setIsMuted((prev) => !prev);

              if (videoRef.current) {
                videoRef.current.muted = !isMuted;
              }
            }}>
            
		{isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
	</button>
</div>
        }

{story.layers && story.layers.map((layer) =>

        <div
          key={layer.id}
          className="story-text-layer"
          style={{
            transform: `translate(calc(-50% + ${layer.x}px), calc(-50% + ${layer.y}px))`
          }}>
          
{layer.text}
</div>

        )}

{owner &&
        <div className="story-delete-wrap">

  {!confirmDelete ?

          <button
            className="story-delete-btn"
            onClick={() => setConfirmDelete(true)}>
            
      <FaTrash />
    </button> :



          <div className="story-delete-confirm">

      <button
              className="story-delete-yes"
              onClick={async () => {
                setIsDeleting(true);
                const start = Date.now();
                try {
                  await deleteStory();
                } finally {
                  const elapsed = Date.now() - start;
                  setTimeout(() => setIsDeleting(false), Math.max(0, 1400 - elapsed));
                }
              }}
              disabled={isDeleting}>
              
        {isDeleting ? <FaSpinner className="spinning" /> : "Yes"}
      </button>

      <button
              className="story-delete-no"
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}>
              
        No
      </button>

    </div>

          }

</div>
        }

<div className="story-expiry">
<FaClock /> {hoursLeft}h left
</div>

{owner &&
        <div className="story-view-btn" onClick={() => setShowViewPanel(true)}>
  <FaEye /> {story.views?.length || 0}
</div>
        }

</div>


{story.caption &&
      <div className="story-caption">
{story.caption}
</div>
      }

{showViewPanel &&
      <div className="view-panel-overlay" onClick={() => setShowViewPanel(false)}>

  <div className="view-panel" onClick={(e) => e.stopPropagation()}>

    <h3>Views ({loadingViewUsers ? story?.views?.length || 0 : viewUsers.length})</h3>

    {loadingViewUsers ?
          <div className="view-list view-list-skeleton">

        {[...Array(Math.min(5, Math.max(story?.views?.length || 3, 3)))].map((_, i) =>
            <div key={i} className="view-user view-user-skeleton">
            <div className="view-user-avatar-skeleton"></div>

            <div className="view-user-text-skeleton">
              <div className="view-line-skeleton view-line-skeleton-name"></div>
              <div className="view-line-skeleton view-line-skeleton-username"></div>
            </div>
          </div>
            )}

      </div> :
          viewUsers.length === 0 ?
          <p className="no-views">No views yet</p> :


          <div className="view-list">

        {viewUsers.map((u) =>
            <div
              key={u.uid}
              className="view-user"
              onClick={() => {
                navigate("/u/" + u.username);
                setShowViewPanel(false);
              }}
              style={{ cursor: "pointer" }}>
              

            <img src={u.photo} alt="" />

            <div>
              <div className="view-name">{u.name}</div>
              <div className="view-username">@{u.username}</div>
            </div>

          </div>
            )}

      </div>

          }

  </div>

</div>
      }

</div>);



}

export default StoryPreview;