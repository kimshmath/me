// Firebase configuration for kimsh.kr edit mode
// This file initializes Firebase Auth and exposes it for edit-mode.js

(function() {
  'use strict';

  // Firebase config - will be populated after project setup
  const firebaseConfig = {
    apiKey: "AIzaSyCDEJ-Ggrm1-Mz6Jqs_-B5HaZVIxutNF8s",
    authDomain: "kimsh-website.firebaseapp.com",
    projectId: "kimsh-website",
    storageBucket: "kimsh-website.firebasestorage.app",
    messagingSenderId: "90014042889",
    appId: "1:90014042889:web:9bd34a618f857e9cb521d8",
    measurementId: "G-C8MVQS95DF"
  };

  // Wait for Firebase SDK to load, then initialize
  function initFirebase() {
    if (typeof firebase === 'undefined') {
      console.warn('[Edit Mode] Firebase SDK not loaded');
      return;
    }

    const app = firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();

    // Expose auth for edit-mode.js
    window.EDIT_MODE_AUTH = {
      auth: auth,
      signIn: function(email, password) {
        return auth.signInWithEmailAndPassword(email, password);
      },
      signOut: function() {
        return auth.signOut();
      },
      onAuthStateChanged: function(callback) {
        return auth.onAuthStateChanged(callback);
      }
    };

    // Dispatch event to notify edit-mode.js that auth is ready
    window.dispatchEvent(new Event('firebase-auth-ready'));
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebase);
  } else {
    initFirebase();
  }
})();
