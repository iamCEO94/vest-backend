// index.js const express = require("express"); const bodyParser = require("body-parser"); const cors = require("cors"); const admin = require("firebase-admin"); const { v4: uuidv4 } = require("uuid"); const axios = require("axios"); require("dotenv").config();

const app = express(); app.use(cors()); app.use(bodyParser.json());

// Initialize Firebase Admin SDK with env variable const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount), });

const db = admin.firestore(); const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

const generateReferralLink = (uid) => `https://vest.com/ref/${uid}`;

// Signup app.post("/signup", async (req, res) => { const { email, password, referredBy } = req.body; try { const userRecord = await admin.auth().createUser({ email, password }); const uid = userRecord.uid; const referralLink = generateReferralLink(uid);

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

} catch (error) { res.status(400).json({ error: error.message }); } });

// Signin app.post("/signin", async (req, res) => { const { email } = req.body; try { const user = await admin.auth().getUserByEmail(email); const userDoc = await db.collection("users").doc(user.uid).get(); if (!userDoc.exists) throw new Error("User not found"); res.json({ user: userDoc.data() }); } catch (error) { res.status(400).json({ error: error.message }); } });

// Recharge app.post("/recharge", async (req, res) => { const { uid, amount } = req.body; try { const user = await admin.auth().getUser(uid); const response = await axios.post( "https://api.paystack.co/transaction/initialize", { email: user.email, amount: amount * 100, }, { headers: { Authorization: Bearer ${PAYSTACK_SECRET}, "Content-Type": "application/json", }, } );

res.json({ authorization_url: response.data.data.authorization_url });

} catch (error) { res.status(500).json({ error: "Recharge initialization failed" }); } });

// Paystack webhook (test only - you must verify signature in production) app.post("/paystack/webhook", async (req, res) => { const { event, data } = req.body; if (event === "charge.success") { const email = data.customer.email; const amount = data.amount;

try {
  const user = await admin.auth().getUserByEmail(email);
  const userRef = db.collection("users").doc(user.uid);

  await db.runTransaction(async (t) => {
    const doc = await t.get(userRef);
    const currentBalance = doc.data().balance || 0;
    t.update(userRef, { balance: currentBalance + amount / 100 });
  });

  console.log(`${email} recharged ₦${amount / 100}`);
} catch (err) {
  console.error("Webhook processing failed:", err.message);
}

} res.sendStatus(200); });

// Activity log app.post("/activity", async (req, res) => { const { uid, activity } = req.body; try { await db.collection("users").doc(uid).update({ dailyActivities: admin.firestore.FieldValue.arrayUnion({ activity, timestamp: new Date().toISOString(), }), }); res.json({ message: "Activity logged" }); } catch (error) { res.status(500).json({ error: error.message }); } });

// Get user info app.get("/user/:uid", async (req, res) => { try { const doc = await db.collection("users").doc(req.params.uid).get(); if (!doc.exists) return res.status(404).json({ error: "User not found" }); res.json(doc.data()); } catch (error) { res.status(500).json({ error: error.message }); } });

const PORT = process.env.PORT || 5000; app.listen(PORT, () => console.log(Server running on port ${PORT}));

￼Enter
