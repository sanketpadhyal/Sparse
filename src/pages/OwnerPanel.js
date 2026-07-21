import DashboardNavbar from "../components/DashboardNavbar";
import BottomNav from "../components/BottomNav";
import "../settings/Settings.css";
import "./OwnerPanel.css";

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc, query, collection, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { FaArrowLeft, FaSearch, FaTimes, FaCrown, FaGem } from "react-icons/fa";
import { MdVerified } from "react-icons/md";

function OwnerPanel() {

  const getBadge = (role) => {

    if (role === "owner") return <FaCrown className="owner-crown" />;

    if (role === "friend") return <FaGem style={{ color: "#e10e0eff" }} />;

    if (role === "pookie") return <span className="pookie-badge">🎀</span>;

    if (role === "verified") return <MdVerified className="owner-tick" />;

    return null;

  };

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [userResult, setUserResult] = useState(null);
  const [role, setRole] = useState("");
  const [roleUsers, setRoleUsers] = useState({});

  const roles = ["owner", "friend", "pookie", "verified"];

  useEffect(() => {

    const unsub = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        navigate("/developers");
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists() || snap.data().role !== "owner") {
        navigate("/developers");
        return;
      }

      await fetchRoleUsers();
      setLoading(false);

    });

    return () => unsub();

  }, []);


  const fetchRoleUsers = async () => {

    let data = {};

    for (let r of roles) {

      const q = query(
        collection(db, "users"),
        where("role", "==", r)
      );

      const snap = await getDocs(q);

      let arr = [];

      snap.forEach((doc) => {
        arr.push({
          id: doc.id,
          ...doc.data()
        });
      });

      data[r] = arr;

    }

    setRoleUsers(data);

  };


  const handleSearch = async () => {

    if (!username.trim()) return;

    const q = query(
      collection(db, "users"),
      where("username", "==", username)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      window.showAlert?.("User not found", "error");
      setUserResult(null);
      return;
    }

    let userData = null;

    snap.forEach((doc) => {
      userData = {
        id: doc.id,
        ...doc.data()
      };
    });

    setUserResult(userData);
    setRole(userData.role || "");

  };


  const clearSearch = () => {
    setUsername("");
    setUserResult(null);
    setRole("");
  };


  const updateRole = async (targetUser, newRole) => {

    if (targetUser.role === "owner") {
      window.showAlert?.("Owner is protected by Sanket", "error");
      return;
    }


    if (newRole === "owner") {
      window.showAlert?.("This is protected by Sanket", "error");
      return;
    }

    await updateDoc(doc(db, "users", targetUser.id), {
      role: newRole || null
    });

    window.showAlert?.("Role updated", "success");

    fetchRoleUsers();

    if (userResult && userResult.id === targetUser.id) {
      setUserResult((prev) => ({ ...prev, role: newRole }));
      setRole(newRole);
    }

  };


  if (loading) {
    return <div className="settings-page fade-in">Loading...</div>;
  }

  return (

    <>

<DashboardNavbar />

<div className="settings-page fade-in">

<div className="edit-navbar">

<button className="back-btn" onClick={() => navigate(-1)}>
<FaArrowLeft />
</button>

<h2>Owner Panel</h2>

<div style={{ width: "32px" }}></div>

</div>

<div className="settings-card">

<div className="settings-section fade-in">

<p className="settings-heading">Role Badges</p>

<div className="badge-grid">

<div className="badge-item">
<FaCrown className="owner-crown" />
<div>
<p>owner</p>
<span className="muted">Founder access</span>
</div>
</div>

<div className="badge-item">
<FaGem style={{ color: "#e10e0eff" }} />
<div>
<p>friend</p>
<span className="muted">Team member</span>
</div>
</div>

<div className="badge-item">
<span className="pookie-badge">🎀</span>
<div>
<p>pookie</p>
<span className="muted">Loyal user</span>
</div>
</div>

<div className="badge-item">
<MdVerified className="owner-tick" />
<div>
<p>verified</p>
<span className="muted">Verified badge</span>
</div>
</div>

</div>

</div>

<div className="settings-section">

<p className="settings-heading">Search User</p>

<div className="settings-item">

<div className="settings-icon purple">
<FaSearch />
</div>

<input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="settings-input" />
              

{userResult &&
              <button className="clear-btn" onClick={clearSearch}>
<FaTimes />
</button>
              }

</div>

<button className="logout-btn" onClick={handleSearch}>
Search
</button>

</div>


{userResult &&

          <div className="settings-section fade-in">

<p className="settings-heading">User Details</p>

<div className="settings-item">

<img
                src={userResult.profilePhoto || "/assets/profile.png"}
                className="avatar" />
              

<div className="settings-text">
<h4>
{userResult.name}
</h4>
<p>@{userResult.username}</p>
<p>Role: {userResult.role || "No role"}</p>
</div>

</div>

<div className="settings-item">

<select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="settings-input">
                

<option value="">Remove Role</option>

{roles.map((r) =>
                <option key={r} value={r}>{r}</option>
                )}

</select>

</div>

<button
              className="logout-btn"
              onClick={() => updateRole(userResult, role)}>
              
Update Role
</button>

</div>

          }


{roles.map((r) =>

          <div key={r} className="settings-section fade-in">

<p className="settings-heading">
{r.toUpperCase()} USERS ({roleUsers[r]?.length || 0})
</p>

{roleUsers[r]?.length === 0 ?

            <div className="settings-item">
<p className="muted">No users</p>
</div> :



            roleUsers[r].map((user) =>

            <div key={user.id} className="settings-item smooth">

<img
                src={user.profilePhoto || "/assets/profile.png"}
                className="avatar" />
              

<div className="settings-text">
<h4>{user.name}</h4>
<p>@{user.username}</p>
</div>

<select
                value={user.role || ""}
                onChange={(e) => updateRole(user, e.target.value)}
                className="settings-input small">
                

<option value="">Remove</option>

{roles.map((roleOpt) =>
                <option key={roleOpt} value={roleOpt}>
{roleOpt}
</option>
                )}

</select>

</div>

            )

            }

</div>

          )}

</div>

</div>

<BottomNav />

</>);



}

export default OwnerPanel;