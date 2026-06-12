export default () => ({
  mongodb: {
    uri:
      process.env.MONGODB_URI ||
      'mongodb+srv://chatUser:New1234@cluster0.hbuz0bn.mongodb.net/notifications?retryWrites=true&w=majority&appName=Cluster0',
  },
  firebase: {
    // Inline service account JSON (raw JSON string or base64-encoded JSON).
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT || undefined,
    // Path to a service account JSON file on disk.
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || undefined,
    // Optional explicit project id (otherwise taken from the credential).
    projectId: process.env.FIREBASE_PROJECT_ID || undefined,
  },
});
