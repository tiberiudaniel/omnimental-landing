"use client";

import type { User } from "firebase/auth";
import { E2E_USER_ID } from "./e2eMode";

let cachedE2EUser: User | null = null;

export function getE2EUser(): User {
  if (cachedE2EUser) return cachedE2EUser;
  cachedE2EUser = {
    uid: E2E_USER_ID,
    email: "e2e@omnimental.dev",
    displayName: "E2E User",
    emailVerified: true,
    isAnonymous: false,
    providerData: [],
    refreshToken: "e2e-token",
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => "e2e-token",
    getIdTokenResult: async () => ({ token: "e2e-token" } as never),
    reload: async () => {},
    toJSON: () => ({ uid: E2E_USER_ID }),
    metadata: {} as never,
    providerId: "firebase",
    phoneNumber: null,
    photoURL: null,
  } as User;
  return cachedE2EUser;
}
