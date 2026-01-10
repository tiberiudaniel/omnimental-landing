const envDefaults: Record<string, string> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "test-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "test.local",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-project",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "demo-bucket",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "demo-sender",
  NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app-id",
  NEXT_PUBLIC_DISABLE_PROGRESS_WRITES: "true",
};

Object.entries(envDefaults).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value;
  }
});

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "test";
}

if (!process.env.NEXT_PUBLIC_DISABLE_TELEMETRY) {
  process.env.NEXT_PUBLIC_DISABLE_TELEMETRY = "1";
}
