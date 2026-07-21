import './App.css';
import ActivityPage from './main/ActivityPage';

import LoadingScreen from "./loading-page/Loadingpage";

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Alert from './hook/Alert';
import BottomNav from './components/BottomNav';
import DashboardNavbar from './components/DashboardNavbar';

import Hero from './pages/Hero';
import WhoCanUse from './pages/WhoCanUse';
import ProfileQR from './pages/ProfileQR';
import Developers from "./pages/Developers";

import Login from './auth/Login';
import Signup from './auth/Signup';
import VerifyEmail from './auth/VerifyEmail';
import Devices from './auth/Devices';
import Recover from './auth/Recover';

import Dashboard from './main/Dashboard';
import Profile from './main/Profile';
import EditProfile from './main/EditProfile';
import AddStory from './main/story/AddStory';
import StoryEditor from './main/story/StoryEditor';
import StoryPreview from './main/preview-pages/StoryPreview';
import UserProfile from './main/preview-pages/UserProfile';
import Connections from './main/preview-pages/Connections';
import UserSearch from './main/UserSearch';

import SelectPost from './post/SelectPost';
import AddPost from "./post/AddPost";
import PostsFeed from "./post/PostsFeed";
import PostView from "./post/PostView";


import Chats from "./main/Chats";
import ChatRoom from "./main/ChatRoom";
import OdoyChat from "./main/OdoyChat";
import CreateGroup from "./GroupChat/CreateGroup";
import GroupChatRoom from "./GroupChat/GroupChatRoom";
import GroupInfo from "./GroupChat/GroupInfo";
import { db } from "./firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";

import Settings from './settings/Settings';
import AccountCenter from './settings/AccountCenter';
import PasswordSecurity from './settings/PasswordSecurity';
import ChangePassword from './settings/ChangePassword';
import YourData from './settings/DataPrivacy';
import YourDataa from './settings/YourData';
import PrivacyPage from './settings/PrivacyPage';
import DeleteAccount from './settings/DeleteAccount';
import LikedMemes from './settings/LikedMemes';
import Insights from './settings/Insights';
import Notifications from './settings/Notifications';
import Theme from './settings/Theme';
import OwnerPanel from './pages/OwnerPanel';
import StoryMemories from './settings/StoryMemories';
import Journey from './pages/Journey';

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Lenis from '@studio-freight/lenis';

import { auth } from "./firebase";
import { supabase } from "./supabase";
import { onAuthStateChanged } from "firebase/auth";

import useSessionGuard from "./hook/useSessionGuard";
import useMessageListener from "./hook/useMessageListener";
import MessageToast from "./components/MessageToast";

function StartupRoute() {

  const [status, setStatus] = useState("checking");

  useEffect(() => {

    let loaderTimer;

    const unsubscribe = onAuthStateChanged(auth, (user) => {

      if (!user) {
        setStatus("guest");
        return;
      }

      const authDeviceSync = sessionStorage.getItem("auth_device_sync");

      if (authDeviceSync === "pending") {
        setStatus("checking");
        return;
      }

      if (!user.emailVerified) {
        setStatus("verify");
        return;
      }

      setStatus("loading");

      loaderTimer = setTimeout(() => {
        setStatus("authenticated");
      }, 1200);

    });

    return () => {
      if (loaderTimer) clearTimeout(loaderTimer);
      unsubscribe();
    };

  }, []);

  if (status === "checking" || status === "loading") {
    return <LoadingScreen />;
  }

  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  if (status === "verify") {
    return <Navigate to="/verify-email" replace />;
  }

  return <Navigate to="/home" replace />;

}

function HomeEntry() {

  const [status, setStatus] = useState("checking");

  useEffect(() => {

    let loaderTimer;

    const unsubscribe = onAuthStateChanged(auth, (user) => {

      if (!user) {
        setStatus("guest");
        return;
      }

      const authDeviceSync = sessionStorage.getItem("auth_device_sync");

      if (authDeviceSync === "pending") {
        setStatus("checking");
        return;
      }

      if (!user.emailVerified) {
        setStatus("verify");
        return;
      }

      setStatus("loading");

      loaderTimer = setTimeout(() => {
        setStatus("authenticated");
      }, 1200);

    });

    return () => {
      if (loaderTimer) clearTimeout(loaderTimer);
      unsubscribe();
    };

  }, []);

  if (status === "checking" || status === "loading") {
    return <LoadingScreen />;
  }

  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  if (status === "verify") {
    return <Navigate to="/verify-email" replace />;
  }

  return <><HomeRedirect /><Home /></>;

}

function Home() {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
<Navbar />
<Hero />
<WhoCanUse />
<Footer />
</>);


}



function Services() {

  return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'white', background: 'black', height: '100vh' }}>
<h1>Our Services</h1>
<p>Our services information coming soon!</p>
</div>);


}



function Privacy() {

  return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'white', background: 'black', height: '100vh' }}>
<h1>Privacy</h1>
<p>Our privacy information coming soon!</p>
</div>);


}



function detectDevice() {

  const ua = navigator.userAgent;

  const isMobileUA =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  const isTouch =
  'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isMobileUA || isTouch) {
    return "mobile";
  }

  return "pc";

}



function HomeRedirect() {

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {

    const params = new URLSearchParams(location.search);
    const view = params.get("view");

    if (view) return;

    const device = detectDevice();

    navigate(`/home?view=${device}`, { replace: true });

  }, [navigate, location]);

  return null;

}





function ProtectedRoute({ children }) {

  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (user) => {

      if (!user) {
        navigate("/home", { replace: true });
        return;
      }

      if (!user.emailVerified) {
        navigate("/verify-email", { replace: true });
        return;
      }

      setChecked(true);

    });

    return () => unsubscribe();

  }, [navigate, location]);

  if (!checked) return null;

  return children;

}



function VerifyGate({ children }) {

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (user) => {

      if (!user) return;

      if (user.emailVerified) return;

      if (
      location.pathname === "/home" ||
      location.pathname === "/" ||
      location.pathname === "/verify-email")
      {
        return;
      }

      navigate("/verify-email", { replace: true });

    });

    return () => unsubscribe();

  }, [navigate, location]);

  return children;

}



function DashboardLayout({ children }) {
  return (
    <>
<DashboardNavbar />
{children}
<BottomNav />
</>);


}

function SessionGuardBridge() {

  const navigate = useNavigate();

  useSessionGuard(navigate);

  return null;

}

function PublicLayout({ children }) {

  return (
    <>
<DashboardNavbar />
{children}
<BottomNav />
</>);


}

function AppContent({ alert, setAlert, toast, setToast, myUsername }) {

  const location = useLocation();

  const hideToast = location.pathname === "/chatroom";

  useEffect(() => {
    if (window.lenis) {
      window.lenis.scrollTo(0, { immediate: true });
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>

<Routes>

<Route path="/" element={<StartupRoute />} />

<Route path="/home" element={<HomeEntry />} />

<Route path="/activity" element={<ActivityPage />} />

<Route path="/login" element={<Login />} />
<Route path="/recover" element={<Recover />} />
<Route path="/signup" element={<Signup />} />
<Route path="/verify-email" element={<VerifyEmail />} />

<Route path="/services" element={<Services />} />
<Route path="/privacy" element={<Privacy />} />
<Route path="/devices" element={<Devices />} />
<Route path="/edit-profile" element={<EditProfile />} />

<Route path='/dashboard/settings' element={<Settings />} />
<Route path='/account-center' element={<AccountCenter />} />
<Route path='/password-security' element={<PasswordSecurity />} />
<Route path='/change-password' element={<ChangePassword />} />
<Route path="/your-data" element={<YourData />} />
<Route path="/app-storage" element={<YourDataa />} />
<Route path="/privacy-page" element={<PrivacyPage />} />
<Route path='/add-story' element={<AddStory />} />
<Route path='/story-editor' element={<StoryEditor />} />
<Route path='/delete-account' element={<DeleteAccount />} />
<Route path='/liked-memes' element={<LikedMemes />} />
<Route path='/insights' element={<Insights />} />
<Route path='/dashboard/search' element={<UserSearch />} />
<Route path="/profile-qr" element={<ProfileQR />} />
<Route path="/dashboard/chat" element={<Chats />} />
<Route path="/create-group" element={<CreateGroup />} />
<Route
          path="/group/:username"
          element={
          <ProtectedRoute>
<GroupChatRoom />
</ProtectedRoute>
          } />
        
<Route
          path="/group/:username/info"
          element={
          <ProtectedRoute>
<GroupInfo />
</ProtectedRoute>
          } />
        
<Route path="/developers" element={<Developers />} />
<Route path='/odoy-chat' element={<OdoyChat />} />
<Route path='/notifications' element={<Notifications />} />
<Route path='/theme' element={<Theme />} />
<Route path="/owner-panel" element={<OwnerPanel />} />
<Route path="/story-memories" element={<StoryMemories />} />

<Route path="/dashboard/post-editor" element={<SelectPost />} />
<Route path="/dashboard/post-view" element={<PostView />} />
<Route path="/dashboard/posts" element={<PostsFeed />} />
<Route path='/journey' element={<Journey />} />

<Route
          path="/chatroom"
          element={
          <ProtectedRoute>
<ChatRoom />
</ProtectedRoute>
          } />
        

<Route
          path="/dashboard"
          element={
          <ProtectedRoute>
<DashboardLayout>
<Dashboard />
</DashboardLayout>
</ProtectedRoute>
          } />
        

<Route
          path="/dashboard/profile"
          element={
          <ProtectedRoute>
<DashboardLayout>
<Profile />
</DashboardLayout>
</ProtectedRoute>
          } />
        

<Route
          path="/dashboard/add-post"
          element={
          <ProtectedRoute>
<DashboardLayout>
<AddPost />
</DashboardLayout>
</ProtectedRoute>
          } />
        

<Route
          path="/u/:username"
          element={
          <PublicLayout>
<UserProfile />
</PublicLayout>
          } />
        

<Route
          path="/story-preview/:username"
          element={
          <ProtectedRoute>
<DashboardLayout>
<StoryPreview />
</DashboardLayout>
</ProtectedRoute>
          } />
        

<Route
          path="/u/:username/connections/:type"
          element={
          <ProtectedRoute>
<DashboardLayout>
<Connections />
</DashboardLayout>
</ProtectedRoute>
          } />
        

</Routes>

{alert &&
      <Alert
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert(null)} />

      }

{}
{!hideToast &&
      <MessageToast
        data={toast}
        close={() => setToast(null)} />

      }

</>);

}

function App() {

  const [alert, setAlert] = useState(null);
  const [toast, setToast] = useState(null);
  const [myUsername, setMyUsername] = useState("");

  useEffect(() => {

    const unsub = onAuthStateChanged(auth, async (user) => {

      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setMyUsername(snap.data().username);
        setMyUid(user.uid);
        subscribePush(user.uid);
      }

    });

    return () => unsub();

  }, []);

  const [myUid, setMyUid] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").
      then(() => console.log("Service worker registered")).
      catch((err) => console.log("SW registration failed", err));
    }
  }, []);

  useMessageListener(myUid, setToast);

  useEffect(() => {

    const lenis = new Lenis({
      duration: 1,
      lerp: 0.08,
      smoothWheel: true,
      smoothTouch: true,
      touchMultiplier: 2,
      wheelMultiplier: 1
    });

    window.lenis = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    const handleAnchor = (e) => {
      const href = e.currentTarget.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        lenis.scrollTo(href);
      }
    };

    document.querySelectorAll('a[href^="#"]').forEach((el) => {
      el.addEventListener("click", handleAnchor);
    });

    return () => {
      lenis.destroy();
    };

  }, []);

  useEffect(() => {

    let unsub;

    const startListener = async () => {

      unsub = onSnapshot(collection(db, "chats"), (snap) => {

        snap.docChanges().forEach((change) => {

          if (change.type !== "modified") return;

          const data = change.doc.data();

          const user = auth.currentUser;
          if (!user) return;

          if (!data.members) return;

          const myUsername = data.members.find((u) => u === user.displayName || u === user.email);

          if (!data.members.includes(myUsername)) return;

          if (data.lastSender === myUsername) return;

          if (data.lastSeen) return;

          const other = data.members.find((u) => u !== myUsername);

          window.showAlert(`${other} • Got New Message`, "info");

        });

      });

    };

    const unsubAuth = onAuthStateChanged(auth, (user) => {

      if (user) {
        startListener();
      }

    });

    return () => {

      if (unsub) unsub();
      unsubAuth();

    };

  }, []);

  useEffect(() => {

    let interval;

    function checkInternet() {

      if (!navigator.onLine) {
        window.showAlert("Internet connection lost", "error");
        return;
      }

      if (navigator.connection) {

        const speed = navigator.connection.downlink;
        const type = navigator.connection.effectiveType;

        if (speed && speed < 1) {
          window.showAlert("Slow internet connection detected", "warning");
        }

        if (type === "2g" || type === "slow-2g") {
          window.showAlert("Very slow internet detected", "warning");
        }

      }

    }

    interval = setInterval(checkInternet, 7000);

    window.addEventListener("offline", () => {
      window.showAlert("Internet connection lost", "error");
    });

    window.addEventListener("online", () => {
      window.showAlert("Back online", "success");
    });

    return () => {
      clearInterval(interval);
    };

  }, []);


  window.showAlert = (message, type = "info") => {
    setAlert({ message, type });
  };

  async function subscribePush(uid) {

    if (!("serviceWorker" in navigator)) return;

    const reg = await navigator.serviceWorker.ready;

    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY || "YOUR_VAPID_PUBLIC_KEY"
      });
    }

    await supabase.
    from("push_subscriptions").
    delete().
    eq("uid", uid);

    await supabase.
    from("push_subscriptions").
    insert({
      uid: uid,
      subscription: sub
    });

  }

  return (
    <>


<Router>

<VerifyGate>

<SessionGuardBridge />

<AppContent
            alert={alert}
            setAlert={setAlert}
            toast={toast}
            setToast={setToast}
            myUsername={myUsername} />
          

</VerifyGate>

</Router>

</>);


}

export default App;