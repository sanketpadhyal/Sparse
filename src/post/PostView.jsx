import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { auth, db } from "../firebase";
import { sendPushNotification } from "../supabase";
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, deleteDoc } from "firebase/firestore";

import BottomNav from "../components/BottomNav";
import DashboardNavbar from "../components/DashboardNavbar";

import { FaHeart, FaRegHeart, FaComment, FaArrowLeft, FaReply, FaThumbtack } from "react-icons/fa";
import { MdVerified } from "react-icons/md";

import "./PostView.css";

function PostView() {

  const navigate = useNavigate();
  const location = useLocation();

  const postFromState = location.state?.post;
  const { id } = useParams();
  const [post, setPost] = useState(postFromState || null);

  const [loading, setLoading] = useState(true);

  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  const [comments, setComments] = useState([]);

  const [commentUsers, setCommentUsers] = useState({});

  const [visibleComments, setVisibleComments] = useState(5);

  const [commentInput, setCommentInput] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);

  const [userData, setUserData] = useState(null);
  const [postUser, setPostUser] = useState(null);

  const [showHeart, setShowHeart] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const lastTap = useRef(0);

  const [likeLoading, setLikeLoading] = useState(false);

  const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ?
  crypto.randomUUID() :
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;


  const normalizeReply = (reply, parentComment) => {
    if (!reply) return null;

    return {
      id: reply.id || createId(),
      uid: reply.uid || "",
      name: reply.name || "",
      username: reply.username || "",
      photo: reply.photo || "",
      text: reply.text || "",
      createdAt: reply.createdAt || parentComment?.createdAt || Date.now(),
      replyToCommentId: reply.replyToCommentId || parentComment?.id || null
    };
  };

  const normalizeComment = (comment, index = 0) => {
    if (!comment) return null;

    const normalized = {
      ...comment,
      id: comment.id || `${comment.uid || "comment"}-${comment.createdAt || Date.now()}-${index}`,
      likes: Array.isArray(comment.likes) ? comment.likes : [],
      pinned: Boolean(comment.pinned),
      replies: Array.isArray(comment.replies) ?
      comment.replies.map((reply) => normalizeReply(reply, comment)).filter(Boolean) :
      []
    };

    normalized.replies.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    return normalized;
  };

  const sortComments = (list = []) => {
    return [...list].sort((a, b) => {
      if (Boolean(a?.pinned) !== Boolean(b?.pinned)) {
        return a?.pinned ? -1 : 1;
      }

      return (b?.createdAt || 0) - (a?.createdAt || 0);
    });
  };

  const prepareComments = (list = []) => sortComments(
    list.
    map((comment, index) => normalizeComment(comment, index)).
    filter(Boolean)
  );



  const addUserActivity = async (receiverUid, activity) => {
    try {
      await updateDoc(doc(db, "users", receiverUid), {
        activity: arrayUnion(activity)
      });
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    if (postFromState) {
      setPost(postFromState);
      init(postFromState);
    } else if (id) {
      loadPostFromDB();
    }

  }, [id]);

  const init = async (currentPost) => {

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const postSnap = await getDoc(doc(db, "posts", currentPost.id));

    if (postSnap.exists()) {
      const data = postSnap.data();

      setLikes(data.likes?.length || 0);

      setComments(prepareComments(data.comments || []));

      if (data.likes?.includes(uid)) {
        setLiked(true);
      }
    }

    const me = await getDoc(doc(db, "users", uid));
    if (me.exists()) setUserData(me.data());

    const owner = await getDoc(doc(db, "users", currentPost.uid));
    if (owner.exists()) setPostUser(owner.data());

    setLoading(false);

  };

  const loadPostFromDB = async () => {

    const snap = await getDoc(doc(db, "posts", id));

    if (snap.exists()) {
      const data = snap.data();
      setPost({ id, ...data });
      init({ id, ...data });
    } else {
      navigate("/dashboard");
    }

  };

  useEffect(() => {

    const loadUsers = async () => {

      let map = {};

      for (const c of comments) {

        if (c.uid && !map[c.uid]) {

          const snap = await getDoc(doc(db, "users", c.uid));

          if (snap.exists()) {
            map[c.uid] = snap.data();
          }

        }

        for (const reply of c.replies || []) {

          if (reply.uid && !map[reply.uid]) {

            const snap = await getDoc(doc(db, "users", reply.uid));

            if (snap.exists()) {
              map[reply.uid] = snap.data();
            }

          }

        }

      }

      setCommentUsers(map);

    };

    if (comments.length) loadUsers();else
    setCommentUsers({});

  }, [comments]);

  const syncComments = async (nextComments) => {

    const preparedComments = prepareComments(nextComments);

    try {
      await updateDoc(doc(db, "posts", post.id), {
        comments: preparedComments
      });
    } catch (e) {
      console.log(e);
      throw e;
    }

    setComments(preparedComments);

    return preparedComments;

  };

  const toggleLike = async () => {

    if (likeLoading) return;
    setLikeLoading(true);

    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLikeLoading(false);
      return;
    }

    const ref = doc(db, "posts", post.id);

    if (liked) {

      try {
        await updateDoc(ref, { likes: arrayRemove(uid) });
      } catch (e) {
        console.log(e);
        setLikeLoading(false);
        return;
      }

      setLiked(false);
      setLikes((prev) => prev - 1);
      setLikeLoading(false);

    } else {

      try {
        await updateDoc(ref, { likes: arrayUnion(uid) });
      } catch (e) {
        console.log(e);
        setLikeLoading(false);
        return;
      }

      setLiked(true);
      setLikes((prev) => prev + 1);

      if (post.uid !== uid) {
        await sendPushNotification({
          receiver_uid: post.uid,
          sender_name: userData.name,
          message: "liked your post",
          post_caption: post.caption || ""
        });

        await addUserActivity(post.uid, {
          type: "like",
          uid: uid,
          name: userData.name,
          username: userData.username,
          photo: userData.profilePhoto || "",
          text: `${userData.name} liked your post`,
          caption: post.caption || "",
          time: new Date().toISOString()
        });
      }

      setLikeLoading(false);

    }

  };

  const handleDoubleTap = () => {

    const now = Date.now();

    if (now - lastTap.current < 300) {

      toggleLike();

      setShowHeart(true);

      setTimeout(() => {
        setShowHeart(false);
      }, 800);

    }

    lastTap.current = now;

  };

  const submitComment = async () => {

    if (commentLoading) return;

    if (!commentInput.trim()) {
      window.showAlert?.("Write something first", "warning");
      return;
    }

    if (!userData) return;

    const uid = auth.currentUser.uid;

    const isReply = Boolean(replyTarget);
    const myComments = comments.filter((c) => c.uid === uid);
    const inputText = commentInput.trim();

    if (!isReply && myComments.length >= 2) {
      window.showAlert?.("Only 2 comments allowed", "warning");
      return;
    }

    setCommentLoading(true);

    const newComment = {
      id: createId(),
      uid: uid,
      name: userData.name,
      username: userData.username,
      photo: userData.profilePhoto || "",
      text: inputText,
      createdAt: Date.now(),
      likes: [],
      pinned: false,
      replies: []
    };

    try {
      if (isReply) {

        const reply = {
          id: createId(),
          uid: uid,
          name: userData.name,
          username: userData.username,
          photo: userData.profilePhoto || "",
          text: inputText,
          createdAt: Date.now(),
          replyToCommentId: replyTarget.id
        };

        const nextComments = comments.map((comment) =>
        comment.id === replyTarget.id ?
        {
          ...comment,
          replies: [...(comment.replies || []), reply]
        } :
        comment
        );

        await syncComments(nextComments);

        if (replyTarget.uid && replyTarget.uid !== uid) {
          await sendPushNotification({
            receiver_uid: replyTarget.uid,
            sender_name: userData.name,
            message: "replied to your comment",
            post_caption: post.caption || ""
          });

          await addUserActivity(replyTarget.uid, {
            type: "comment_reply",
            uid: uid,
            name: userData.name,
            username: userData.username,
            photo: userData.profilePhoto || "",
            text: `${userData.name} replied to your comment`,
            caption: post.caption || "",
            comment: reply.text,
            time: new Date().toISOString()
          });
        }

        window.showAlert?.("Reply added", "success");

      } else {
        await updateDoc(doc(db, "posts", post.id), {
          comments: arrayUnion(newComment)
        });

        setComments((prev) => prepareComments([newComment, ...prev]));
        window.showAlert?.("Comment added", "success");
      }
    } catch (e) {
      setCommentLoading(false);
      return;
    }

    if (post.uid !== uid) {
      await sendPushNotification({
        receiver_uid: post.uid,
        sender_name: userData.name,
        message: "commented on your post",
        post_caption: post.caption || ""
      });

      await addUserActivity(post.uid, {
        type: "comment",
        uid: uid,
        name: userData.name,
        username: userData.username,
        photo: userData.profilePhoto || "",
        text: `${userData.name} commented on your post`,
        caption: post.caption || "",
        comment: inputText,
        time: new Date().toISOString()
      });
    }

    setCommentInput("");
    setReplyTarget(null);

    setCommentLoading(false);

  };

  const deleteComment = async (comment) => {

    try {
      await syncComments(comments.filter((c) => c.id !== comment.id));
    } catch (e) {
      return;
    }

    if (replyTarget?.id === comment.id) {
      setReplyTarget(null);
    }

  };

  const deleteReply = async (comment, reply) => {

    try {
      await syncComments(
        comments.map((item) =>
        item.id === comment.id ?
        {
          ...item,
          replies: (item.replies || []).filter((entry) => entry.id !== reply.id)
        } :
        item
        )
      );
    } catch (e) {
      return;
    }

  };

  const toggleCommentLike = async (comment) => {

    if (!isOwner || auth.currentUser?.uid === comment.uid) return;

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const isLiked = (comment.likes || []).includes(uid);

    try {
      await syncComments(
        comments.map((item) =>
        item.id === comment.id ?
        {
          ...item,
          likes: isLiked ?
          (item.likes || []).filter((id) => id !== uid) :
          [...(item.likes || []), uid]
        } :
        item
        )
      );
    } catch (e) {
      return;
    }

    if (!isLiked && comment.uid) {
      await sendPushNotification({
        receiver_uid: comment.uid,
        sender_name: userData?.name || "Someone",
        message: "liked your comment",
        post_caption: post.caption || ""
      });

      await addUserActivity(comment.uid, {
        type: "comment_like",
        uid: uid,
        name: userData?.name || "",
        username: userData?.username || "",
        photo: userData?.profilePhoto || "",
        text: `${userData?.name || "Someone"} liked your comment`,
        caption: post.caption || "",
        comment: comment.text || "",
        time: new Date().toISOString()
      });
    }

  };

  const togglePinComment = async (comment) => {

    if (!isOwner || auth.currentUser?.uid === comment.uid) return;

    try {
      await syncComments(
        comments.map((item) => {
          if (item.id === comment.id) {
            return {
              ...item,
              pinned: !item.pinned
            };
          }

          return {
            ...item,
            pinned: false
          };
        })
      );
    } catch (e) {
      return;
    }

  };

  const deletePost = async () => {

    await deleteDoc(doc(db, "posts", post.id));
    navigate("/dashboard/profile");

  };

  function formatPostDate(timestamp) {

    if (!timestamp) return "";

    const date = timestamp.seconds ?
    new Date(timestamp.seconds * 1000) :
    new Date(timestamp);

    const now = new Date();

    const today =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

    const time = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });

    if (today) {
      return `Today • ${time}`;
    }

    if (isYesterday) {
      return `Yesterday • ${time}`;
    }

    return `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • ${time}`;

  }

  if (!post) return <div>Loading...</div>;

  const isOwner = auth.currentUser?.uid === post.uid;

  return (

    <>

<DashboardNavbar />

<div className="postview-page">

<div className="postview-card">

<div className="postview-topbar">

<button className="post-back" onClick={() => navigate(-1)}>
<FaArrowLeft />
</button>

<span className="post-title">Post</span>

{isOwner && !confirmDelete &&
            <button className="delete-post-btn" onClick={() => setConfirmDelete(true)}>
Delete
</button>
            }

{isOwner && confirmDelete &&
            <div className="inline-delete-confirm">

<span>Delete post?</span>

<button className="inline-delete-no" onClick={() => setConfirmDelete(false)}>
No
</button>

<button className="inline-delete-yes" onClick={deletePost}>
Yes
</button>

</div>
            }

</div>

<div className="postview-user">

{loading ?

            <>
<div className="postview-avatar skeleton-circle"></div>
<div className="postview-userinfo">
<div className="skeleton-line skeleton-line-name"></div>
<div className="skeleton-line skeleton-line-username"></div>
</div>
</> :



            <>

<img
                src={postUser?.profilePhoto || "/assets/profile.png"}
                className="postview-avatar"
                alt={postUser?.name ? `${postUser.name} profile` : "Profile"}
                onClick={() => navigate("/u/" + postUser?.username)} />
              

<div
                className="postview-userinfo"
                onClick={() => navigate("/u/" + postUser?.username)}>
                

<h4>
{postUser?.name}
{(postUser?.role === "owner" || postUser?.role === "friend" || postUser?.role === "pookie" || postUser?.role === "verified") &&
                  <MdVerified className="postview-tick" />
                  }
</h4>

<p>@{postUser?.username}</p>

<div className="post-date">
{formatPostDate(post.createdAt)}
</div>

</div>

</>

            }

</div>

<div className="postview-image-wrapper" onClick={handleDoubleTap}>

{!imageLoaded && <div className="skeleton-image"></div>}

<img
              src={post.photo}
              className="postview-image-backdrop"
              alt=""
              aria-hidden="true" />
            

<img
              src={post.photo}
              className={`postview-image ${imageLoaded ? "img-loaded" : "img-hidden"}`}
              alt={post.caption ? post.caption : "Post"}
              onLoad={() => setImageLoaded(true)} />
            

{showHeart &&
            <div className="big-heart">
<FaHeart />
</div>
            }

</div>

{post.caption &&

          <div className="post-caption">

<div className="caption-title">Caption :</div>

<div className="caption-text">{post.caption}</div>

</div>

          }

<div className="postview-actions">

<button className={`postview-like ${liked ? "liked" : ""}`} onClick={toggleLike}>
{liked ? <FaHeart /> : <FaRegHeart />}
<span>{likes}</span>
</button>

<div className="postview-stat">
<FaComment />
<span>{comments.length}</span>
</div>

</div>

<div className="postview-comments">

{comments.slice(0, visibleComments).map((c, i) => {

              const canDelete =
              auth.currentUser?.uid === c.uid ||
              auth.currentUser?.uid === post.uid;

              const user = commentUsers[c.uid];
              const isCommentLiked = (c.likes || []).includes(auth.currentUser?.uid);
              const isOtherUserComment = c.uid && auth.currentUser?.uid !== c.uid;
              const canReplyToComment = Boolean(auth.currentUser?.uid);
              const canModerateComment = isOwner && isOtherUserComment;
              const showCommentLikeStatus = canModerateComment || (c.likes?.length || 0) > 0;

              return (

                <div key={c.id || i} className={`comment-row ${c.pinned ? "comment-row-pinned" : ""}`}>

<img
                    src={user?.profilePhoto || "/assets/profile.png"}
                    className="comment-avatar"
                    alt={user?.name ? `${user.name} profile` : "Profile"}
                    onClick={() => navigate("/u/" + user?.username)} />

                  

<div className="comment-body">

{c.pinned &&
                    <div className="comment-pin-badge">
<FaThumbtack />
<span>Pinned by post admin</span>
</div>
                    }

<div
                      className="comment-user"
                      onClick={() => navigate("/u/" + user?.username)}>
                      
{user?.name || "User"}
<span>@{user?.username || "..."}</span>
</div>

<p>{c.text}</p>

<div className="comment-actions">

{showCommentLikeStatus && (
                      canModerateComment ?
                      <button
                        className={`comment-action like-action ${isCommentLiked ? "active" : ""}`}
                        onClick={() => toggleCommentLike(c)}>
                        
{isCommentLiked ? <FaHeart /> : <FaRegHeart />}
<span>{c.likes?.length || 0}</span>
</button> :

                      <div className="comment-action comment-action-static like-action active">
<FaHeart />
<span>{c.likes?.length || 0}</span>
</div>)

                      }

{canReplyToComment &&
                      <button
                        className="comment-action"
                        onClick={() => setReplyTarget(c)}>
                        
<FaReply />
<span>Reply</span>
</button>
                      }

{canModerateComment &&
                      <button
                        className={`comment-action ${c.pinned ? "active" : ""}`}
                        onClick={() => togglePinComment(c)}>
                        
<FaThumbtack />
<span>{c.pinned ? "Pinned" : "Pin"}</span>
</button>
                      }

</div>

{Array.isArray(c.replies) && c.replies.length > 0 &&
                    <div className="comment-replies">
{c.replies.map((reply) => {
                        const replyUser = commentUsers[reply.uid];
                        const canDeleteReply =
                        auth.currentUser?.uid === reply.uid ||
                        auth.currentUser?.uid === post.uid;

                        return (
                          <div key={reply.id} className="comment-reply-row">
<img
                              src={replyUser?.profilePhoto || reply.photo || "/assets/profile.png"}
                              className="comment-avatar comment-reply-avatar"
                              alt={replyUser?.name || reply.name ? `${replyUser?.name || reply.name} profile` : "Profile"}
                              onClick={() => navigate("/u/" + (replyUser?.username || reply.username))} />
                            

<div className="comment-reply-body">
<div
                                className="comment-user"
                                onClick={() => navigate("/u/" + (replyUser?.username || reply.username))}>
                                
{replyUser?.name || reply.name || "User"}
<span>@{replyUser?.username || reply.username || "..."}</span>
</div>

<p>{reply.text}</p>

{canDeleteReply &&
                              <button className="delete-comment-btn" onClick={() => deleteReply(c, reply)}>
Delete
</button>
                              }
</div>
</div>);

                      })}
</div>
                    }

{canDelete &&
                    <button className="delete-comment-btn" onClick={() => deleteComment(c)}>
Delete
</button>
                    }

</div>

</div>);



            })}

</div>

{comments.length > visibleComments &&
          <button
            className="load-more"
            onClick={() => setVisibleComments((prev) => prev + 5)}>
            
Load more comments
</button>
          }

<div className="comment-input">

{replyTarget &&
            <div className="comment-replying-to">
<span>Replying to @{replyTarget.username || commentUsers[replyTarget.uid]?.username || "user"}</span>
<button onClick={() => setReplyTarget(null)}>Cancel</button>
</div>
            }

<input
              placeholder={replyTarget ? "Write a reply..." : "Write a comment..."}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)} />
            

<button onClick={submitComment}>
{commentLoading ? <div className="comment-loader"></div> : "Post"}
</button>

</div>

</div>

</div>

<BottomNav />

</>);



}

export default PostView;