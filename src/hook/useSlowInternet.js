import { useEffect } from "react";

function useSlowInternet() {

  useEffect(() => {

    let interval = null;
    let lastState = "normal";

    async function checkConnection() {

      if (!navigator.onLine) {

        if (lastState !== "offline") {
          window.showAlert("You are offline", "error");
          lastState = "offline";
        }

        return;
      }

      try {

        const start = Date.now();

        await fetch("https://www.google.com/favicon.ico", {
          mode: "no-cors",
          cache: "no-store"
        });

        const latency = Date.now() - start;

        if (latency > 1500) {

          if (lastState !== "slow") {
            window.showAlert("Your internet connection is slow", "warning");
            lastState = "slow";
          }

        } else {

          lastState = "normal";

        }

      } catch {

        if (lastState !== "unstable") {
          window.showAlert("Network unstable", "warning");
          lastState = "unstable";
        }

      }

      if (navigator.connection) {

        const type = navigator.connection.effectiveType;

        if (type === "slow-2g" || type === "2g") {

          if (lastState !== "veryslow") {
            window.showAlert("Very slow internet detected", "warning");
            lastState = "veryslow";
          }

        }

      }

    }

    interval = setInterval(checkConnection, 12000);

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

}

export default useSlowInternet;