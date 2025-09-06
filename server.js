import express from "express";
import fetch from "node-fetch";
import querystring from "querystring";

const app = express();

// Twitter App credentials
const CLIENT_ID = "RW94dmUyai00ODYtYWl2MG9pYlE6MTpjaQ";
const CLIENT_SECRET = "QFS-OIPBwfI9vfbjior8A1GTlgdH3S-X-vUoAaFNdr38Q68Zew";
const REDIRECT_URI = "http://localhost:3000/callback";

// Step 1: Redirect user to Twitter for authentication
app.get("/login", (req, res) => {
  const params = querystring.stringify({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "tweet.read users.read offline.access",
    state: "random_state_string",
    code_challenge: "challenge",
    code_challenge_method: "plain",
  });
  res.redirect(`https://twitter.com/i/oauth2/authorize?${params}`);
});

// Step 2: Handle callback from Twitter
app.get("/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64")
      },
      body: querystring.stringify({
        code: code,
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        code_verifier: "challenge",
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log("Tokens:", tokenData);

    // Step 3: Get user information
    const userResponse = await fetch("https://api.twitter.com/2/users/me", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
      },
    });

    const userInfo = await userResponse.json();
    console.log("User Info:", userInfo);

    // In a real application, you would create or update the user in your database
    // and then redirect to your frontend with a success message or JWT token
    
    res.send(`
      <script>
        // Send user data to the frontend
        window.opener.postMessage({
          type: 'TWITTER_LOGIN_SUCCESS',
          user: {
            username: "${userInfo.data.username}",
            name: "${userInfo.data.name}",
            id: "${userInfo.data.id}"
          }
        }, '*');
        window.close();
      </script>
    `);
  } catch (error) {
    console.error("Error during Twitter authentication:", error);
    res.status(500).send("Authentication failed");
  }
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));