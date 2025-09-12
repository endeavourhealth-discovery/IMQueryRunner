declare module "#auth-utils" {
  interface User {
    name: string;
    id: string;
  }
  interface UserSession {
    loggedInAt: Date;
  }
  interface SecureSessionData {
    casdoorAccessToken: string;
  }
}

export {};
