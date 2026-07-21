import { useEffect, useRef } from "react";
import "./AddStory.css";

import BottomNav from "../../components/BottomNav";
import DashboardNavbar from "../../components/DashboardNavbar";

import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaGlobe, FaMagic, FaImage } from "react-icons/fa";

import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";

function AddStory() {

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  useEffect(() => {

    window.scrollTo(0, 0);

    const unsubscribe = onAuthStateChanged(auth, (user) => {

      if (!user) {
        navigate("/home");
      }

    });

    return () => unsubscribe();

  }, [navigate]);

  const quotes = [
  "Dream big.",
  "Stay focused.",
  "Keep building.",
  "Code. Create. Repeat.",
  "Every day is progress.",
  "Work in silence.",
  "Great things take time.",
  "Small steps every day.",
  "Make it happen.",
  "Create your future."];


  const colors = [
  "#4f6cff",
  "#9333ea",
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#06b6d4",
  "#ec4899"];


  const openQuote = () => {

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    navigate("/story-editor", { state: {
        quote: randomQuote,
        bg: randomColor
      } });

  };

  const openTemplate = (text, color) => {

    navigate("/story-editor", { state: {
        quote: text,
        bg: color
      } });

  };

  const openImagePicker = () => {
    fileInputRef.current.click();
  };

  const handleMediaChange = (e) => {

    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video");

    if (isVideo) {

      const url = URL.createObjectURL(file);

      const video = document.createElement("video");

      video.preload = "metadata";

      video.onloadedmetadata = () => {

        URL.revokeObjectURL(url);

        if (video.duration > 30) {

          window.showAlert?.("Video must be under 30 seconds", "error");

          return;

        }

        navigate("/story-editor", { state: {
            video: file
          } });

      };

      video.src = url;

    } else {

      const reader = new FileReader();

      reader.onloadend = () => {

        navigate("/story-editor", { state: {
            image: reader.result
          } });

      };

      reader.readAsDataURL(file);

    }

  };

  return (

    <>

      <DashboardNavbar />

      <div className="story-page">

        <div className="story-navbar">

          <button
            className="story-back"
            onClick={() => navigate(-1)}>
            

            <FaArrowLeft />

          </button>

          <h2>Create Story</h2>

          <div className="story-spacer"></div>

        </div>

        <div className="story-notice">

          <div className="notice-icon">
            <FaMagic />
          </div>

          <div className="notice-content">
            <h4>Templates Available</h4>
            <p>
              You can now create stories using templates, photos or videos.
              Stories stay visible for 24 hours.
            </p>
          </div>

        </div>

        <div className="story-visibility">

          <FaGlobe />

          <span>Your story will be visible to everyone for 24 hours</span>

        </div>

        <div className="story-upload">

          <button
            className="upload-btn"
            onClick={openImagePicker}>
            

            <FaImage />
            Import Media

          </button>

          <input
            type="file"
            accept="image/*,video/*"
            ref={fileInputRef}
            onChange={handleMediaChange}
            style={{ display: "none" }} />
          

        </div>

        <h3 className="template-title">Templates</h3>

        <div className="story-templates">

          <div
            className="template gradient1"
            onClick={openQuote}>
            
            <span>Random Quote</span>
          </div>

          <div
            className="template gradient2"
            onClick={() => openTemplate(
              "Big things coming soon.",
              "#9333ea"
            )}>
            
            <span>Announcement</span>
          </div>

          <div
            className="template gradient3"
            onClick={() => openTemplate(
              "Stay motivated.",
              "#22c55e"
            )}>
            
            <span>Motivation</span>
          </div>

          <div
            className="template gradient4"
            onClick={() => openTemplate(
              "Important reminder.",
              "#ef4444"
            )}>
            
            <span>Reminder</span>
          </div>

        </div>

      </div>

      <BottomNav />

    </>);



}

export default AddStory;