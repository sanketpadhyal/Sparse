import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, query, orderBy, limit, startAfter } from "firebase/firestore";

import DashboardNavbar from "../components/DashboardNavbar";
import BottomNav from "../components/BottomNav";

import { FaHeart, FaRegHeart } from "react-icons/fa";
import { MdVerified } from "react-icons/md";

import "../main/Dashboard.css";


function PostsFeed() {

  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthLoading(false);
    });

    return () => unsubscribe();

  }, []);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [lastDoc, setLastDoc] = useState(null);

  const [imageLoaded, setImageLoaded] = useState({});
  const [animateLike, setAnimateLike] = useState(null);

  const lastTap = useRef(0);
  const userCache = useRef({});

  useEffect(() => {
    if (!user) return;
    window.scrollTo(0, 0);
    init();
  }, [user]);

  const init = async () => {
    await fetchPosts(true);
    setLoading(false);
  };

  useEffect(() => {

    let ticking = false;

    const handleScroll = () => {
      if (!hasMore) return;

      if (ticking) return;

      ticking = true;

      requestAnimationFrame(() => {
        if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 300)
        {
          fetchPosts(false);
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);

  }, [hasMore]);

  useEffect(() => {
    return () => {
      setPosts([]);
      setLastDoc(null);
      setHasMore(true);
    };
  }, []);

  const fetchPosts = async (initial) => {

    if (loadingMore || !hasMore && !initial) return;

    if (!initial && !lastDoc) return;

    try {

      if (!initial) setLoadingMore(true);

      let q;

      if (initial) {
        q = query(
          collection(db, "posts"),
          orderBy("createdAt", "desc"),
          limit(10)
        );
      } else {
        q = query(
          collection(db, "posts"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(10)
        );
      }

      const snap = await getDocs(q);

      if (snap.empty) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      setLastDoc(snap.docs[snap.docs.length - 1]);

      const arr = await Promise.all(
        snap.docs.map(async (docu) => {
          const data = docu.data();

          let userData = {};

          if (data.uid) {
            if (userCache.current[data.uid]) {
              userData = userCache.current[data.uid];
            } else {
              const userSnap = await getDoc(doc(db, "users", data.uid));
              if (userSnap.exists()) {
                userData = userSnap.data();
                userCache.current[data.uid] = userData;
              }
            }
          }

          return {
            id: docu.id,
            ...data,
            user: userData
          };
        })
      );

      setPosts((prev) => initial ? arr : [...prev, ...arr]);

      setLoadingMore(false);

    } catch (e) {
      console.log(e);
      setLoadingMore(false);
    }

  };

  const toggleLike = async (post) => {
    const uid = auth.currentUser.uid;
    const ref = doc(db, "posts", post.id);

    const alreadyLiked = post.likes?.includes(uid);

    try {
      if (alreadyLiked) {
        await updateDoc(ref, { likes: arrayRemove(uid) });
      } else {
        await updateDoc(ref, { likes: arrayUnion(uid) });
        setAnimateLike(post.id);
        setTimeout(() => setAnimateLike(null), 700);
      }
    } catch (e) {
      console.log(e);
      return;
    }

    setPosts((prev) =>
    prev.map((p) =>
    p.id === post.id ?
    {
      ...p,
      likes: alreadyLiked ?
      p.likes.filter((l) => l !== uid) :
      [...(p.likes || []), uid]
    } :
    p
    )
    );
  };

  const handleDoubleTap = (post) => {

    const now = Date.now();

    if (now - lastTap.current < 300) {
      toggleLike(post);
    }

    lastTap.current = now;

  };

  const handleImageLoad = (id) => {
    setImageLoaded((prev) => ({ ...prev, [id]: true }));
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <>
      <DashboardNavbar />

      <div className="auth-block">

        <h2>Login Required</h2>

        <p>
        You need to login or signup first to view the posts feed.
        </p>

        <div className="auth-actions">

          <button onClick={() => navigate("/login")}>Login</button>

          <button onClick={() => navigate("/signup")}>Sign Up</button>

          <button className="home-btn" onClick={() => navigate("/home")}>Go Home</button>

        </div>

      </div>
    </>);

  }

  return (

    <>

<DashboardNavbar />

<div className="dashboard-page" style={{ paddingBottom: "100px" }}>

<div className="memes-title">
<span className="memes-title-main">P</span>
<span className="memes-title-rest">osts</span>
</div>

<div className="meme-feed">

{loading ?

          [1, 2, 3].map((i) =>
          <div key={i} className="meme-skeleton"></div>
          ) :



          posts.map((post) => {

            const uid = auth.currentUser?.uid;
            const liked = post.likes?.includes(uid);
            const loaded = imageLoaded[post.id];
            const user = post.user || {};

            return (
              <div key={post.id} className="meme-full">

    <div className="meme-info">

    <div className="meme-top">

    <div
                      style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                      onClick={() => navigate("/u/" + user.username)}>
                      

    <img
                        src={user.profilePhoto || "/assets/profile.png"}
                        alt={user.name ? `${user.name} profile` : "Profile"}
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "50%",
                          objectFit: "cover"
                        }} />
                      

    <div style={{ display: "flex", flexDirection: "column" }}>

    <span className="meme-author">

    {user.name || user.username}

    {(user.role === "verified" || user.role === "owner" || user.role === "friend" || user.role === "pookie") &&
                          <MdVerified style={{ marginLeft: "4px" }} />
                          }

    </span>

    <span style={{ fontSize: "12px", opacity: .7 }}>
    @{user.username}
    </span>

    </div>

    </div>

    </div>

    </div>

    <div
                  className="meme-image-container"
                  onClick={() => handleDoubleTap(post)}>
                  

    {!loaded && <div className="meme-skeleton overlay"></div>}

    <img
                    src={post.photo}
                    className="meme-image-backdrop"
                    alt=""
                    aria-hidden="true" />
                  

    <img
                    src={post.photo}
                    className={`meme-image ${loaded ? "loaded" : ""}`}
                    alt={post.caption || "Post"}
                    onLoad={() => handleImageLoad(post.id)} />
                  

    {animateLike === post.id &&
                  <div className="double-like-animation">
    <FaHeart size={120} />
    </div>
                  }

    </div>

    <div className="meme-info">

    <p className="meme-title">{post.caption}</p>

    <div className="meme-engagement">

    <span
                      className="meme-like"
                      onClick={() => toggleLike(post)}>
                      

    {liked ? <FaHeart color="#ff3040" /> : <FaRegHeart />}

    <span style={{ marginLeft: "6px" }}>
    {post.likes?.length || 0}
    </span>

    </span>

    </div>

    </div>

    </div>);


          })

          }

{loadingMore && <div className="meme-skeleton"></div>}

{!hasMore && !loading &&

          <div style={{
            textAlign: "center",
            color: "#888",
            fontSize: "14px",
            marginTop: "20px",
            padding: "20px"
          }}>
No more posts
</div>

          }

</div>

</div>

<BottomNav />

</>);



}

export default PostsFeed;