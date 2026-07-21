self.addEventListener("push", event => {

  const data = event.data.json()

  const options = {
    body: data.body,
    icon: data.icon || "/logo192.png",
    badge: data.icon || "/logo192.png",
    data: { url: data.url }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )

})

self.addEventListener("notificationclick", event => {

  event.notification.close()

  event.waitUntil(
    clients.openWindow(event.notification.data.url || "/")
  )

})