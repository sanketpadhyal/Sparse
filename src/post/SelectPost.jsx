import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./SelectPost.css";

import BottomNav from "../components/BottomNav";
import DashboardNavbar from "../components/DashboardNavbar";

import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaImage, FaGlobe, FaHeart, FaComment, FaUser } from "react-icons/fa";

import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

function SelectPost() {

  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const postProgress = 42;

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/home");
      }
    });

    return () => unsubscribe();

  }, [navigate]);

  const openImagePicker = () => {
    fileInputRef.current.click();
  };

  const handleMediaChange = (e) => {

    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      window.showAlert?.("Only images allowed", "warning");
      return;
    }

    const imageURL = URL.createObjectURL(file);

    navigate("/dashboard/add-post", {
      state: {
        image: imageURL,
        file: file
      }
    });

    e.target.value = "";
  };

  return (

    <>

<DashboardNavbar />

<div className="select-post-page">

<div className="select-post-navbar">

<button className="post-back" onClick={() => navigate(-1)}>
<FaArrowLeft />
</button>

<h2>Create Post</h2>

<div className="post-spacer"></div>

</div>


<div className="post-progress-card">

<div className="post-progress-top">
<div>
<p className="post-progress-kicker">Posting Progress</p>
<h3>Choose your photo</h3>
</div>

<div className="post-progress-percent">{postProgress}%</div>
</div>

<div className="post-progress-track">
<div
              className="post-progress-fill"
              style={{ width: `${postProgress}%` }}>
            </div>
</div>

<div className="post-progress-meta">
<span>Step 1 of 2</span>
<span>Photo selection</span>
</div>

<div className="post-progress-steps">
<div className="progress-step active">
<span className="progress-dot"></span>
<span>Pick media</span>
</div>

<div className="progress-step">
<span className="progress-dot"></span>
<span>Add caption</span>
</div>
</div>

</div>



<div className="post-info-card">

<h4>Post Visibility</h4>

<div className="info-row">
<FaGlobe className="info-icon globe" />
<span>Your post will be visible to everyone.</span>
</div>

<div className="info-row">
<FaHeart className="info-icon heart" />
<span>People can like your post.</span>
</div>

<div className="info-row">
<FaComment className="info-icon comment" />
<span>Public can comment on your post.</span>
</div>

<div className="info-row">
<FaUser className="info-icon user" />
<span>The post will appear on your profile.</span>
</div>

</div>



<div className="post-upload-card">

<div className="post-illustration-wrapper">

{!imgLoaded && <div className="post-skeleton"></div>}

<img
              src="/assets/post.png"
              alt="post illustration"
              className={`post-illustration ${imgLoaded ? "show" : ""}`}
              onLoad={() => setImgLoaded(true)} />
            

</div>

<h3>Upload Photo</h3>

<p>
Select a photo to create your post.  
You can add captions and edit it in the next step.
</p>

<button className="post-upload-btn" onClick={openImagePicker}>
<FaImage className="upload-icon" />
Import Photo
</button>

<input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleMediaChange}
            style={{ display: "none" }} />
          

</div>

</div>

<BottomNav />

</>);



}

export default SelectPost;