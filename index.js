const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
const axios = require("axios");

// Initialize Express
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Firebase Admin using service account from environment variable
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin initialized.");
} catch (err) {
  console.error("❌ Firebase initialization failed:", err.message);
  process.exit(1);
}

const db = admin.firestore();

// PAYSTACK secret key
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET; // Also set in Render environment

// Helper function
const generateReferralLink = (uid) => `https://vest.com/ref/${uid}`;

// ✅ SIGNUP ROUTE
app.post("/signup", async (req, res) => {
  const { email, password, referredBy } = req.body;
  try {
    const userRecord = await admin.auth().createUser({ email, password });
    const uid = userRecord.uid;
    const referralLink = generateReferralLink(uid);
    const userData = {
      uid,
      email,
      referralLink,
      referredBy: referredBy || null,
      balance: 0,
      teamCount: 0,
      dailyActivities: [],
      createdAt: new Date().toISOString(),
    };
    await db.collection("users").doc(uid).set(userData);
    res.status(201).json({ message: "User created", user: userData });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ SIGNIN ROUTE
app.post("/signin", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await admin.auth().getUserByEmail(email);
    const userData = (await db.collection("users").doc(user.uid).get()).data();
    res.json({ user: userData });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ RECHARGE ROUTE (initialize Paystack transaction)
app.post("/recharge", async (req, res) => {
  const { uid, amount } = req.body;
  try {
    const user = await admin.auth().getUser(uid);
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
const axios = require("axios");

// Initialize Express
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Firebase Admin using service account from environment variable
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin initialized.");
} catch (err) {
  console.error("❌ Firebase initialization failed:", err.message);
  process.exit(1);
}

const db = admin.firestore();

// PAYSTACK secret key
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET; // Also set in Render environment

// Helper function
const generateReferralLink = (uid) => `https://vest.com/ref/${uid}`;

// ✅ SIGNUP ROUTE
app.post("/signup", async (req, res) => {
  const { email, password, referredBy } = req.body;
  try {
    const userRecord = await admin.auth().createUser({ email, password });
    const uid = userRecord.uid;
    const referralLink = generateReferralLink(uid);
    const userData = {
      uid,
      email,
      referralLink,
      referredBy: referredBy || null,
      balance: 0,
      teamCount: 0,
      dailyActivities: [],
      createdAt: new Date().toISOString(),
    };
    await db.collection("users").doc(uid).set(userData);
    res.status(201).json({ message: "User created", user: userData });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ SIGNIN ROUTE
app.post("/signin", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await admin.auth().getUserByEmail(email);
    const userData = (await db.collection("users").doc(user.uid).get()).data();
    res.json({ user: userData });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ RECHARGE ROUTE (initialize Paystack transaction)
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
  } catch (err) {
    console.error("Recharge error:", err.message);
    res.status(500).json({ error: "Recharge initialization failed" });
  }
});

// ✅ PAYSTACK WEBHOOK (update balance on success)
app.post("/paystack/webhook", async (req, res) => {
  const { event, data } = req.body;

  if (event === "charge.success") {
    const { email } = data.customer;
    const amount = data.amount;

    try {
      const user = await admin.auth().getUserByEmail(email);
      const userRef = db.collection("users").doc(user.uid);

      await db.runTransaction(async (t) => {
        const doc = await t.get(userRef);
        const currentBalance = doc.data().balance || 0;
        t.update(userRef, { balance: currentBalance + amount / 100 });
      });

      console.log(`✅ ${email} recharged ₦${amount / 100}`);
    } catch (err) {
      console.error("Webhook error:", err.message);
    }
  }

  res.sendStatus(200);
});

// ✅ LOG ACTIVITY
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET USER INFO
app.get("/user/:uid", async (req, res) => {
  try {
    const doc = await db.collection("users").doc(req.params.uid).get();
    if (!doc.exists) return res.status(404).json({ error: "User not found" });
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});￼Enter    const response = await axios.post(
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
  } catch (err) {
    console.error("Recharge error:", err.message);
    res.status(500).json({ error: "Recharge initialization failed" });
  }
});

// ✅ PAYSTACK WEBHOOK (update balance on success)
app.post("/paystack/webhook", async (req, res) => {
  const { event, data } = req.body;

  if (event === "charge.success") {
    const { email } = data.customer;
nst amount = data.amount;

    try {
      const user = await admin.auth().getUserByEmail(email);
      const userRef = db.collection("users").doc(user.uid);

      await db.runTransaction(async (t) => {
        const doc = await t.get(userRef);
        const currentBalance = doc.data().balance || 0;
        t.update(userRef, { balance: currentBalance + amount / 100 });
      });

      console.log(`✅ ${email} recharged ₦${amount / 100}`);
    } catch (err) {
      console.error("Webhook error:", err.message);
    }
  }

  res.sendStatus(200);
});

// ✅ LOG ACTIVITY
app.post("/activity", async (req, res) => {
  const { uid, activity } = req.body;
  try {
    await db.collection("users").doc(uid).update({
