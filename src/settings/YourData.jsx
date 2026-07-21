import DashboardNavbar from "../components/DashboardNavbar";
import BottomNav from "../components/BottomNav";
import "./Settings.css";

import { useNavigate } from "react-router-dom";
import { useLayoutEffect, useEffect, useState } from "react";

import { FaArrowLeft, FaDatabase, FaServer, FaInfoCircle } from "react-icons/fa";

import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

function StorageInfo() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

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

    const unsubscribe = onAuthStateChanged(auth, (user) => {

      if (!user) {
        navigate("/home");
        return;
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

<h2>App Storage</h2>

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
Storage usage
</p>

<div className="settings-item">

<div className="settings-icon blue">
<FaDatabase />
</div>

<div className="settings-text">
<h4>Local storage</h4>
<p>{localStorageSize} used for authentication and session data</p>
</div>

</div>

<div className="settings-item">

<div className="settings-icon green">
<FaDatabase />
</div>

<div className="settings-text">
<h4>Cache storage</h4>
<p>{cacheSize} used to load the app faster</p>
</div>

</div>

</div>

<div className="settings-section">

<p className="settings-heading">
Where your data is stored
</p>

<div className="settings-item">

<div className="settings-icon yellow">
<FaServer />
</div>

<div className="settings-text">
<h4>Secure cloud database</h4>
<p>Your account data is securely stored on cloud servers and protected using authentication systems.</p>
</div>

</div>

<div className="settings-item">

<div className="settings-icon blue">
<FaDatabase />
</div>

<div className="settings-text">
<h4>Browser storage</h4>
<p>Your device stores small pieces of data locally to keep you logged in and improve performance.</p>
</div>

</div>

</div>

<div className="settings-section">

<p className="settings-heading">
Why this storage is required
</p>

<div className="settings-item">

<div className="settings-icon red">
<FaInfoCircle />
</div>

<div className="settings-text">
<h4>Essential for app functionality</h4>
<p>This storage allows the web app to authenticate users, maintain sessions, and load content quickly.</p>
</div>

</div>

<div className="settings-item">

<div className="settings-icon green">
<FaInfoCircle />
</div>

<div className="settings-text">
<h4>Cannot be removed individually</h4>
<p>Some storage is required for the web application to function properly. Clearing it manually may log you out or reset app data.</p>
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

export default StorageInfo;