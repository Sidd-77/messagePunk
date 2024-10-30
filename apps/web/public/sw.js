// public/sw.js
self.addEventListener('push', function(event) {
    if (event.data) {
      const data = event.data.json();
      const options = {
        body: data.notification.body,
        icon: '/icon.png', // Add your notification icon
        image: data.notification.image,
        badge: '/badge.png', // Add your badge icon
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1
        }
      };
  
      event.waitUntil(
        self.registration.showNotification(data.notification.title, options)
      );
    }
  });
  
  self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
      clients.openWindow('/')  // Customize the URL where you want to redirect users
    );
  });