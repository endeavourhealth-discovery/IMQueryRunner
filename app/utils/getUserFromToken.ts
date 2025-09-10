import type { User } from "~~/models";

export async function getUserFromToken(token: string) {
  const CasdoorSDK = getCasdoorSDK();
  const userStore = useUserStore();

  console.log("getting user details");
  const userJson: any = await CasdoorSDK.getUserInfo(token);
  if (userJson.name && userJson.aud && userJson.sub) {
    const user: User = {
      name: userJson.name,
      id: userJson.aud,
      token: userJson.sub,
    };
    userStore.updateCurrentUser(user);
  } else {
    throw createError("User is invalid");
  }
}
