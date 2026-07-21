import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "./StoryEditor.css";
import { sendPushNotification } from "../../supabase";

import {
  FaTimes,
  FaFont,
  FaPaintBrush,
  FaArrowRight,
  FaHistory,

  FaDatabase } from
"react-icons/fa";
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa";

import { auth, db, storage } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadString, uploadBytes, getDownloadURL } from "firebase/storage";

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion } from
"firebase/firestore";



function StoryEditor() {

  const location = useLocation();
  const navigate = useNavigate();

  const image = location.state?.image ?? null;
  const video = location.state?.video ?? null;
  const quote = location.state?.quote ?? "";
  const templateBg = location.state?.bg ?? null;

  const hasMedia = image || video;

  const colors = [
  "#000000",
  "#4f6cff",
  "#9333ea",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899"];


  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const [caption, setCaption] = useState("");
  const [bg, setBg] = useState(templateBg || randomColor);
  const [user, setUser] = useState(null);

  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  const [uploading, setUploading] = useState(false);

  const [layers, setLayers] = useState([]);

  const [videoUrl, setVideoUrl] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);
  const [mediaSize, setMediaSize] = useState("");


  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) {
        navigate("/home");
      } else {
        setUser(u);
      }
    });

    return () => unsubscribe();

  }, [navigate]);


  useEffect(() => {
    if (templateBg) {
      setBg(templateBg);
    }
  }, [templateBg]);


  useEffect(() => {
    if (quote) {
      setLayers([
      {
        id: Date.now(),
        text: quote,
        x: 0,
        y: 0
      }]
      );
    }
  }, [quote]);


  useEffect(() => {
    if (!hasMedia) {
      setMediaLoaded(true);
    }
  }, [hasMedia]);


  useEffect(() => {
    if (!video) {
      setVideoUrl(null);
      return;
    }

    if (video instanceof File || video instanceof Blob) {
      const url = URL.createObjectURL(video);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof video === "string") {
      setVideoUrl(video);
    }

  }, [video]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [videoUrl]);

  useEffect(() => {
    if (video instanceof File) {
      const sizeMB = (video.size / (1024 * 1024)).toFixed(2);
      setMediaSize(sizeMB + " MB");
      return;
    }

    if (image && typeof image === "string") {
      const sizeKB = Math.round(image.length * 3 / 4 / 1024);
      setMediaSize(sizeKB + " KB");
      return;
    }

    setMediaSize("");
  }, [video, image]);



  useEffect(() => {

    if (!mediaLoaded) return;

    const duration = video ? 30000 : 8000;
    const start = Date.now();

    const timer = setInterval(() => {

      const diff = Date.now() - start;
      const percent = diff / duration * 100;

      if (percent >= 100) {
        clearInterval(timer);
      } else {
        setProgress(percent);
      }

    }, 50);

    return () => clearInterval(timer);

  }, [mediaLoaded, video]);



  const addTextLayer = () => {
    setLayers([
    ...layers,
    {
      id: Date.now(),
      text: "Tap to edit",
      x: 0,
      y: 0
    }]
    );
  };



  const deleteLayer = (id) => {
    setLayers(layers.filter((l) => l.id !== id));
  };



  const updateLayer = (id, value) => {
    setLayers(
      layers.map((l) =>
      l.id === id ? { ...l, text: value } : l
      )
    );
  };



  const startDrag = (e, id) => {

    const isTouch = e.type === "touchstart";

    const startX = isTouch ? e.touches[0].clientX : e.clientX;
    const startY = isTouch ? e.touches[0].clientY : e.clientY;

    const layer = layers.find((l) => l.id === id);

    const move = (ev) => {

      const clientX = isTouch ? ev.touches[0].clientX : ev.clientX;
      const clientY = isTouch ? ev.touches[0].clientY : ev.clientY;

      const dx = clientX - startX;
      const dy = clientY - startY;

      setLayers((prev) =>
      prev.map((l) =>
      l.id === id ?
      { ...l, x: layer.x + dx, y: layer.y + dy } :
      l
      )
      );

    };

    const stop = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", stop);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", stop);

  };



  const changeBg = () => {
    setBg(colors[Math.floor(Math.random() * colors.length)]);
  };



  async function compressVideo(file) {

    return new Promise((resolve) => {

      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      video.muted = true;

      video.onloadedmetadata = () => {

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = 720;
        canvas.height = video.videoHeight * (720 / video.videoWidth);

        const stream = canvas.captureStream(30);

        const recorder = new MediaRecorder(stream, {
          mimeType: "video/webm",
          videoBitsPerSecond: 800000
        });

        const chunks = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: "video/webm" }));
        };

        video.play();

        function draw() {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(draw);
        }

        draw();

        recorder.start();

        video.onended = () => {
          recorder.stop();
        };

      };

    });

  }



  const handlePost = async () => {

    if (!user || uploading) return;

    setUploading(true);

    try {

      const storyQuery = query(
        collection(db, "stories"),
        where("uid", "==", user.uid)
      );

      const snap = await getDocs(storyQuery);

      let activeStories = 0;

      snap.forEach((doc) => {
        const data = doc.data();
        if (data.expiresAt > Date.now()) {
          activeStories++;
        }
      });

      if (activeStories >= 5) {
        window.showAlert?.("You can only upload 5 stories at once", "error");
        setUploading(false);
        return;
      }

      let mediaUrl = null;
      let mediaType = null;



      if (image) {

        if (image.startsWith("data:image")) {

          const storyId = Date.now();
          const storageRef = ref(storage, `stories/${user.uid}/${storyId}`);

          await uploadString(storageRef, image, "data_url");
          mediaUrl = await getDownloadURL(storageRef);

        } else {

          mediaUrl = image;

        }

        mediaType = "image";
      }



      if (video) {

        if (video instanceof File) {

          const storyId = Date.now();
          const storageRef = ref(storage, `stories/${user.uid}/${storyId}`);

          await uploadBytes(storageRef, video, {
            contentType: video.type || "video/mp4"
          });

          mediaUrl = await getDownloadURL(storageRef);

        } else {
          mediaUrl = video;
        }

        mediaType = "video";
      }



      const storyData = {

        uid: user.uid,
        email: user.email,

        media: mediaUrl,
        mediaType: mediaType,

        background: bg,
        layers: layers,
        caption: caption,

        createdAt: serverTimestamp(),
        expiresAt: Date.now() + 86400000

      };

      await addDoc(collection(db, "stories"), storyData);
      const me = await getDoc(doc(db, "users", user.uid));
      const myData = me.data();

      const followers = myData.followersList || [];

      followers.forEach((followerUid) => {

        sendPushNotification({
          receiver_uid: followerUid,
          sender_name: myData.name || myData.username,
          message: "added a new story"
        });

        updateDoc(doc(db, "users", followerUid), {
          activity: arrayUnion({
            type: "story",
            uid: user.uid,
            username: myData.username,
            name: myData.name,
            photo: myData.profilePhoto || "",
            text: `${myData.username} added a new story`,
            time: new Date().toISOString()
          })
        });

      });

      window.showAlert?.("Story uploaded", "success");

      navigate("/dashboard/profile");

    } catch (err) {

      console.error(err);
      window.showAlert?.("Failed to upload story", "error");

      setUploading(false);

    }

  };



  return (

    <div
      className="editor-page"
      style={!hasMedia ? { background: bg || "#000" } : {}}>
      



<button
        className="editor-close"
        onClick={() => navigate(-1)}>
        
<FaTimes />
</button>



<div className="editor-stage">

{!mediaLoaded &&
        <div className="story-skeleton"></div>
        }



{image &&

        <img
          src={image}
          className="editor-image"
          alt=""
          onLoad={() => setMediaLoaded(true)}
          style={{ display: mediaLoaded ? "block" : "none" }} />


        }



{videoUrl &&

        <video
          ref={videoRef}
          src={videoUrl}
          className="editor-video"
          autoPlay
          playsInline
          muted={isMuted}
          loop
          preload="auto"
          onLoadedData={() => {
            setMediaLoaded(true);
            videoRef.current?.play().catch(() => {});
          }}
          style={{ display: mediaLoaded ? "block" : "none" }} />


        }

{mediaSize &&
        <div className="media-size-badge">
    <FaDatabase />
    <span>{mediaSize}</span>
  </div>
        }



{layers.map((layer) =>

        <div
          key={layer.id}
          className="editor-layer"
          style={{
            transform: `translate(calc(-50% + ${layer.x}px), calc(-50% + ${layer.y}px))`
          }}
          onMouseDown={(e) => startDrag(e, layer.id)}
          onTouchStart={(e) => startDrag(e, layer.id)}>
          

<button
            className="layer-delete"
            onClick={() => deleteLayer(layer.id)}>
            
×
</button>

<textarea
            value={layer.text}
            onChange={(e) => updateLayer(layer.id, e.target.value)}
            rows="3" />
          

</div>

        )}

</div>



<div className="editor-tools">

<button onClick={addTextLayer}>
<FaFont />
</button>

{videoUrl &&
        <button onClick={() => setIsMuted((prev) => !prev)}>
{isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
</button>
        }

{!hasMedia && !templateBg &&
        <button onClick={changeBg}>
<FaPaintBrush />
</button>
        }

</div>



<div className="editor-caption">

<textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
          rows="1" />
        

</div>



<div className="editor-bottom">

<div className="story-text">
<FaHistory /> Your Story
</div>



<button
          className="send-btn"
          onClick={handlePost}
          disabled={uploading}>
          

{uploading ?
          <div className="story-upload-loader"></div> :

          <FaArrowRight />
          }

</button>

</div>

</div>);



}

export default StoryEditor;