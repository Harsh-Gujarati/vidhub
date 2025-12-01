// Firebase Configuration for User Data Persistence
// Using Firebase Firestore for storing user likes/saves across devices

const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase (will be loaded from CDN)
let db = null;
let auth = null;

const initFirebase = () => {
    if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK not loaded');
        return false;
    }

    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        auth = firebase.auth();
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        return false;
    }
};

// User Data Management
const FirebaseUserData = {
    // Save user data to Firestore
    async saveUserData(userId, data) {
        if (!db) return false;

        try {
            await db.collection('users').doc(userId).set({
                likes: data.likes || [],
                saved: data.saved || [],
                vip: data.vip || false,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            return true;
        } catch (error) {
            console.error('Error saving user data:', error);
            return false;
        }
    },

    // Load user data from Firestore
    async loadUserData(userId) {
        if (!db) return null;

        try {
            const doc = await db.collection('users').doc(userId).get();
            if (doc.exists) {
                return doc.data();
            }
            return null;
        } catch (error) {
            console.error('Error loading user data:', error);
            return null;
        }
    },

    // Sync local data with Firestore
    async syncUserData(userId, localData) {
        if (!db) return localData;

        try {
            const remoteData = await this.loadUserData(userId);

            if (!remoteData) {
                // No remote data, save local data
                await this.saveUserData(userId, localData);
                return localData;
            }

            // Merge local and remote data (remote takes precedence for conflicts)
            const merged = {
                likes: [...new Set([...(localData.likes || []), ...(remoteData.likes || [])])],
                saved: this.mergeSaved(localData.saved || [], remoteData.saved || []),
                vip: remoteData.vip || localData.vip || false
            };

            // Save merged data back to Firestore
            await this.saveUserData(userId, merged);
            return merged;
        } catch (error) {
            console.error('Error syncing user data:', error);
            return localData;
        }
    },

    // Merge saved items (keep unique by ID, prefer newer timestamps)
    mergeSaved(local, remote) {
        const map = new Map();

        [...local, ...remote].forEach(item => {
            const existing = map.get(item.id);
            if (!existing || item.timestamp > existing.timestamp) {
                map.set(item.id, item);
            }
        });

        return Array.from(map.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 50); // Keep max 50 saved items
    }
};

// Export for use in app.js
window.FirebaseUserData = FirebaseUserData;
window.initFirebase = initFirebase;
