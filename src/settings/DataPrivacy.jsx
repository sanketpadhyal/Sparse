import DashboardNavbar from "../components/DashboardNavbar";
import BottomNav from "../components/BottomNav";
import "./Settings.css";

import { useNavigate } from "react-router-dom";
import { useLayoutEffect, useEffect, useState } from "react";

import { FaArrowLeft, FaShieldAlt, FaDatabase, FaLock } from "react-icons/fa";

import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function YourData() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [userData, setUserData] = useState({
    name: "",
    username: "",
    email: "",
    createdAt: ""
  });

  const [localStorageSize, setLocalStorageSize] = useState("0 KB");
  const [cacheSize, setCacheSize] = useState("0 KB");

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const calculateLocalStorage = () => {

    let total = 0;

    for (let key in localStorage) {
      if (!localStorage.hasOwnProperty(key)) continue;
      total += (localStorage[key].length + key.length) * 2;
    }

    const kb = (total / 1024).toFixed(2);

    setLocalStorageSize(`${kb} KB`);
  };

  const calculateCache = async () => {

    if (!("caches" in window)) {
      setCacheSize("Not supported");
      return;
    }

    let total = 0;

    const names = await caches.keys();

    for (const name of names) {

      const cache = await caches.open(name);
      const requests = await cache.keys();

      for (const req of requests) {

        const res = await cache.match(req);

        if (res) {
          const blob = await res.clone().blob();
          total += blob.size;
        }

      }

    }

    const kb = (total / 1024).toFixed(2);

    setCacheSize(`${kb} KB`);

  };

  useEffect(() => {

    calculateLocalStorage();
    calculateCache();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        navigate("/home");
        return;
      }

      try {

        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {

          const data = snap.data();

          setUserData({
            name: data.name || "",
            username: data.username || "",
            email: data.email || "",
            createdAt: data.createdAt?.toDate().toLocaleString() || ""
          });

        }

      } catch (err) {
        console.error(err);
      }

      setLoading(false);

    });

    return () => unsubscribe();

  }, [navigate]);

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

<h2>Your Data</h2>

<div style={{ width: "32px" }}></div>

</div>

<div className="settings-card">

{loading ?

          <div className="settings-skeleton">

<div className="skeleton-line"></div>
<div className="skeleton-line"></div>
<div className="skeleton-line"></div>

</div> :



          <>

<div className="settings-section">

<p className="settings-heading">
Account information
</p>

<div className="settings-item">

<div className="settings-icon blue">
<FaDatabase />
</div>

<div className="settings-text">
<h4>Name</h4>
<p>{userData.name}</p>
</div>

</div>

<div className="settings-item">

<div className="settings-icon green">
<FaDatabase />
</div>

<div className="settings-text">
<h4>Username</h4>
<p>@{userData.username}</p>
</div>

</div>

<div className="settings-item">

<div className="settings-icon yellow">
<FaDatabase />
</div>

<div className="settings-text">
<h4>Email</h4>
<p>{userData.email}</p>
</div>

</div>

<div className="settings-item">

<div className="settings-icon red">
<FaDatabase />
</div>

<div className="settings-text">
<h4>Account created</h4>
<p>{userData.createdAt}</p>
</div>

</div>

</div>

<div className="settings-section">

<p className="settings-heading">
App storage
</p>

<div className="settings-item">

<div className="settings-icon blue">
<FaDatabase />
</div>

<div className="settings-text">
<h4>Local storage used</h4>
<p>{localStorageSize}</p>
</div>

</div>

<div className="settings-item">

<div className="settings-icon green">
<FaDatabase />
</div>

<div className="settings-text">
<h4>Cache storage used</h4>
<p>{cacheSize}</p>
</div>

</div>

</div>

<div className="settings-section">

<p className="settings-heading">
Security
</p>

<div className="settings-item">

<div className="settings-icon blue">
<FaShieldAlt />
</div>

<div className="settings-text">
<h4>Your data is protected</h4>
<p>Your account information is securely stored and protected using authentication systems.</p>
</div>

</div>

<div className="settings-item">

<div className="settings-icon green">
<FaLock />
</div>

<div className="settings-text">
<h4>Private and secure</h4>
<p>Your personal information is only accessible to you and is never shared publicly.</p>
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

export default YourData;