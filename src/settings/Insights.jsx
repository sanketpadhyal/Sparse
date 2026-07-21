import DashboardNavbar from "../components/DashboardNavbar";
import BottomNav from "../components/BottomNav";
import "./Settings.css";

import { useNavigate } from "react-router-dom";
import { useLayoutEffect, useEffect, useState } from "react";

import { FaArrowLeft, FaChartLine } from "react-icons/fa";

import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine } from
"recharts";

function Insights() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [photo, setPhoto] = useState("");
  const [secondsUsed, setSecondsUsed] = useState(0);

  const DAILY_LIMIT = 3600;
  const midpoint = 30;

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        navigate("/home");
        return;
      }

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {

        const data = snap.data();

        setName(data.name || "");
        setUsername(data.username || "");
        setPhoto(data.profilePhoto || "");
        setSecondsUsed(data?.memetime?.seconds || 0);

      }

      setLoading(false);

    });

    return () => unsubscribe();

  }, [navigate]);

  const minutesUsed = Math.floor(secondsUsed / 60);
  const minutesLeft = Math.floor((DAILY_LIMIT - secondsUsed) / 60);

  let peak = 0;

  if (minutesUsed <= midpoint) {
    peak = 1 - minutesUsed / midpoint;
  } else {
    peak = -(minutesUsed - midpoint) / midpoint;
  }

  const graphData = [

  { t: 0, v: 0 },
  { t: 1, v: 0 },
  { t: 2, v: 0 },
  { t: 3, v: -0.08 },
  { t: 4, v: 0.12 },
  { t: 5, v: peak },
  { t: 6, v: 0 }];



  const strokeColor = peak >= 0 ? "#00ff6a" : "#ff3040";
  const fillColor = peak >= 0 ? "#00ff6a33" : "#ff304033";

  return (

    <>

<DashboardNavbar />

<div
        className="settings-page"
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none"
        }}>
        

<div className="edit-navbar">

<button
            className="back-btn"
            onClick={() => navigate(-1)}>
            
<FaArrowLeft />
</button>

<h2>Insights</h2>

<div style={{ width: "32px" }}></div>

</div>

<div className="settings-card">

{loading ?

          <div className="settings-skeleton">

<div className="skeleton-profile">
<div className="skeleton-avatar"></div>
<div className="skeleton-lines">
<div className="skeleton-line"></div>
<div className="skeleton-line small"></div>
</div>
</div>

<div className="skeleton-item"></div>

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
Today's Screen Time
</p>

<div className="settings-item">

<div className="settings-icon green">
<FaChartLine />
</div>

<div className="settings-text">
<h4>{minutesUsed} minutes used</h4>
<p>{minutesLeft} minutes remaining</p>
</div>

</div>

<div
                style={{
                  width: "100%",
                  height: "220px",
                  pointerEvents: "none"
                }}>
                

<ResponsiveContainer width="100%" height="100%">

<AreaChart data={graphData}>

<XAxis hide dataKey="t" />
<YAxis hide />

<ReferenceLine y={0} stroke="#444" />

<Area
                      type="monotone"
                      dataKey="v"
                      stroke={strokeColor}
                      strokeWidth={3}
                      fill={fillColor}
                      isAnimationActive={true} />
                    

</AreaChart>

</ResponsiveContainer>

</div>

</div>

<div className="settings-section">

<p className="settings-heading">
Focus Mode
</p>

<div className="settings-item">

<div className="settings-icon green">
<FaChartLine />
</div>

<div className="settings-text">
<h4>Welcome to distraction-free environment</h4>
<p>Your daily meme limit keeps you focused</p>
</div>

</div>

</div>

</>

          }

</div>

</div>

<BottomNav />

</>);



}

export default Insights;