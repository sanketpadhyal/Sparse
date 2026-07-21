import { useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, onSnapshot, getDocFromServer } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";

export default function useSessionGuard(navigate) {

  useEffect(() => {

    let unsubscribeDevices = null;
    let unsubscribeOnline = null;
    let unsubscribeFocus = null;
    let unsubscribeVisibility = null;
    let recheckInterval = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {

      if (!user) {
        return;
      }

      const sessionId = localStorage.getItem("session_id");
      const syncState = sessionStorage.getItem("auth_device_sync");
      const isFreshAuthSync = syncState === "pending";

      if (!sessionId) return;

      const deviceRef = doc(db, "devicelogins", user.uid);
      const guardStartedAt = Date.now();
      let handledInvalidSession = false;

      const finalizeInvalidSession = async () => {
        if (handledInvalidSession) return;

        handledInvalidSession = true;

        sessionStorage.removeItem("auth_device_sync");
        sessionStorage.removeItem("last_login_logged");
        sessionStorage.removeItem("session_guard_ready");
        localStorage.removeItem("session_id");

        window.showAlert("You were logged out by another device. Please login again.", "info");

        await signOut(auth);

        navigate("/login", { replace: true });
      };

      const validateSessionNow = async () => {
        if (handledInvalidSession) return;
        if (!navigator.onLine) return;

        try {
          const freshSnap = await getDocFromServer(deviceRef);

          if (!freshSnap.exists()) {
            await finalizeInvalidSession();
            return;
          }

          const devices = freshSnap.data()?.devices || [];
          const validSession = devices.some((d) => d.sessionId === sessionId);

          if (!validSession) {
            await finalizeInvalidSession();
            return;
          }

          sessionStorage.setItem("auth_device_sync", "ready");
          sessionStorage.setItem("session_guard_ready", "true");

        } catch (err) {
          console.log("SESSION RECHECK ERROR", err);
        }
      };

      unsubscribeDevices = onSnapshot(deviceRef, async (snapshot) => {

        const elapsed = Date.now() - guardStartedAt;
        const graceWindow = 10000;

        if (!snapshot.exists()) {
          if (!isFreshAuthSync || elapsed >= graceWindow) {
            await finalizeInvalidSession();
            return;
          }
          return;
        }

        const devices = snapshot.data()?.devices || [];

        const validSession = devices.some((d) => d.sessionId === sessionId);

        if (!validSession) {
          if (!isFreshAuthSync || elapsed >= graceWindow) {
            await finalizeInvalidSession();
            return;
          }
          return;
        }

        sessionStorage.setItem("auth_device_sync", "ready");
        sessionStorage.setItem("session_guard_ready", "true");

      });

      const handleOnline = () => {
        validateSessionNow();
      };

      const handleFocus = () => {
        validateSessionNow();
      };

      const handleVisibility = () => {
        if (document.visibilityState === "visible") {
          validateSessionNow();
        }
      };

      window.addEventListener("online", handleOnline);
      unsubscribeOnline = () => {
        window.removeEventListener("online", handleOnline);
      };

      window.addEventListener("focus", handleFocus);
      unsubscribeFocus = () => {
        window.removeEventListener("focus", handleFocus);
      };

      document.addEventListener("visibilitychange", handleVisibility);
      unsubscribeVisibility = () => {
        document.removeEventListener("visibilitychange", handleVisibility);
      };

      recheckInterval = window.setInterval(() => {
        validateSessionNow();
      }, 15000);

      validateSessionNow();

    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDevices) unsubscribeDevices();
      if (unsubscribeOnline) unsubscribeOnline();
      if (unsubscribeFocus) unsubscribeFocus();
      if (unsubscribeVisibility) unsubscribeVisibility();
      if (recheckInterval) window.clearInterval(recheckInterval);
    };

  }, [navigate]);

}