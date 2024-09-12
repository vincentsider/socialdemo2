import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Onboarding from "./Onboarding";

const WelcomeScreen: React.FC = () => {
  const [isNewUser, setIsNewUser] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().onboardingCompleted) {
          setIsNewUser(false);
          navigate("/"); // Redirect to the main page
        } else {
          setIsNewUser(true);
        }
      }
    };

    const unsubscribe = auth.onAuthStateChanged(checkUser);
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Store user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName,
        email: user.email,
        onboardingCompleted: false,
      });

      setCurrentStep(2); // Move to the next step after sign-up
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const handleManualSignUp = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        onboardingCompleted: false,
      });

      setCurrentStep(2); // Move to the next step after sign-up
    } catch (error) {
      console.error("Error signing up:", error);
      // Provide more specific error messages to the user
      if (error.code === 'auth/email-already-in-use') {
        alert('This email is already in use. Please try a different email or sign in.');
      } else if (error.code === 'auth/weak-password') {
        alert('The password is too weak. Please choose a stronger password.');
      } else {
        alert('An error occurred during sign-up. Please try again later.');
      }
    }
  };

  const handleOnboardingComplete = async () => {
    const user = auth.currentUser;
    if (user) {
      await setDoc(doc(db, "users", user.uid), { onboardingCompleted: true }, { merge: true });
    }
    setIsNewUser(false);
    navigate("/"); // Redirect to the main page
  };

  if (isNewUser) {
    return (
      <Onboarding
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        onGoogleSignUp={handleGoogleSignIn}
        onManualSignUp={handleManualSignUp}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // This part should not be shown anymore
  return null;
};

export default WelcomeScreen;