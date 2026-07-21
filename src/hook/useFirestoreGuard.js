export async function safeFirestore(action) {

  try {

    return await action();

  } catch (e) {

    if (
    e.code === "resource-exhausted" ||
    e.code === "unavailable" ||
    e.code === "deadline-exceeded")
    {

      window.showAlert("Server is down. Come back later", "error");

    } else {
      console.error(e);
    }

    throw e;

  }

}