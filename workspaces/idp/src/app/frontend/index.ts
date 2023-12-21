type LoginResponse = {
  token: string,
  error?: string, // TODO check if `error` is really string
};

const WORKER_URL = "https://github-oauth-login.gr2m.workers.dev";
const code = new URL(location.href).searchParams.get("code");
const $login = document.querySelector("#login");

if (!$login) {
  alert("We're sorry, something technically wrong: error code 101");
  throw new Error("#login element was not found.");
}

if (code) {
  // remove ?code=... from URL
  const path =
    location.pathname +
    location.search.replace(/\bcode=\w+/, "").replace(/\?$/, "");
  history.pushState({}, "", path);

  document.body.dataset.state = "loading";

  try {
    const response = await fetch(`${WORKER_URL}/api/github`, {
      method: "POST",
      mode: "cors",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    const result: LoginResponse = await response.json();

    if (result.error) {
      alert(JSON.stringify(result, null, 2));
    } else {
      // token can now be used to send authenticated requests against https://api.github.com
      const getUserResponse = await fetch("https://api.github.com/user", {
        headers: {
          accept: "application/vnd.github.v3+json",
          authorization: `token ${result.token}`,
        },
      });
      const { login } = await getUserResponse.json() as { login: string };
      $login.textContent = login;
      document.body.dataset.state = "signed-in";
    }
  } catch (error) {
    alert(error);
    location.reload();
  }
}

// Required to support top-level await
export {};
