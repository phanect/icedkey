import { Hono } from "hono";
import { google } from "googleapis";

type Secrets = {
  GOOGLE_CLIENT_ID: string,
  GOOGLE_CLIENT_SECRET: string,
  GOOGLE_REDIRECT_URL: string,
  GITHUB_CLIENT_ID: string,
  GITHUB_CLIENT_SECRET: string,
};

const app = new Hono<{ Bindings: Secrets }>();

app.notFound((c) => c.render(
  <>
    <h1>404 Not Found</h1>
    <p>
      <a href="/login">Login</a> | <a href="/signup">Sign up</a>
    </p>
  </>
));

app.onError((err, c) => {
  console.error(err);
  return c.render(
    <>
      <h1>We're sorry, something went wrong</h1>
      <p>
        This error may be caused by a bug.
        Contact developers.
      </p>
    </>
  );
});

// CORS pre-flight request
app.options("*", (c) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type");
  c.status(204);
  return c.body("");
});

// redirect GET requests to the OAuth login page on github.com
app.get("*", (c) => c.redirect(c.env.GITHUB_CLIENT_ID ? `https://github.com/login/oauth/authorize?client_id=${c.env.GITHUB_CLIENT_ID}` : "/", 302));

app.get("/", (c) => c.render(
  <>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>
          Login with GitHub – A Cloudflare Worker + GitHub Pages Login Example
        </title>
        <link rel="stylesheet" href="./frontend/style.css" />
        <script src="./frontend/index.ts" defer></script>
      </head>
      <body data-state="signed-out">
        <h1>
          Login with GitHub
          <small>A Cloudflare Worker + GitHub Pages Login Example</small>
        </h1>
        <p id="signed-out">
          <a href="https://github-oauth-login.gr2m.workers.dev">Login with GitHub</a>
        </p>
        <p id="signed-in">
          Hello there, <span id="login"></span>. (<a href=".">Logout</a>)
        </p>
        <p id="loading">
          Loading...
        </p>
      </body>
    </html>
  </>
));

type GitHubLoginResponse = {
  access_token: string,
  error?: string, // TODO check if `error` is really string
};

app.get("/google", async (c) => {
  if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET || !c.env.GOOGLE_REDIRECT_URL) {
    c.text("Login with Google is not supported on this identity server", 404);
    return;
  }

  const oauth2Client = new google.auth.OAuth2(
    c.env.GOOGLE_CLIENT_ID,
    c.env.GOOGLE_CLIENT_SECRET,
    c.env.GOOGLE_REDIRECT_URL,
  );

  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: "online",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "OpenID",
    ],
    include_granted_scopes: true,
  });

  c.redirect(authorizationUrl, 301);
});

app.post("/oauth2callback", async (c) => {
  if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET || !c.env.GOOGLE_REDIRECT_URL) {
    c.text("Login with Google is not supported on this identity server", 404);
    return;
  }

  const oauth2Client = new google.auth.OAuth2(
    c.env.GOOGLE_CLIENT_ID,
    c.env.GOOGLE_CLIENT_SECRET,
    c.env.GOOGLE_REDIRECT_URL,
  );

  let userCredential = null;

  const { code, error } = c.req.query();

  if (error) {
    console.error(`Error: ${error}`);
    c.text("Failed to login with Google."); // TODO return the cause of failure in JSON
    return;
  } else {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    /**
     * Save credential to the global variable in case access token was refreshed.
     * TODO: In a production app, you likely want to save the refresh token in a secure persistent database instead.
     */
    userCredential = tokens;
  }
});

app.post("/revoke", async (c) => {
  if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET || !c.env.GOOGLE_REDIRECT_URL) {
    c.text("Login with Google is not supported on this identity server", 404);
    return;
  }

  // TODO call userCredential from DB
  const postData = `token=${userCredential.access_token}`;
  const res = await fetch("https://oauth2.googleapis.com/revoke", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(postData).toString(),
    },
    body: postData,
  });

  if (res.status < 400) {
    c.text("Succeeded to revoke"); // TODO return better data
  } else {
    c.text("Failed to revoke.");
  }
});

app.post("/api/github", async (c) => {
  if (!c.env.GITHUB_CLIENT_ID || !c.env.GITHUB_CLIENT_SECRET) {
    c.text("Login with GitHub is not supported on this identity server", 404);
    return;
  }

  try {
    const { code } = await c.req.json();

    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": "IcedKey",
          accept: "application/json",
        },
        body: JSON.stringify({
          client_id: c.env.GITHUB_CLIENT_ID,
          client_secret: c.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      }
    );
    const result = await response.json() as GitHubLoginResponse;

    c.header("Access-Control-Allow-Origin", "*");

    return result.error ?
      c.json(result, 401) :
      c.json({ token: result.access_token }, 201);
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return c.text(error.message, 500);
    } else {
      return c.text("We're sorry, something technically wrong. This is a bug of IcedKey. Error code: 731", 500);
    }
  }
});

export default app;
