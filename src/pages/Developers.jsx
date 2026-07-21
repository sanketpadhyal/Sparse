import DashboardNavbar from "../components/DashboardNavbar";
import BottomNav from "../components/BottomNav";
import "../settings/Settings.css";

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { db, auth } from "../firebase";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import {
  FaArrowLeft,
  FaCrown,
  FaGithub,
  FaCode,
  FaCheckCircle,
  FaTimesCircle,
  FaGem } from
"react-icons/fa";

import { MdVerified } from "react-icons/md";

function Developers() {

  const navigate = useNavigate();

  const [owners, setOwners] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {

    window.scrollTo(0, 0);

    const loadData = async () => {

      const ownerQuery = query(
        collection(db, "users"),
        where("role", "==", "owner")
      );

      const friendQuery = query(
        collection(db, "users"),
        where("role", "==", "friend")
      );

      const ownerSnap = await getDocs(ownerQuery);
      const friendSnap = await getDocs(friendQuery);

      const ownersArr = [];
      const friendsArr = [];

      ownerSnap.forEach((doc) => {
        const data = doc.data();
        ownersArr.push({
          id: doc.id,
          name: data.name,
          username: data.username,
          photo: data.profilePhoto || "/assets/profile.png"
        });
      });

      friendSnap.forEach((doc) => {
        const data = doc.data();
        friendsArr.push({
          id: doc.id,
          name: data.name,
          username: data.username,
          photo: data.profilePhoto || "/assets/profile.png"
        });
      });

      setOwners(ownersArr);
      setFriends(friendsArr);
      setLoading(false);

    };

    loadData();

  }, []);


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.role === "owner") setIsOwner(true);
        }
      } catch (err) {
        console.log(err);
      }
    });

    return () => unsub();

  }, []);

  return (

    <>

<DashboardNavbar />

<div className="settings-page">

<div className="edit-navbar">

<button
            className="back-btn"
            onClick={() => navigate(-1)}>

            

<FaArrowLeft />
</button>

<h2>Developers</h2>

<div style={{ width: "32px" }}></div>

</div>

<div className="settings-card">

<div className="settings-section">

<p className="settings-heading">
About Sparse
</p>

<div className="settings-item">

<div className="settings-icon purple">
<FaCode />
</div>

<div className="settings-text">

<h4>Sparse Platform</h4>

<p>
Sparse is a modern, production-ready social platform focused on simplicity, 
meaningful interactions, and distraction-free experiences — built for speed, clarity, and real connection.
</p>
</div>

</div>

</div>

<div className="settings-section">

<p className="settings-heading">
Founder & Developer
</p>

{loading &&

            <div className="settings-skeleton">

<div className="skeleton-profile">
<div className="skeleton-avatar"></div>

<div className="skeleton-lines">
<div className="skeleton-line"></div>
<div className="skeleton-line small"></div>
</div>

</div>

</div>

            }

{!loading && owners.map((owner) =>

            <div
              key={owner.id}
              className="settings-item"
              onClick={() => navigate(`/u/${owner.username}`)}>
              

<img
                src={owner.photo}
                alt="avatar"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(255,255,255,0.15)"
                }} />
              

<div className="settings-text">

<h4>

<FaCrown style={{ marginRight: "6px", color: "#FFD700" }} />

{owner.name}

<MdVerified
                    className="owner-tick"
                    style={{ marginLeft: "6px" }} />
                  

</h4>

<p>@{owner.username}</p>

</div>

</div>

            )}

</div>

<div className="settings-section">

<p className="settings-heading">
Sparse Teammates
</p>

{loading &&

            <div className="settings-skeleton">

<div className="skeleton-profile">
<div className="skeleton-avatar"></div>

<div className="skeleton-lines">
<div className="skeleton-line"></div>
<div className="skeleton-line small"></div>
</div>

</div>

</div>

            }

{!loading && friends.map((friend) =>

            <div
              key={friend.id}
              className="settings-item"
              onClick={() => navigate(`/u/${friend.username}`)}>
              

<img
                src={friend.photo}
                alt="avatar"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(255,255,255,0.15)"
                }} />
              

<div className="settings-text">

<h4>

<FaGem className="teammate-gem" />

{friend.name}

<MdVerified
                    className="owner-tick"
                    style={{ marginLeft: "6px" }} />
                  

</h4>

<p>@{friend.username}</p>

</div>

</div>

            )}

</div>

<div className="settings-section">

<p className="settings-heading">
Platform Philosophy
</p>

<div className="settings-item">

<div className="settings-icon green">
<FaCheckCircle />
</div>

<div className="settings-text">

<h4>Follow and Connect</h4>

<p>
Users can follow people and stay connected through
private chats and stories.
</p>

</div>

</div>

<div className="settings-item">

<div className="settings-icon green">
<FaCheckCircle />
</div>

<div className="settings-text">

<h4>Status and Stories</h4>

<p>
Users can update their status and post temporary stories
to share daily moments.
</p>

</div>

</div>

<div className="settings-item">

<div className="settings-icon green">
<FaCheckCircle />
</div>

<div className="settings-text">

<h4>Memes with Healthy Limits</h4>

<p>
Sparse includes a meme section for entertainment,
but usage is intentionally limited to about one hour per day
to prevent addictive scrolling.
</p>

</div>

</div>


<div className="settings-item">

<div className="settings-icon red">
<FaTimesCircle />
</div>

<div className="settings-text">

<h4>No Manipulative Algorithms</h4>

<p>
Sparse avoids engagement tricks used by traditional
social networks to maximize screen time.
</p>

</div>

</div>

</div>

<div className="settings-section">

<p className="settings-heading">
Open Source
</p>

<div
              className="settings-item"
              onClick={() => window.open(
                "https://github.com/sanketpadhyal/Sparse.git",
                "_blank"
              )}>
              

	<div className="settings-icon green">
		<FaGithub />
	</div>

	<div className="settings-text">
		<h4>GitHub Repository</h4>
		<p>
			Explore the Sparse project source code,
			development history and future improvements.
		</p>
	</div>

</div>

{isOwner &&

            <div
              className="settings-item owner-btn"
              onClick={() => navigate("/owner-panel")}>
              
<div className="settings-icon gold">
<FaCrown />
</div>

<div className="settings-text">
<h4>Owner Panel</h4>
<p>Manage platform, users and roles</p>
</div>

</div>

            }

</div>

</div>

</div>

<BottomNav />

</>);



}

export default Developers;