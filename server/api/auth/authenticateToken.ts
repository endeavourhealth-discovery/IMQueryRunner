export async function authenticateToken(token: string): Promise<string> {
  return await $fetch(
    process.env.CASDOOR_URL! + "api/login/oauth/access_token",
    {
      method: "POST",
      body: {
        code: token,
        client_id: process.env.CASDOOR_CLIENT_ID,
        client_secret: process.env.CASDOOR_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/callback",
      },
    }
  );
}
