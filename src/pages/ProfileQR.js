import { useEffect, useState, useRef, useLayoutEffect } from "react";
import BottomNav from "../components/BottomNav";
import DashboardNavbar from "../components/DashboardNavbar";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import { FaDownload, FaExternalLinkAlt, FaArrowLeft } from "react-icons/fa";

import "./ProfileQR.css";

function ProfileQR() {

  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [qrLink, setQrLink] = useState("");
  const [loading, setLoading] = useState(true);

  const exportRef = useRef(null);

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

        if (!snap.exists()) {
          setLoading(false);
          return;
        }

        const data = snap.data();

        const correctLink = "https://www.sparse.in/u/" + data.username;

        if (data.qrLink !== correctLink) {

          await updateDoc(ref, {
            qrLink: correctLink
          });

        }

        setUsername(data.username);
        setQrLink(correctLink);

      } catch (err) {

        console.log(err);

      }

      setLoading(false);

    });

    return () => unsubscribe();

  }, [navigate]);

  const shareLink = async () => {

    if (navigator.share) {

      try {

        await navigator.share({
          title: "👀 Check out my Sparse profile",
          text: "👀 Check out my profile on Sparse",
          url: qrLink
        });

      } catch (err) {

        try {

          await navigator.clipboard.writeText(qrLink);
          window.showAlert?.("Profile link copied", "success");

        } catch (clipErr) {

          const textArea = document.createElement("textarea");
          textArea.value = qrLink;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          window.showAlert?.("Profile link copied", "success");

        }

      }

    } else {

      try {

        await navigator.clipboard.writeText(qrLink);
        window.showAlert?.("Profile link copied", "success");

      } catch (err) {

        const textArea = document.createElement("textarea");
        textArea.value = qrLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        window.showAlert?.("Profile link copied", "success");

      }

    }

  };

  const copyLink = async () => {

    try {

      await navigator.clipboard.writeText(qrLink);
      window.showAlert?.("Profile link copied", "success");

    } catch (err) {

      const textArea = document.createElement("textarea");
      textArea.value = qrLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      window.showAlert?.("Profile link copied", "success");

    }

  };

  const downloadQR = async () => {

    if (!exportRef.current) return;

    const canvas = await html2canvas(exportRef.current, {
      backgroundColor: "#000000",
      scale: 3
    });

    const link = document.createElement("a");
    link.download = `${username}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 1);
    link.click();

  };

  return (

    <div className="qr-page">

<DashboardNavbar />

<div className="qr-card">

<button
          className="qr-back-btn"
          onClick={() => navigate(-1)}>
          
<FaArrowLeft />
</button>

<button
          className="qr-share-btn"
          onClick={shareLink}>

          

<FaExternalLinkAlt />
</button>

<img
          src="/assets/logo.png"
          className="qr-logo"
          alt="logo" />
        

{loading ?

        <div className="qr-skeleton-username"></div> :



        <h2 className="qr-username">
@{username}
</h2>

        }

{loading ?

        <div className="qr-skeleton-box"></div> :



        <div className="qr-box">

<QRCode
            value={qrLink}
            size={220}
            fgColor="#ffffff"
            bgColor="#0a0a0a"
            level="H" />
          

</div>

        }

{loading ?

        <div className="qr-skeleton-link"></div> :



        <p className="qr-link">
{qrLink}
</p>

        }

{!loading &&

        <>

<p className="qr-scan-text">
Scan to open profile on Sparse 💕
</p>

<div className="qr-actions">

<button
              className="qr-copy"
              onClick={copyLink}>

              

Copy Link </button>

<button
              className="qr-download"
              onClick={downloadQR}>

              

<FaDownload />
</button>

</div>
</>

        }

</div>

<div className="qr-export-card" ref={exportRef}>

<img
          src="/assets/logo.png"
          className="qr-export-logo"
          alt="" />
        

<h2 className="qr-export-username">
@{username}
</h2>

<div className="qr-export-box">

<QRCode
            value={qrLink}
            size={260}
            fgColor="#ffffff"
            bgColor="#000000"
            level="H" />
          

</div>

</div>

<BottomNav />

</div>);



}

export default ProfileQR;