import { useEffect, useLayoutEffect, useState } from "react";
import "./AddPost.css";

import BottomNav from "../components/BottomNav";
import DashboardNavbar from "../components/DashboardNavbar";

import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft, FaPaperPlane, FaGlobe, FaImage, FaWeightHanging } from "react-icons/fa";
import { FaWandMagicSparkles } from "react-icons/fa6";

import { auth, db, storage } from "../firebase";
import { sendPushNotification } from "../supabase";

import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { updateDoc, arrayUnion } from "firebase/firestore";

function AddPost() {

  const navigate = useNavigate();
  const location = useLocation();

  const image = location.state?.image;
  const file = location.state?.file;

  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");

  const MAX_CAPTION = 2200;
  const MIN_CAPTION = 3;

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!image) {
      navigate("/dashboard");
    }
  }, [image, navigate]);

  useEffect(() => {

    const handleBeforeUnload = (e) => {

      if (caption.trim().length > 0) {

        e.preventDefault();
        e.returnValue = "";

        return "";

      }

    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };

  }, [caption]);

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(1) + " KB";
    return (kb / 1024).toFixed(2) + " MB";
  };

  const isCaptionValid = caption.trim().length >= MIN_CAPTION;
  const captionLength = caption.trim().length;
  const captionProgress = Math.min(captionLength / MIN_CAPTION, 1);
  const readyProgress = Math.min(100, Math.round((image ? 68 : 0) + captionProgress * 32));
  const postProgress = uploading ? uploadProgress : readyProgress;
  const progressLabel = uploading ?
  uploadStage || "Posting..." :
  isCaptionValid ?
  "Ready to publish" :
  captionLength > 0 ?
  "Almost ready" :
  "Add a caption to finish";

  const handleUpload = async () => {

    if (uploading) return;

    if (!isCaptionValid) {
      window.showAlert?.("Caption must contain at least 3 characters", "warning");
      return;
    }

    try {

      setUploading(true);
      setUploadProgress(2);
      setUploadStage("Preparing upload");

      const user = auth.currentUser;
      if (!user) return;

      const fileName = `posts/${user.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);

      await new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = snapshot.totalBytes ?
            Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 82) :
            0;

            setUploadStage("Uploading photo");
            setUploadProgress(Math.max(4, progress));
          },
          (error) => reject(error),
          () => resolve()
        );
      });

      setUploadStage("Finalizing media");
      setUploadProgress(86);
      const photoURL = await getDownloadURL(storageRef);

      setUploadStage("Publishing post");
      setUploadProgress(91);
      await addDoc(collection(db, "posts"), {

        uid: user.uid,
        photo: photoURL,
        caption: caption.trim(),
        likes: [],
        comments: [],
        createdAt: serverTimestamp()

      });

      const userSnap = await getDoc(doc(db, "users", user.uid));
      const userData = userSnap.exists() ? userSnap.data() : {};

      const followers = userData?.followersList || [];

      setUploadStage("Sending updates");
      setUploadProgress(followers.length ? 95 : 100);

      await Promise.all(
        followers.map(async (follower) => {
          await sendPushNotification({
            receiver_uid: follower,
            sender_name: userData.name || userData.username,
            message: "added a new post",
            post_caption: caption.trim()
          });

          await updateDoc(doc(db, "users", follower), {
            activity: arrayUnion({
              type: "post",
              uid: user.uid,
              username: userData.username,
              name: userData.name,
              photo: userData.profilePhoto || "",
              caption: caption.trim(),
              text: `${userData.username} added a new post`,
              time: new Date().toISOString()
            })
          });
        })
      );

      setUploadStage("Post is live");
      setUploadProgress(100);
      window.showAlert?.("Post uploaded successfully", "success");

      navigate("/dashboard/profile");

    } catch (e) {

      window.showAlert?.("Upload failed", "error");

    }

    setUploadStage("");
    setUploading(false);

  };

  const improveCaption = async () => {

    if (!caption.trim()) {
      window.showAlert?.("Write something first", "warning");
      return;
    }

    try {

      setGenerating(true);

      const textInput = caption.toLowerCase();

      const seriousWords = [
      "rip", "rest in peace", "death", "dead", "missing",
      "funeral", "loss", "passed away", "gone", "heaven"];


      const isSerious = seriousWords.some((word) => textInput.includes(word));

      const prompt = isSerious ? `

Rewrite this caption.

Tone:
- respectful
- calm
- emotional
- NOT funny

Rules:
- Only output the caption
- No jokes
- No emojis unless soft (like 🕊️)
- Keep it short and meaningful

Caption:
${caption}

` : `

Rewrite this caption.

Tone:
- modern
- cool
- slightly catchy
- can be light/fun

Rules:
- Only output the caption
- No explanations
- Keep it short

Caption:
${caption}

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

      let text = (data?.reply || caption).trim();

      text = text.
      replace(/["']/g, "").
      replace(/\(.*?\)/g, "").
      replace(/caption[:\-]*/gi, "").
      trim();

      setCaption(text);

    } catch (e) {

      window.showAlert?.("AI failed", "error");

    }

    setGenerating(false);

  };

  const handleCaptionChange = (e) => {

    const text = e.target.value;

    if (text.length <= MAX_CAPTION) {
      setCaption(text);
    }

  };

  return (

    <>

<DashboardNavbar />

<div className="add-post-page">

<div className="add-post-navbar">

<button
            className="post-back"
            onClick={() => navigate(-1)}>
            
<FaArrowLeft />
</button>

<h2>Create Post</h2>

<button
            className="post-upload"
            onClick={handleUpload}
            disabled={!isCaptionValid || uploading}>
            

{uploading ?
            <div className="upload-spinner"></div> :

            <>
<FaPaperPlane />
Post
</>
            }

</button>

</div>

<div className="post-build-card">

<div className="post-build-top">
<div>
<p className="post-build-kicker">Posting Progress</p>
<h3>{progressLabel}</h3>
</div>

<div className="post-build-percent">{postProgress}%</div>
</div>

<div className="post-build-track">
<div
              className="post-build-fill"
              style={{ width: `${postProgress}%` }}>
            </div>
</div>

<div className="post-build-meta">
<span>{uploading ? "Posting now" : "Step 2 of 2"}</span>
<span>{uploading ? `${postProgress}% uploaded` : isCaptionValid ? "Caption complete" : "Caption pending"}</span>
</div>

<div className="post-build-steps">
<div className={`post-build-step ${image ? "done" : ""}`}>
<span className="post-build-dot"></span>
<span>{uploading ? "Photo uploading" : "Photo selected"}</span>
</div>

<div className={`post-build-step ${uploading || isCaptionValid ? "done" : "active"}`}>
<span className="post-build-dot"></span>
<span>{uploading ? "Publishing post" : isCaptionValid ? "Ready to post" : "Add caption"}</span>
</div>
</div>

</div>

<div className="post-visibility">

<FaGlobe className="visibility-icon" />

<span>
This post will be <b>public</b> and visible to everyone on Sparse.
People can like and comment on it.
</span>

</div>

<div className="post-preview-card">

<div className="postview-image-wrapper">
<img
              src={image}
              className="post-preview-backdrop"
              alt=""
              aria-hidden="true" />
            
<img
              src={image}
              className="postview-image"
              alt="preview" />
            
</div>

</div>

<div className="post-file-info">

<div className="file-row">
<FaImage className="file-icon" />
<span>{file?.type || "Image file"}</span>
</div>

<div className="file-row">
<FaWeightHanging className="file-icon" />
<span>{formatFileSize(file?.size)}</span>
</div>

</div>

<div className="post-caption-card">

<label>Caption *</label>

<textarea
            placeholder="Write something about this post..."
            value={caption}
            onChange={handleCaptionChange} />
          

<button
            onClick={() => {
              if (caption.trim().length < 5) {
                window.showAlert?.("Write at least 5 characters", "warning");
                return;
              }
              improveCaption();
            }}
            disabled={generating}
            className={`ai-improve-btn ${caption.trim().length < 5 ? "disabled" : ""}`}>
            
{generating ?
            <div className="ai-loader"></div> :

            <>
<img src="https://odoy.in/logo/logo.png" alt="" className="ai-logo" />
Improve with Odoy AI
</>
            }
</button>

<div className="caption-meta">

<span className={`caption-status ${isCaptionValid ? "valid" : "invalid"}`}>
{isCaptionValid ? "Caption looks good" : "Caption must contain at least 3 characters"}
</span>

<span className="caption-count">
{caption.length}/{MAX_CAPTION}
</span>

</div>

</div>

</div>

<BottomNav />

</>);



}

export default AddPost;