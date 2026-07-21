import "./GroupInfo.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { FaPlus, FaUsers } from "react-icons/fa";
import { auth, db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { supabaseGroup } from "../supabaseGroup";

export default function GroupInfo() {

  const navigate = useNavigate();
  const { username } = useParams();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [myRole, setMyRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [candidateUsers, setCandidateUsers] = useState([]);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [addingUid, setAddingUid] = useState("");

  const isAdmin = myRole === "owner" || myRole === "admin";

  const filteredCandidates = useMemo(() => {
    if (candidateSearch.trim() === "") return candidateUsers;

    return candidateUsers.filter((user) =>
    user.name?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
    user.username?.toLowerCase().includes(candidateSearch.toLowerCase())
    );
  }, [candidateUsers, candidateSearch]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
  }, []);

  useEffect(() => {
    const loadGroupInfo = async () => {

      setLoading(true);

      try {
        const { data: groupData, error: groupError } = await supabaseGroup.
        from("groups").
        select("id,name,username,profile_photo,member_count").
        eq("username", username).
        maybeSingle();

        if (groupError) throw groupError;
        if (!groupData) {
          window.showAlert?.("Group not found", "error");
          navigate(-1);
          return;
        }

        setGroup(groupData);

        const { data: memberRows, error: memberError } = await supabaseGroup.
        from("group_members").
        select("uid,role").
        eq("group_id", groupData.id);

        if (memberError) throw memberError;

        const memberList = await Promise.all(
          (memberRows || []).map(async (member) => {
            const snap = await getDoc(doc(db, "users", member.uid));
            const data = snap.exists() ? snap.data() : {};

            return {
              uid: member.uid,
              role: member.role || "member",
              name: data.name || data.username || "Unknown User",
              username: data.username || "unknown",
              photo: data.profilePhoto || "/assets/profile.png"
            };
          })
        );

        setMembers(memberList);

        const mine = memberRows?.find((member) => member.uid === auth.currentUser?.uid);
        setMyRole(mine?.role || "");
      } catch (err) {
        console.log(err);
        window.showAlert?.("Failed to load group info", "error");
      } finally {
        setLoading(false);
      }

    };

    loadGroupInfo();
  }, [username, navigate]);

  useEffect(() => {
    if (!showAddModal || !group?.id) return;

    const loadCandidates = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const existingIds = new Set(members.map((member) => member.uid));

        const users = snap.docs.
        map((item) => ({
          uid: item.id,
          name: item.data().name || item.data().username,
          username: item.data().username || "unknown",
          photo: item.data().profilePhoto || "/assets/profile.png"
        })).
        filter((user) => !existingIds.has(user.uid));

        setCandidateUsers(users);
      } catch (err) {
        console.log(err);
        window.showAlert?.("Failed to load users", "error");
      }
    };

    loadCandidates();
  }, [showAddModal, group?.id, members]);

  async function addUserToGroup(user) {
    if (!group?.id || addingUid) return;

    setAddingUid(user.uid);

    try {
      const { error: memberError } = await supabaseGroup.
      from("group_members").
      insert({
        group_id: group.id,
        uid: user.uid,
        role: "member"
      });

      if (memberError) throw memberError;

      const nextCount = (group.member_count || members.length || 0) + 1;

      const { error: updateError } = await supabaseGroup.
      from("groups").
      update({ member_count: nextCount }).
      eq("id", group.id);

      if (updateError) throw updateError;

      setMembers((prev) => [
      ...prev,
      {
        uid: user.uid,
        role: "member",
        name: user.name,
        username: user.username,
        photo: user.photo
      }]
      );

      setGroup((prev) => prev ? { ...prev, member_count: nextCount } : prev);
      setCandidateUsers((prev) => prev.filter((item) => item.uid !== user.uid));
      window.showAlert?.("User added to group", "success");
    } catch (err) {
      console.log(err);
      window.showAlert?.("Failed to add user", "error");
    } finally {
      setAddingUid("");
    }
  }

  return (
    <section className="groupinfo-page">

<div className="groupinfo-topbar">
<button
          type="button"
          className="groupinfo-back-btn"
          onClick={() => navigate(-1)}>
          
<FiArrowLeft />
</button>

<h2>Group Info</h2>
</div>

<div className="groupinfo-body">

{loading &&
        <div className="groupinfo-loading-card">
<div className="groupinfo-loading-avatar"></div>
<div className="groupinfo-loading-line short"></div>
<div className="groupinfo-loading-line"></div>
</div>
        }

{!loading && group &&
        <>
<div className="groupinfo-hero-card">
{group.profile_photo ?
            <img src={group.profile_photo} alt="group" className="groupinfo-photo" /> :

            <div className="groupinfo-photo groupinfo-photo-fallback">
<FaUsers />
</div>
            }

<h1>{group.name}</h1>
<p>@{group.username}</p>
<span>{group.member_count || members.length || 0} members</span>
{isAdmin &&
            <button
              type="button"
              className="groupinfo-add-btn"
              onClick={() => setShowAddModal(true)}>
              
<FaPlus />
<span>Add User</span>
</button>
            }
</div>

<div className="groupinfo-members-card">
<div className="groupinfo-section-head">
<h3>Participants</h3>
<span>{members.length}</span>
</div>

<div className="groupinfo-member-list">
{members.map((member) =>
              <div key={member.uid} className="groupinfo-member-row">
<img src={member.photo} alt="member" className="groupinfo-member-photo" />

<div className="groupinfo-member-copy">
<strong>{member.name}</strong>
<span>@{member.username}</span>
</div>

<div className="groupinfo-member-role">
{member.role}
</div>
</div>
              )}
</div>
</div>
</>
        }

</div>

{showAddModal && isAdmin &&
      <div className="groupinfo-modal-overlay" onClick={() => setShowAddModal(false)}>
<div className="groupinfo-modal" onClick={(e) => e.stopPropagation()}>
<div className="groupinfo-modal-head">
<h3>Add Users</h3>
<button type="button" onClick={() => setShowAddModal(false)}>Close</button>
</div>

<input
            type="text"
            className="groupinfo-search"
            placeholder="Search users"
            value={candidateSearch}
            onChange={(e) => setCandidateSearch(e.target.value)} />
          

<div className="groupinfo-candidate-list">
{filteredCandidates.map((user) =>
            <div key={user.uid} className="groupinfo-candidate-row">
<img src={user.photo} alt="user" className="groupinfo-member-photo" />

<div className="groupinfo-member-copy">
<strong>{user.name}</strong>
<span>@{user.username}</span>
</div>

<button
                type="button"
                className="groupinfo-add-user-btn"
                onClick={() => addUserToGroup(user)}
                disabled={addingUid === user.uid}>
                
{addingUid === user.uid ? "Adding..." : "Add"}
</button>
</div>
            )}

{filteredCandidates.length === 0 &&
            <div className="groupinfo-empty-candidates">
No users available to add
</div>
            }
</div>
 </div>
</div>
      }

</section>);


}