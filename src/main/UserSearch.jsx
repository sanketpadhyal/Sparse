import { useState, useEffect, useRef } from "react";
import BottomNav from "../components/BottomNav";
import DashboardNavbar from "../components/DashboardNavbar";
import "./UserSearch.css";

import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  limit } from
"firebase/firestore";
import { MdVerified } from "react-icons/md";

import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSearch } from "react-icons/fa";

function UserSearch() {

  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mutualLoading, setMutualLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const storySetRef = useRef(new Set());
  const storySetLoaded = useRef(false);

  useEffect(() => {

    window.scrollTo(0, 0);

    const unsubscribe = auth.onAuthStateChanged((user) => {

      if (!user) {
        navigate("/home", { replace: true });
        return;
      }

      setAuthChecked(true);

      const cachedSearch = sessionStorage.getItem("search_query");
      const cachedUsers = sessionStorage.getItem("search_results");

      if (cachedSearch) setSearch(cachedSearch);
      if (cachedUsers) setUsers(JSON.parse(cachedUsers));

      initMutual();

    });

    return () => unsubscribe();

  }, []);

  const loadStorySet = async () => {

    if (storySetLoaded.current) return storySetRef.current;

    try {

      const q = query(
        collection(db, "stories"),
        where("expiresAt", ">", Date.now())
      );

      const snap = await getDocs(q);

      const set = new Set();

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.uid) set.add(data.uid);
      });

      storySetRef.current = set;
      storySetLoaded.current = true;

      return set;

    } catch {
      return storySetRef.current;
    }

  };

  const initMutual = async () => {

    const user = auth.currentUser;
    if (!user) return;

    const meSnap = await getDoc(doc(db, "users", user.uid));
    if (!meSnap.exists()) return;

    const myFollowing = meSnap.data().followingList || [];

    const cachedMutual = sessionStorage.getItem("mutual_contacts");
    const cachedFollowing = sessionStorage.getItem("following_snapshot");

    if (cachedMutual && cachedFollowing) {

      const parsed = JSON.parse(cachedMutual);
      const cacheTime = parsed.time;
      const now = Date.now();

      const CACHE_LIMIT = 2 * 60 * 1000;

      const isFresh = now - cacheTime < CACHE_LIMIT;

      const oldFollowing = JSON.parse(cachedFollowing);

      const same =
      oldFollowing.length === myFollowing.length &&
      oldFollowing.every((id) => myFollowing.includes(id));

      if (same && isFresh) {
        setSuggested(parsed.data);
        setMutualLoading(false);
        fetchMutualContacts(myFollowing);
        return;
      }
    }

    fetchMutualContacts(myFollowing);

  };

  const fetchMutualContacts = async (myFollowing) => {

    setMutualLoading(true);

    try {

      const user = auth.currentUser;
      if (!user) return;

      let suggestedSet = new Set();

      const followingSnaps = await Promise.all(
        myFollowing.map((uid) => getDoc(doc(db, "users", uid)))
      );

      followingSnaps.forEach((snap) => {
        if (!snap.exists()) return;

        const following = snap.data().followingList || [];

        following.forEach((id) => {
          if (id !== user.uid && !myFollowing.includes(id)) {
            suggestedSet.add(id);
          }
        });
      });

      let ids = Array.from(suggestedSet);

      if (ids.length === 0) {

        const allUsersSnap = await getDocs(
          query(collection(db, "users"), limit(20))
        );

        allUsersSnap.forEach((docSnap) => {
          if (docSnap.id !== user.uid && !myFollowing.includes(docSnap.id)) {
            ids.push(docSnap.id);
          }
        });

      }

      ids = ids.slice(0, 15);

      const results = [];
      const storySet = await loadStorySet();

      const userSnaps = await Promise.all(
        ids.map((uid) => getDoc(doc(db, "users", uid)))
      );

      userSnaps.forEach((snap, index) => {
        if (!snap.exists()) return;

        const data = snap.data();
        const uid = ids[index];

        results.push({
          id: uid,
          name: data.name,
          username: data.username,
          photo: data.profilePhoto || "",
          hasStory: storySet.has(uid),
          role: data.role || ""
        });
      });

      setSuggested(results);

      sessionStorage.setItem(
        "mutual_contacts",
        JSON.stringify({
          data: results,
          time: Date.now()
        })
      );
      sessionStorage.setItem(
        "following_snapshot",
        JSON.stringify(myFollowing)
      );

    } catch (err) {
      console.log(err);
    }

    setMutualLoading(false);

  };

  const searchUsers = async (value) => {

    setSearch(value);
    sessionStorage.setItem("search_query", value);

    if (value.trim().length < 2) {
      setUsers([]);
      sessionStorage.removeItem("search_results");
      return;
    }

    setLoading(true);

    try {

      const q = query(
        collection(db, "users"),
        where("username", ">=", value.toLowerCase()),
        where("username", "<=", value.toLowerCase() + "\uf8ff")
      );

      const snap = await getDocs(q);

      const results = [];
      const storySet = await loadStorySet();

      snap.docs.forEach((docSnap) => {

        const data = docSnap.data();

        results.push({
          id: docSnap.id,
          name: data.name,
          username: data.username,
          photo: data.profilePhoto || "",
          hasStory: storySet.has(docSnap.id),
          role: data.role || ""
        });

      });

      setUsers(results);

      sessionStorage.setItem(
        "search_results",
        JSON.stringify(results)
      );

    } catch (err) {
      console.log(err);
    }

    setLoading(false);

  };

  const openStory = (username) => {
    navigate("/story-preview/" + username);
  };

  const handleBack = () => {

    sessionStorage.removeItem("search_query");
    sessionStorage.removeItem("search_results");

    setSearch("");
    setUsers([]);

    navigate(-1);

  };

  if (!authChecked) return null;

  return (

    <>

<DashboardNavbar />

<div className="search-page">

<div className="search-header">

<button
            className="search-back"
            onClick={handleBack}>
            
<FaArrowLeft />
</button>

<div className="search-box">

<FaSearch className="search-icon" />

<input
              type="text"
              placeholder="Search username"
              value={search}
              onChange={(e) => searchUsers(e.target.value)} />
            

</div>

</div>

<div className="search-results">

{loading &&

          <>

<div className="search-loader"></div>

{[1, 2, 3, 4, 5].map((i) =>
            <div key={i} className="search-user skeleton-user">

<div className="skeleton-avatar"></div>

<div className="search-user-info">

<div className="skeleton-line"></div>
<div className="skeleton-line small"></div>

</div>

</div>
            )}

</>

          }

{!loading && search.length === 0 && mutualLoading &&

          <>
<h3 className="search-suggest-title">Mutual Contacts</h3>

{[1, 2, 3, 4, 5].map((i) =>
            <div key={i} className="search-user skeleton-user">

<div className="skeleton-avatar"></div>

<div className="search-user-info">

<div className="skeleton-line"></div>
<div className="skeleton-line small"></div>

</div>

</div>
            )}

</>

          }

{!loading && search.length === 0 && !mutualLoading && suggested.length > 0 &&

          <>

<h3 className="search-suggest-title">Mutual Contacts</h3>

{suggested.map((user) =>
            <div
              key={user.id}
              className="search-user"
              onClick={() => navigate("/u/" + user.username)}>
              

<div className="search-avatar-wrapper">

<div
                  className={user.hasStory ? "story-ring" : ""}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (user.hasStory) openStory(user.username);
                  }}>
                  

<img
                    src={user.photo || "/assets/profile.png"}
                    className="search-avatar"
                    alt="avatar" />
                  

</div>

</div>

<div className="search-user-info">

<h4>
{user.name}

{(user.role === "owner" || user.role === "friend" || user.role === "pookie" || user.role === "verified") &&
                  <MdVerified
                    className="owner-tick"
                    title={
                    user.role === "owner" ?
                    "Verified Owner" :
                    user.role === "friend" ?
                    "Sparse Project Teammate" :
                    user.role === "pookie" ?
                    "Loyal User" :
                    "Verified User"
                    } />

                  }

</h4>
<p>@{user.username}</p>

</div>

</div>
            )}

</>

          }

{!loading && users.length === 0 && search.length > 1 &&
          <div className="search-empty">
No users found
</div>
          }

{!loading && users.map((user) =>
          <div
            key={user.id}
            className="search-user"
            onClick={() => navigate("/u/" + user.username)}>
            

<div className="search-avatar-wrapper">

<div
                className={user.hasStory ? "story-ring" : ""}
                onClick={(e) => {
                  e.stopPropagation();
                  if (user.hasStory) openStory(user.username);
                }}>
                

<img
                  src={user.photo || "/assets/profile.png"}
                  className="search-avatar"
                  alt="avatar" />
                

</div>

</div>

<div className="search-user-info">

<h4>
{user.name}

{(user.role === "owner" || user.role === "friend" || user.role === "pookie" || user.role === "verified") &&
                <MdVerified
                  className="owner-tick"
                  title={
                  user.role === "owner" ?
                  "Verified Owner" :
                  user.role === "friend" ?
                  "Sparse Project Teammate" :
                  user.role === "pookie" ?
                  "Loyal User" :
                  "Verified User"
                  } />

                }

</h4>
<p>@{user.username}</p>

</div>

</div>
          )}

</div>

</div>

<BottomNav />

</>);



}

export default UserSearch;