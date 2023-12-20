import { Hono } from "hono";

type Secrets = {
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

export default app;
