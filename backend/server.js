// --- 1. IMPORT LIBRARIES ---
// 'express' is for building the web server
// 'cors' allows your frontend (on a different URL) to talk to this backend
// 'firebase-admin' is the "key" to connect to your database
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// --- 2. INITIALIZE ---
// Load your secret Firebase key
// Make sure you have this file in the same folder!
const serviceAccount = require('./serviceAccountKey.json');

// Connect to your Firebase project
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Get a reference to the Firestore database
const db = admin.firestore();

// Create the Express server app
const app = express();

// --- 3. CONFIGURE SERVER ---
// 'app.use(cors())' allows requests from your frontend website
app.use(cors());
// 'app.use(express.json())' allows the server to read JSON data sent from the frontend
app.use(express.json());

// --- 4. DEFINE API ROUTES (THE "ENDPOINTS") ---

// This is a test route to see if the server is working
app.get('/', (req, res) => {
  res.send('🚀 VeryScan Backend is LIVE! 🚀');
});

/**
 * ROUTE 1: CHECKOUT
 * Called when a student scans to borrow an item.
 * The frontend sends: { "itemId": "arduino-1", "studentName": "Kshitij" }
 */
app.post('/checkout', async (req, res) => {
  try {
    const { itemId, studentName } = req.body;

    // Find the item in the 'items' collection by its ID
    const itemRef = db.collection('items').doc(itemId);

    // Update the item's data
    await itemRef.update({
      status: 'Checked Out',
      lastCheckedOutBy: studentName,
      lastCheckoutTime: new Date(), // Set the time to "now"
      isFlagged: false // Un-flag it, assuming it's good to go
    });

    console.log(`CHECKOUT: ${itemId} by ${studentName}`);
    // Send a success message back to the frontend
    res.json({ success: true, message: `Checked out ${itemId}!` });

  } catch (error) {
    console.error("Checkout Error:", error);
    res.status(500).json({ success: false, message: "Error checking out item." });
  }
});

/**
 * ROUTE 2: RETURN
 * Called when a student scans to return an item.
 * The frontend sends: { "itemId": "arduino-1" }
 */
app.post('/return', async (req, res) => {
  try {
    const { itemId } = req.body;
    const itemRef = db.collection('items').doc(itemId);

    // Update the item's data
    await itemRef.update({
      status: 'Available',
      // We keep 'lastCheckedOutBy' to see who had it last
    });

    console.log(`RETURN: ${itemId}`);
    res.json({ success: true, message: `Returned ${itemId}!` });

  } catch (error) {
    console.error("Return Error:", error);
    res.status(500).json({ success: false, message: "Error returning item." });
  }
});

/**
 * ROUTE 3: FLAG FOR REVIEW
 * Called when a student says an item is broken.
 * The frontend sends: { "itemId": "arduino-1" }
 */
app.post('/flag', async (req, res) => {
  try {
    const { itemId } = req.body;
    const itemRef = db.collection('items').doc(itemId);

    // Update the item's data
    await itemRef.update({
      status: 'Needs Review',
      isFlagged: true
    });

    console.log(`FLAGGED: ${itemId}`);
    res.json({ success: true, message: `Flagged ${itemId} for review.` });

  } catch (error) {
    console.error("Flag Error:", error);
    res.status(500).json({ success: false, message: "Error flagging item." });
  }
});

// --- 5. START THE SERVER ---
// The server will "listen" on port 3000 (you can change this)
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});