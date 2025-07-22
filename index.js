const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

// Firebase Admin SDK setup (your full credentials here)
const serviceAccount = {
  type: "service_account",
  project_id: "vest-d0b99",
  private_key_id: "996ec1820af4cec4f1f66830a6d692be1824cee3",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkq...TRUNCATED...\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@vest-d0b99.iam.gserviceaccount.com",
  client_id: "102092336755062834974",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40vest-d0b99.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Paystack Secret Key
const PAYSTACK_SECRET = "sk_live_9403ec1226390c470f86e5204e4c3b4b2e1e50a0";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Helper
const generateReferralLink = (uid) => `https://vest.com/ref/${uid}`;

// Signup
app.post("/signup", async (req, res) => {
  const { email, password, referredBy } = req.body;
  try {
    const userRecord = await admin.auth().createUser({ email, password });
    const uid = userRecord.uid;
    const referralLink = generateReferralLink(uid);

    const userData = {
      uid,
      email,
      balance: 0,
      referralLink,
      referredBy: referredBy || null,
      teamCount: 0,
      dailyActivities: [],
      createdAt: new Date().toISOString(),
    };

    await db.collection("users").doc(uid).set(userData);
    res.status(201).json({ message: "User created", user: userData });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Signin
app.post("/signin", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await admin.auth().getUserByEmail(email);
    const userDoc = await db.collection("users").doc(user.uid).get();
    if (!userDoc.exists) throw new Error("User not found");
    res.json({ user: userDoc.data() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Recharge
app.post("/recharge", async (req, res) => {
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

// Firebase Admin SDK setup (your full credentials here)
const serviceAccount = {
  type: "service_account",
  project_id: "vest-d0b99",
  private_key_id: "996ec1820af4cec4f1f66830a6d692be1824cee3",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkq...TRUNCATED...\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@vest-d0b99.iam.gserviceaccount.com",
  client_id: "102092336755062834974",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40vest-d0b99.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Paystack Secret Key
const PAYSTACK_SECRET = "sk_live_9403ec1226390c470f86e5204e4c3b4b2e1e50a0";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Helper
const generateReferralLink = (uid) => `https://vest.com/ref/${uid}`;

// Signup
app.post("/signup", async (req, res) => {
  const { email, password, referredBy } = req.body;
  try {
    const userRecord = await admin.auth().createUser({ email, password });
    const uid = userRecord.uid;
    const referralLink = generateReferralLink(uid);

    const userData = {
      uid,
      email,
      balance: 0,
      referralLink,
      referredBy: referredBy || null,
      teamCount: 0,
      dailyActivities: [],
      createdAt: new Date().toISOString(),
    };

    await db.collection("users").doc(uid).set(userData);
    res.status(201).json({ message: "User created", user: userData });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Signin
app.post("/signin", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await admin.auth().getUserByEmail(email);
    const userDoc = await db.collection("users").doc(user.uid).get();
    if (!userDoc.exists) throw new Error("User not found");
    res.json({ user: userDoc.data() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Recharge
app.post("/recharge", async (req, res) => {
  const { uid, amount } = req.body;
  try {
    const user = await admin.auth().getUser(uid);
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: user.email,
        amount: amount * 100,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ authorization_url: response.data.data.authorization_url });
  } catch (error) {
    res.status(500).json({ error: "Recharge initialization failed" });
  }
});

// Webhook
app.post("/paystack/webhook", async (req, res) => {
  const { event, data } = req.body;
  if (event === "charge.success") {
    const email = data.customer.email;
    const amount = data.amount;

    try {
      const user = await admin.auth().getUserByEmail(email);
      const userRef = db.collection("users").doc(user.uid);

      await db.runTransaction(async (t) => {
        const doc = await t.get(userRef);
        const currentBalance = doc.data().balance || 0;
        t.update(userRef, { balance: currentBalance + amount / 100 });
      });

      console.log(`${email} successfully recharged ₦${amount / 100}`);
    } catch (err) {
      console.error("Recharge webhook error:", err.message);
    }
  }

  res.sendStatus(200);
});

// Log Activity
app.post("/activity", async (req, res) => {
  const { uid, activity } = req.body;
  try {
    await db.collection("users").doc(uid).update({
      dailyActivities: admin.firestore.FieldValue.arrayUnion({
        activity,
        timestamp: new Date().toISOString(),
      }),
    });
    res.json({ message: "Activity logged" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get User Info
app.get("/user/:uid", async (req, res) => {
  try {
    const doc = await db.collection("users").doc(req.params.uid).get();
    if (!doc.exists) return res.status(404).json({ error: "User not found" });
    res.json(doc.data());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));￼Enter  const { uid, amount } = req.body;
  try {
    const user = await admin.auth().getUser(uid);
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: user.email,
        amount: amount * 100,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ authorization_url: response.data.data.authorization_url });
  } catch (error) {
    res.status(500).json({ error: "Recharge initialization failed" });
  }
});

// Webhook
app.post("/paystack/webhook", async (req, res) => {
  const { event, data } = req.body;
event === "charge.success") {
    const email = data.customer.email;
    const amount = data.amount;

    try {
      const user = await admin.auth().getUserByEmail(email);
      const userRef = db.collection("users").doc(user.uid);

      await db.runTransaction(async (t) => {
        const doc = await t.get(userRef);
        const currentBalance = doc.data().balance || 0;
        t.update(userRef, { balance: currentBalance + amount / 100 });
      });

      console.log(`${email} successfully recharged ₦${amount / 100}`);
    } catch (err) {
      console.error("Recharge webhook error:", err.message);
    }
  }

  res.sendStatus(200);
});

// Log Activity
app.post("/activity", async (req, res) => {
  const { uid, activity } = req.body;
