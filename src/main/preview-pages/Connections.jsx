import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Connections.css";

import { db, auth } from "../../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove } from
"firebase/firestore";

import { FaArrowLeft } from "react-icons/fa";
import { MdVerified } from "react-icons/md";

function Connections() {

  const { username, type } = useParams();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myFollowing, setMyFollowing] = useState([]);
  const [currentUid, setCurrentUid] = useState("");
  const [profileUid, setProfileUid] = useState("");

  useEffect(() => {

    window.scrollTo(0, 0);

    if (!auth.currentUser) {
      navigate("/home", { replace: true });
      return;
    }

    const loadConnections = async () => {

      try {

        const currentUser = auth.currentUser;

        if (currentUser) {
          setCurrentUid(currentUser.uid);
        }

        const q = query(
          collection(db, "users"),
          where("username", "==", username)
        );

        const snap = await getDocs(q);

        if (snap.empty) {
          navigate("/dashboard");
          return;
        }

        const profileDoc = snap.docs[0];
        const profileData = profileDoc.data();

        setProfileUid(profileDoc.id);

        let ids = [];

        if (type === "followers") {
          ids = profileData.followersList || [];
        } else {
          ids = profileData.followingList || [];
        }

        if (ids.length === 0) {
          setUsers([]);
          setLoading(false);
          return;
        }

        const refs = ids.map((uid) => doc(db, "users", uid));
        const snaps = await Promise.all(refs.map((r) => getDoc(r)));

        const result = snaps.
        filter((s) => s.exists()).
        map((s) => {
          const u = s.data();
          return {
            uid: s.id,
            name: u.name || "User",
            username: u.username,
            photo: u.profilePhoto || "/assets/profile.png",
            role: u.role || ""
          };
        });

        setUsers(result);

        if (currentUser) {

          const meSnap = await getDoc(doc(db, "users", currentUser.uid));

          if (meSnap.exists()) {
            setMyFollowing(meSnap.data().followingList || []);
          }

        }

      } catch (err) {
        console.log(err);
      }

      setLoading(false);

    };

    loadConnections();

  }, [username, type, navigate]);

  const toggleFollow = async (uid) => {

    if (!auth.currentUser) return;

    const myRef = doc(db, "users", auth.currentUser.uid);
    const theirRef = doc(db, "users", uid);

    if (myFollowing.includes(uid)) {

      await updateDoc(myRef, {
        followingList: arrayRemove(uid)
      });

      await updateDoc(theirRef, {
        followersList: arrayRemove(auth.currentUser.uid)
      });

      setMyFollowing((prev) => prev.filter((x) => x !== uid));

    } else {

      await updateDoc(myRef, {
        followingList: arrayUnion(uid)
      });

      await updateDoc(theirRef, {
        followersList: arrayUnion(auth.currentUser.uid)
      });

      setMyFollowing((prev) => [...prev, uid]);

    }

  };

  const removeFollower = async (uid) => {

    if (!auth.currentUser) return;

    const myRef = doc(db, "users", auth.currentUser.uid);
    const followerRef = doc(db, "users", uid);

    await updateDoc(myRef, {
      followersList: arrayRemove(uid)
    });

    await updateDoc(followerRef, {
      followingList: arrayRemove(auth.currentUser.uid)
    });

    setUsers((prev) => prev.filter((u) => u.uid !== uid));

  };

  return (

    <div className="connections-page">

<div className="connections-header">

<button
          className="connections-back"
          onClick={() => navigate(-1)}>
          
<FaArrowLeft />
</button>

<div className="connections-title">

<h2>{type === "followers" ? "Followers" : "Following"}</h2>
<p>{users.length} {type}</p>

</div>

</div>

{loading ?

      <div className="connections-skeleton">

{[1, 2, 3, 4, 5].map((i) =>

        <div key={i} className="connection-item skeleton">

<div className="skeleton-avatar"></div>

<div className="skeleton-lines">
<div></div>
<div></div>
</div>

</div>

        )}

</div> :



      <div className="connections-list">

{users.map((user) => {

          const following = myFollowing.includes(user.uid);
          const isMe = user.uid === currentUid;
          const isMyProfile = profileUid === currentUid;

          return (

            <div key={user.uid} className="connection-item">

<div
                className="connection-left"
                onClick={() => navigate("/u/" + user.username)}>
                

<img
                  src={user.photo}
                  alt=""
                  className="connection-avatar" />
                

<div className="connection-info">

<span className="connection-name">
{user.name}

{(user.role === "owner" || user.role === "friend" || user.role === "pookie" || user.role === "verified") &&

                    <MdVerified
                      className="connection-tick"
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

</span>

<span className="connection-username">
@{user.username}
</span>

</div>

</div>

{!isMe && type === "following" &&

              <button
                className={`connection-follow ${following ? "following" : ""}`}
                onClick={() => toggleFollow(user.uid)}>
                

{following ? "Following" : "Follow"}

</button>

              }

{!isMe && type === "followers" && isMyProfile &&

              <button
                className="connection-remove"
                onClick={() => removeFollower(user.uid)}>
                

Remove

</button>

              }

{!isMe && type === "followers" && !isMyProfile &&

              <button
                className={`connection-follow ${following ? "following" : ""}`}
                onClick={() => toggleFollow(user.uid)}>
                

{following ? "Following" : "Follow"}

</button>

              }

{isMe &&

              <div className="connection-you">
You
</div>

              }

</div>);



        })}

{users.length === 0 &&
        <p className="no-connections">No {type} yet.</p>
        }

</div>

      }

</div>);



}

export default Connections;