import type {User} from "~~/models";

export default function getUserFromTokenCasdoor(token: string) {
  const jwtParts = token.split(".");

  if (jwtParts.length >= 2) {
    const b64Payload = jwtParts[1]!;
    const payload = JSON.parse(atob(b64Payload));
    return {
      id: payload.sub,
      name: payload.name,
      age: payload.properties.age
    } as User;
  } else {
    console.error("Invalid JWT token");
    return {} as User;
  }

}