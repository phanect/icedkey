import { Hono } from "hono";

type HonoEnv = {
  GITHUB_CLIENT_ID: string,
  GITHUB_CLIENT_SECRET: string,

  d1: D1Database,
};

const app = new Hono<{ Bindings: HonoEnv }>();

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
