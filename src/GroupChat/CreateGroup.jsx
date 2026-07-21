import { useState, useRef, useEffect } from "react";
import "./CreateGroup.css";

import { supabaseGroup } from "../supabaseGroup";
import { supabase } from "../supabase";
import { auth, storage, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import DashboardNav from "../components/DashboardNavbar";
import BottomNav from "../components/BottomNav";

import { FaArrowLeft, FaUsers, FaHashtag, FaCamera, FaCheck } from "react-icons/fa";

function CreateGroup() {
  const suggestionLimit = 5;

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [openMembers, setOpenMembers] = useState(false);

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const fileRef = useRef();

  const navigate = useNavigate();

  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const isValidName = (text) => {
    const clean = text.trim();
    return clean.length >= 3 && clean.length <= 25;
  };

  const isValidUsername = (text) => {
    return /^[a-z0-9._]{6,12}$/.test(text);
  };

  const isValidDescription = (text) => {
    const words = countWords(text);
    return words >= 5 && words <= 30;
  };

  const handleImagePick = () => {
    fileRef.current.click();
  };

  const handleImageChange = (e) => {

    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      window.showAlert("Image must be less than 5 MB", "error");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));

  };

  const searchUsers = async (value) => {
    setSearch(value);

    const isEmptySearch = !value.trim();

    const user = auth.currentUser;
    if (!user) return;

    setSearching(true);

    try {
      const mySnap = await getDoc(doc(db, "users", user.uid));

      if (!mySnap.exists()) {
        setResults([]);
        return;
      }

      const myData = mySnap.data();
      const following = Array.isArray(myData.followingList) ? myData.followingList : [];
      const followers = Array.isArray(myData.followersList) ? myData.followersList : [];

      const mutuals = following.filter((id) => followers.includes(id));

      if (mutuals.length === 0) {
        setResults([]);
        return;
      }

      const limit = isEmptySearch ? suggestionLimit : mutuals.length;

      const shuffled = shuffleArray(mutuals);

      const selected = shuffled.slice(0, limit);

      const userRefs = selected.map((uid) => doc(db, "users", uid));

      const snaps = await Promise.all(userRefs.map((r) => getDoc(r)));

      const users = snaps.
      filter((s) => s.exists()).
      map((s) => {
        const u = s.data();
        return {
          id: s.id,
          name: u.name,
          username: u.username,
          photo: u.profilePhoto
        };
      });

      let filtered = users;

      if (!isEmptySearch) {
        const term = value.toLowerCase();
        filtered = users.filter((u) =>
        u.username?.toLowerCase().includes(term) ||
        u.name?.toLowerCase().includes(term)
        );
      } else {
        filtered = users.slice(0, suggestionLimit);
      }

      filtered = filtered.filter((person) =>
      person.id !== user.uid
      );

      setResults(filtered);
    } catch (err) {
      console.log(err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (openMembers && search === "") {
      searchUsers("");
    }
  }, [openMembers]);

  const uploadGroupPhoto = async (groupId) => {

    if (!image) return "";

    const storageRef = ref(storage, `room_profile/${groupId}`);

    await uploadBytes(storageRef, image);

    const url = await getDownloadURL(storageRef);

    return url;

  };

  const handleCreate = async () => {

    if (!image) {
      window.showAlert("Group photo is required", "error");
      return;
    }

    if (!isValidName(name)) {
      window.showAlert("Name must be 3–25 characters", "error");
      return;
    }

    if (!isValidUsername(username)) {
      window.showAlert("Username must be 6–12 chars (a-z, 0-9, . _)", "error");
      return;
    }

    if (!isValidDescription(description)) {
      window.showAlert("Description must be 5 to 30 words", "error");
      return;
    }

    setLoading(true);

    try {

      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");

      const uid = user.uid;

      const { data: existing } = await supabaseGroup.
      from("groups").
      select("id").
      eq("username", username).
      maybeSingle();

      if (existing) {
        window.showAlert("Username already taken", "error");
        setLoading(false);
        return;
      }

      const { data: group, error } = await supabaseGroup.
      from("groups").
      insert({
        name: name.trim(),
        username: username,
        description: description.trim(),
        owner_uid: uid,
        member_count: 1 + members.length
      }).
      select().
      single();

      if (error) throw error;

      if (!group?.id) {
        throw new Error("Group creation failed");
      }

      if (image) {
        uploadGroupPhoto(group.id).then(async (url) => {
          await supabaseGroup.
          from("groups").
          update({ profile_photo: url }).
          eq("id", group.id);
        });
      }

      const memberRows = [
      { group_id: group.id, uid: uid, role: "owner" },
      ...members.map((m) => ({
        group_id: group.id,
        uid: m.id,
        role: "member"
      }))];


      await supabaseGroup.
      from("group_members").
      insert(memberRows);

      window.showAlert("Group created", "success");

      navigate(`/group/${group.username}`);

    } catch (err) {
      console.log(err);

      const msg = err?.message || "";

      if (msg.includes("unique_username")) {
        window.showAlert("Username already taken", "error");
      } else
      if (msg.includes("username_format_check")) {
        window.showAlert("Username must be 6–12 chars (a-z, 0-9, . _)", "error");
      } else
      if (msg.includes("name_length_check")) {
        window.showAlert("Name must be 3–25 characters", "error");
      } else
      if (msg.includes("description_word_check")) {
        window.showAlert("Description must be 5 to 30 words", "error");
      } else
      if (msg.includes("username_lowercase_check")) {
        window.showAlert("Username must be lowercase", "error");
      } else
      {
        window.showAlert("Failed to create group", "error");
      }
    }

    setLoading(false);

  };

  return (

    <>

<DashboardNav />

<div className="create-group-page">

<div className="create-group-shell">

<div className="create-group-card">

<button
              type="button"
              className="cg-card-back-button"
              onClick={() => navigate(-1)}>
              
<FaArrowLeft />
</button>

<div className="cg-header">
<span className="cg-kicker">Community</span>
<h1 className="cg-title">Create Group</h1>
<p className="cg-subtitle">
Set up a clean group profile so people can recognize it instantly.
</p>
</div>

<div className="cg-photo-section" onClick={handleImagePick}>

<div className="cg-photo-preview">
{preview ?
                <img src={preview} alt="group" /> :

                <FaUsers />
                }
</div>

<div className="cg-photo-overlay">
<FaCamera />
</div>

<input
                type="file"
                accept="image/*"
                ref={fileRef}
                onChange={handleImageChange}
                style={{ display: "none" }} />
              

</div>

<p className="cg-photo-hint">Add a group photo to make your space look complete.</p>

<div className="cg-input-box">

<div className="cg-input-wrapper">
<FaUsers className="cg-icon" />
<input
                  type="text"
                  placeholder="Group Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={25} />
                
</div>

<div className="cg-input-wrapper">
<FaHashtag className="cg-icon" />
<input
                  type="text"
                  placeholder="Group Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                  maxLength={12} />
                
</div>

<div className="cg-input-wrapper">
<textarea
                  className="cg-textarea"
                  placeholder="Group Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={200}
                  rows={3} />
                
</div>

<p className="cg-field-note">
{countWords(description)}/30 words (min 5)
</p>

</div>

<p className="cg-field-note">
Username must be unique and can use only lowercase letters, numbers, dot, and underscore.
</p>

<button
              type="button"
              className="cg-members-trigger"
              onClick={() => setOpenMembers(true)}>
              
<span>+ Add Members</span>
</button>

<div className="cg-selected-members">
{members.length === 0 ?
              <p className="cg-members-empty">No mutual members selected yet.</p> :

              members.map((user) =>
              <button
                type="button"
                key={user.id}
                className="cg-member-chip"
                onClick={() => setMembers((prev) => prev.filter((member) => member.id !== user.id))}>
                
<span>@{user.username}</span>
<strong>×</strong>
</button>
              )
              }
</div>

<p className="cg-field-note">
{members.length + 1} members will be added
</p>

<button
              className={`cg-create-btn ${loading ? "loading" : ""}`}
              onClick={handleCreate}
              disabled={loading}>
              

{loading ?
              <div className="cg-btn-loader"></div> :

              <span>Create Group</span>
              }

</button>

</div>

</div>

</div>

{openMembers &&
      <div className="cg-members-panel" onClick={() => setOpenMembers(false)}>

<div className="cg-members-card" onClick={(e) => e.stopPropagation()}>

<div className="cg-members-header">
<h3>Add Members</h3>
<button type="button" className="cg-members-close" onClick={() => setOpenMembers(false)}>✕</button>
</div>

<input
            className="cg-members-search"
            placeholder="Search mutuals..."
            value={search}
            onChange={(e) => searchUsers(e.target.value)} />
          

<div className="cg-members-list">

{searching &&
            <div className="cg-members-empty-state">Searching mutual followers...</div>
            }

{results.map((user) =>
            <div
              key={user.id}
              className={`cg-member-item ${members.some((m) => m.id === user.id) ? "selected" : ""}`}
              onClick={() => {
                const exists = members.some((m) => m.id === user.id);

                if (exists) {
                  setMembers((prev) => prev.filter((member) => member.id !== user.id));
                  return;
                }

                setMembers((prev) => [...prev, user]);

              }}>
              
<img src={user.photo || "/assets/profile.png"} alt="user" />
<div className="cg-member-copy">
<strong>{user.name || user.username}</strong>
<span>@{user.username}</span>
</div>
<div className={`cg-member-check ${members.some((m) => m.id === user.id) ? "visible" : ""}`}>
<FaCheck />
</div>
</div>
            )}

{!searching && results.length === 0 &&
            <div className="cg-members-empty-state">
{search.trim() === "" ? "No mutual followers available right now." : "No mutual followers found for that search."}
</div>
            }
</div>

{search.trim() === "" && !searching &&
          <div className="cg-members-hint">
Showing 5 mutuals.  
<br />
Search by username or name to find someone faster.
</div>
          }

</div>

</div>
      }

<BottomNav />

</>);



}

export default CreateGroup;