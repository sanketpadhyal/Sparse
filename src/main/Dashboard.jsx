import React, { useEffect, useState, useRef } from "react";
import "./Dashboard.css";

import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { useNavigate } from "react-router-dom";

import { ThumbsUp, User, Folder, Clock, Heart, Minus } from "lucide-react";

function Dashboard() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [memes, setMemes] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);

  const [userLiked, setUserLiked] = useState([]);
  const [animateLike, setAnimateLike] = useState(null);
  const [animateUnlike, setAnimateUnlike] = useState(null);

  const memeSet = useRef(new Set());
  const subIndex = useRef(0);
  const lastTap = useRef(0);

  const safeSubs = [

  "memes",
  "wholesomememes",
  "funny",
  "me_irl",
  "ProgrammerHumor",
  "dankmemes",
  "AdviceAnimals",
  "ComedyCemetery",
  "PrequelMemes",
  "terriblefacebookmemes",
  "memeeconomy",
  "starterpacks",
  "facepalm",
  "therewasanattempt",
  "unexpected",
  "funnyanimals",
  "animalsbeingderps",
  "mildlyinteresting",
  "oddlysatisfying",
  "notinteresting",
  "funnyvideos",
  "madeMeSmile",
  "wholesomegifs",
  "humor",
  "cleanmemes",
  "dadjokes",
  "teenagersbutpog",
  "gamingmemes",
  "pcmasterrace",
  "minecraftmemes",
  "programmerreactions",
  "techhumor",
  "wholesomecomics",
  "comics",
  "goodboomerhumor",
  "relatablememes",
  "collegehumor",
  "funnymemes",

  "funnygifs",
  "gifsthatkeepongiving",
  "reactiongifs",
  "meirl",
  "meme",
  "memedump",
  "perfecttiming",
  "instant_regret",
  "holdmybeer",
  "therewasanattempt",
  "blursedimages",
  "cursedcomments",
  "technicallythetruth",
  "clevercomebacks",
  "rareinsults",
  "unexpecteditem",
  "unexpectedjoke",
  "unexpectedoffice",
  "unexpectedfriends",
  "unexpectedparksandrec",
  "funnyandcute",
  "animalsbeingbros",
  "animalsbeingjerks",
  "animalsbeingfunny",
  "aww",
  "eyebleach",
  "cats",
  "dogs",
  "funnycats",
  "funnydogs",
  "catmemes",
  "dogmemes",
  "starterpacks",
  "nostalgia",
  "90s",
  "wholesome",
  "wholesomememes",
  "goodanimemes",
  "gaming",
  "gamingmemes",
  "videogamememes",
  "minecraft",
  "minecraftmemes",
  "pcgaming",
  "gamedev",
  "programmerhumor",
  "codinghumor",
  "techsupportgore",
  "techhumor",
  "funnygaming",
  "memeeconomy",
  "historymemes",
  "historymeme",
  "ancientmemes",
  "educationalmemes",
  "sciencehumor",
  "physicsmemes",
  "mathmemes",
  "chemistrymemes"];



  const [hasStory, setHasStory] = useState(false);
  const [stories, setStories] = useState([]);

  const [userData, setUserData] = useState({
    username: "",
    profilePhoto: ""
  });

  const [imageLoaded, setImageLoaded] = useState({});

  const [secondsUsed, setSecondsUsed] = useState(0);

  const timerRef = useRef(null);
  const uidRef = useRef(null);

  const DAILY_LIMIT = 3600;

  const preloadImages = (stories) => {
    stories.forEach((s) => {
      const img = new Image();
      img.src = s.photo;
    });
  };

  useEffect(() => {

    window.scrollTo(0, 0);

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        navigate("/home");
        return;
      }

      uidRef.current = user.uid;

      try {

        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {

          let data = snap.data();

          setUserLiked(data.likedMemes || []);

          if (!data.memetime) {

            await updateDoc(ref, {
              memetime: {
                seconds: 0,
                date: new Date().toDateString()
              }
            });

            data.memetime = {
              seconds: 0,
              date: new Date().toDateString()
            };

          }

          if (data.memetime.date !== new Date().toDateString()) {

            await updateDoc(ref, {
              memetime: {
                seconds: 0,
                date: new Date().toDateString()
              }
            });

            data.memetime.seconds = 0;
          }

          setSecondsUsed(data.memetime.seconds);

          setUserData({
            username: data.username,
            profilePhoto: data.profilePhoto || ""
          });


          const cachedStories = sessionStorage.getItem("stories_feed");
          if (cachedStories) {
            const parsed = JSON.parse(cachedStories);
            const valid = parsed.
            filter((s) => s.expiresAt > Date.now()).
            sort((a, b) => b.expiresAt - a.expiresAt);
            setStories(valid);
          }

          fetchStoriesFeed(user.uid, data);
          checkStory(user.uid);

        }

        if ((snap.data()?.memetime?.seconds || 0) < DAILY_LIMIT) {
          startTimer();
        }

        setLoading(false);
        fetchMemes(true);

      } catch (err) {

        window.showAlert?.("Failed to load dashboard", "error");
        setLoading(false);

      }

    });

    return () => {
      unsubscribeAuth();
      if (timerRef.current) clearInterval(timerRef.current);
    };

  }, [navigate]);

  const startTimer = () => {

    if (timerRef.current) return;

    timerRef.current = setInterval(() => {

      setSecondsUsed((prev) => {

        if (prev >= DAILY_LIMIT) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return DAILY_LIMIT;
        }

        const updated = Math.min(prev + 30, DAILY_LIMIT);

        updateDoc(doc(db, "users", uidRef.current), {
          "memetime.seconds": updated
        });

        return updated;

      });

    }, 120000);

  };

  useEffect(() => {

    let ticking = false;

    const handleScroll = () => {

      if (ticking) return;

      ticking = true;

      requestAnimationFrame(() => {

        if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 300)
        {
          fetchMemes(false);
        }

        ticking = false;

      });

    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };

  }, []);



  useEffect(() => {

    const visibleMemes = memes.filter((m) => !userLiked.includes(m.url));

    if (
    visibleMemes.length < 5 &&
    !loadingMore &&
    secondsUsed < DAILY_LIMIT)
    {
      fetchMemes(false);
    }

  }, [memes, userLiked]);

  const getSub = () => {
    const sub = safeSubs[subIndex.current];
    subIndex.current = (subIndex.current + 1) % safeSubs.length;
    return sub;
  };

  const fetchMemes = async (initial) => {

    if (loadingMore) return;
    if (secondsUsed >= DAILY_LIMIT) return;

    try {

      if (!initial) {
        setLoadingMore(true);
      }

      const sub = getSub();

      const res = await fetch(`https://meme-api.com/gimme/${sub}/15`);
      const data = await res.json();

      const uniqueMemes = [];

      for (const m of data.memes) {

        if (
        !m.nsfw && (
        m.url.endsWith(".jpg") || m.url.endsWith(".png") || m.url.endsWith(".jpeg")) &&
        !memeSet.current.has(m.url) &&
        !userLiked.includes(m.url))
        {

          memeSet.current.add(m.url);
          uniqueMemes.push(m);

        }

      }

      if (uniqueMemes.length > 0) {
        setMemes((prev) => {
          const updated = [...prev, ...uniqueMemes];
          return updated.length > 60 ? updated.slice(-60) : updated;
        });
      }

      setLoadingMore(false);

    } catch (err) {
      console.log(err);
      setLoadingMore(false);
    }

  };

  const removeAfterDelay = (url) => {

    setTimeout(() => {
      setMemes((prev) => prev.filter((m) => m.url !== url));
    }, 7000);

  };


  const handleLike = async (url) => {

    if (userLiked.includes(url)) return;

    const ref = doc(db, "users", uidRef.current);

    const newLiked = [...userLiked, url];

    setAnimateLike(url);

    await updateDoc(ref, { likedMemes: newLiked });

    setUserLiked(newLiked);

    setTimeout(() => {
      setAnimateLike(null);
    }, 700);

    setTimeout(() => {
      setMemes((prev) => prev.filter((m) => m.url !== url));
    }, 7000);

  };


  const handleTap = (url) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      handleLike(url);
    }
    lastTap.current = now;
  };

  const fetchStoriesFeed = async (uid, user) => {

    try {
      const following = user.followingList || [];
      const allUsers = [uid, ...following];
      const uniqueUsers = new Map();


      for (let i = 0; i < allUsers.length; i += 10) {
        const batch = allUsers.slice(i, i + 10);
        const q = query(
          collection(db, "stories"),
          where("uid", "in", batch)
        );
        const snap = await getDocs(q);
        const promises = snap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          if (data.expiresAt && data.expiresAt > Date.now()) {
            if (!uniqueUsers.has(data.uid)) {
              const userRef = doc(db, "users", data.uid);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const udata = userSnap.data();
                return {
                  uid: data.uid,
                  name: udata.name || udata.username || "User",
                  username: udata.username,
                  photo: udata.profilePhoto || "/assets/profile.png",
                  expiresAt: data.expiresAt
                };
              }
            }
          }
          return null;
        });
        const results = await Promise.all(promises);
        results.forEach((r) => {
          if (r) uniqueUsers.set(r.uid, r);
        });
      }

      const list = Array.from(uniqueUsers.values()).
      sort((a, b) => b.expiresAt - a.expiresAt);
      const me = {
        uid: uid,
        name: user.name || user.username || "You",
        username: user.username,
        photo: user.profilePhoto || "/assets/profile.png",
        expiresAt: Date.now() + 86400000
      };
      const exists = list.some((s) => s.uid === uid);
      if (!exists) {
        list.push(me);
      }
      setStories(list);
      preloadImages(list);
      sessionStorage.setItem("stories_feed", JSON.stringify(list));
    } catch (err) {
      console.log(err);
    }

  };



  const checkStory = async (uid) => {

    try {
      const q = query(
        collection(db, "stories"),
        where("uid", "==", uid)
      );
      const snap = await getDocs(q);
      let active = false;
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.expiresAt && data.expiresAt > Date.now()) {
          active = true;
        }
      });
      console.log("hasStory:", active);
      setHasStory(active);
    } catch {
      setHasStory(false);
    }

  };

  const openStory = () => {
    if (!hasStory) return;
    navigate("/story-preview/" + userData.username);
  };

  const handleImageLoad = (url) => {
    setImageLoaded((prev) => ({ ...prev, [url]: true }));
  };

  const minutesLeft = Math.max(0, Math.floor((DAILY_LIMIT - secondsUsed) / 60));

  const getProfilePhoto = (uid, photo) => {

    if (photo && photo.trim() !== "") {
      localStorage.setItem("photo_" + uid, photo);
      return photo;
    }

    const cached = localStorage.getItem("photo_" + uid);

    if (cached) return cached;

    return "/assets/profile.png";

  };

  if (loading) {

    return (

      <div className="dashboard-page">

<div className="stories-row">

<div className="story-item">
<div className="story-avatar story-ring skeleton-avatar"></div>
<p className="skeleton-line" style={{ width: "60px" }}></p>
</div>

</div>

<div className="dashboard-divider"></div>

<div className="meme-feed">

{[1, 2, 3].map((i) =>

          <div key={i} className="meme-skeleton"></div>
          )}

</div>

</div>);



  }

  return (

    <div className="dashboard-page">

<div className="stories-row">

<div
          className="story-item"
          onClick={() => navigate("/story-preview/" + userData.username)}>
          

<div className={`story-avatar ${hasStory ? "story-ring" : ""}`}>

<img
              src={getProfilePhoto(uidRef.current, userData.profilePhoto)}
              alt="story" />
            

</div>

<p>Your Story</p>

</div>

{stories.filter((s) => s.uid !== uidRef.current).map((story) =>
        <div
          key={story.uid}
          className="story-item"
          onClick={() => navigate("/story-preview/" + story.username)}>
          
		<div className={`story-avatar story-ring`}>
			<img
              src={getProfilePhoto(story.uid, story.photo)}
              alt="story" />
            
		</div>
		<p>{story.name?.split(" ")[0]}</p>
	</div>
        )}

</div>

<div className="dashboard-divider"></div>

<div className="memes-title">

<span className="memes-title-main">M</span> <span className="memes-title-rest">emes</span>

<span className="memes-timer">
<span className="memes-minutes">{minutesLeft}</span>
<span className="memes-minutes-label"> mins left</span>
</span>

</div>

{secondsUsed >= DAILY_LIMIT ?

      <div className="memes-limit-box">
<Clock size={42} className="limit-icon" />
<h3>Daily limit reached</h3>
<p>Come back tomorrow. Today's meme time is finished.</p>
</div> :



      <div className="meme-feed">

{memes.filter((m) => !userLiked.includes(m.url)).map((meme) => {

          const loaded = imageLoaded[meme.url];

          return (

            <div key={meme.url} className="meme-full">

<div
                className="meme-image-container"
                onDoubleClick={() => handleLike(meme.url)}
                onTouchStart={() => handleTap(meme.url)}>
                

{!loaded &&

                <div className="meme-skeleton overlay"></div>
                }

<img
                  src={meme.url}
                  alt="meme"
                  loading="lazy"
                  className={loaded ? "loaded" : ""}
                  onLoad={() => handleImageLoad(meme.url)} />
                

{animateLike === meme.url &&

                <div className="double-like-animation">
<Heart size={120} fill="#ff3040" stroke="#ff3040" />
</div>
                }

{animateUnlike === meme.url &&

                <div className="double-unlike-animation">
<Minus size={120} stroke="white" />
</div>
                }

</div>

{loaded &&

              <div className="meme-info">

<div className="meme-top">

<span className="meme-source">
<Folder size={14} /> r/{meme.subreddit}
</span>

<span className="meme-author">
<User size={14} /> u/{meme.author}
</span>

</div>

<p className="meme-title">{meme.title}</p>

<div className="meme-engagement">

<span
                    className="meme-like"
                    onClick={() => handleLike(meme.url)}
                    style={{ cursor: "pointer" }}>

                    

<ThumbsUp size={16} />

</span>

</div>

</div>

              }

</div>);



        })}

{loadingMore && [1, 2, 3].map((i) =>
        <div key={i} className="meme-skeleton"></div>
        )}

</div>

      }

</div>);



}

export default Dashboard;