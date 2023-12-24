addEventListener("fetch", (event) => {
  event.respondWith(handle(event.request));
});

// use secrets
const client_id = CLIENT_ID;
const client_secret = CLIENT_SECRET;

async function handle(request) {
}
