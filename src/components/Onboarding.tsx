import React, { useState } from "react";
import { ArrowRight, ArrowLeft, Check, Rocket, User, Settings, Compass, BookOpen, Home, PlusCircle, UserCircle } from "lucide-react";

interface OnboardingProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  onGoogleSignUp: () => void;
  onManualSignUp: (email: string, password: string, name: string) => void;
  onComplete: () => void;
}

export default function Onboarding({ currentStep, setCurrentStep, onGoogleSignUp, onManualSignUp, onComplete }: OnboardingProps) {
  const [signupMethod, setSignupMethod] = useState<"manual" | "google" | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    bio: "",
    interests: [],
  });

  const steps = [
    { title: "Welcome", icon: <Rocket className="w-6 h-6" /> },
    { title: "Account Setup", icon: <User className="w-6 h-6" /> },
    { title: "Profile", icon: <Settings className="w-6 h-6" /> },
    { title: "Feature Tour", icon: <Compass className="w-6 h-6" /> },
    { title: "Getting Started", icon: <BookOpen className="w-6 h-6" /> },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSignup = async (method: "manual" | "google") => {
    setSignupMethod(method);
    if (method === "google") {
      await onGoogleSignUp();
      handleNext(); // Move to the next step after Google sign-up
    }
    // For manual signup, we'll wait for the user to fill the form
  };

  const handleManualSignupSubmit = async () => {
    try {
      await onManualSignUp(formData.email, formData.password, formData.name);
      setCurrentStep(2); // Move to the next step after manual sign-up
    } catch (error) {
      console.error("Error during manual sign-up:", error);
      // The specific error message will be handled in WelcomeScreen.tsx
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Welcome to Our Platform!</h2>
            <p>We're excited to have you on board. Let's get you set up in just a few easy steps.</p>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Account Setup</h2>
            {!signupMethod ? (
              <div className="space-y-4">
                <button onClick={() => handleSignup("manual")} className="w-full bg-blue-500 text-white py-2 px-4 rounded">
                  Sign up manually
                </button>
                <button onClick={() => handleSignup("google")} className="w-full border border-gray-300 py-2 px-4 rounded">
                  Sign up with Google
                </button>
              </div>
            ) : signupMethod === "manual" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block">Name</label>
                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="block">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="block">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a password"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <button onClick={handleManualSignupSubmit} className="w-full bg-blue-500 text-white py-2 px-4 rounded">
                  Create Account
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p>Google sign-in successful!</p>
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Complete Your Profile</h2>
            <div className="space-y-2">
              <label className="block">Select your role</label>
              <div className="space-y-2">
                {["developer", "designer", "manager"].map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={role}
                      name="role"
                      value={role}
                      checked={formData.role === role}
                      onChange={handleInputChange}
                    />
                    <label htmlFor={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="bio" className="block">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="block">Interests</label>
              <div className="space-y-2">
                {["Web Development", "Mobile Apps", "UI/UX Design", "Data Science"].map((interest) => (
                  <div key={interest} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={interest}
                      checked={formData.interests.includes(interest)}
                      onChange={() => handleCheckboxChange(interest)}
                    />
                    <label htmlFor={interest}>{interest}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Feature Tour</h2>
            <p>Let's take a quick tour of our main features:</p>
            <ul className="space-y-4">
              <li className="flex items-start space-x-2">
                <Home className="w-6 h-6 mt-1 flex-shrink-0" />
                <span><strong>Home:</strong> Here you can see everybody's posts</span>
              </li>
              <li className="flex items-start space-x-2">
                <PlusCircle className="w-6 h-6 mt-1 flex-shrink-0" />
                <span><strong>+ icon:</strong> This is where you can create a post</span>
              </li>
              <li className="flex items-start space-x-2">
                <UserCircle className="w-6 h-6 mt-1 flex-shrink-0" />
                <span><strong>Profile:</strong> Here you can see your posts and sign out</span>
              </li>
            </ul>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Getting Started Guide</h2>
            <p>Here are some steps to help you get started:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Complete your profile to personalize your experience</li>
              <li>Explore the home feed to see posts from other users</li>
              <li>Create your first post using the + icon</li>
              <li>Visit your profile to manage your posts and account settings</li>
              <li>Connect with other users by liking and commenting on their posts</li>
            </ol>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className={`flex flex-col items-center ${
              index <= currentStep ? "text-blue-500" : "text-gray-400"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                index < currentStep
                  ? "bg-blue-500 text-white"
                  : index === currentStep
                  ? "border-blue-500"
                  : "border-gray-300"
              }`}
            >
              {index < currentStep ? <Check className="w-6 h-6" /> : step.icon}
            </div>
            <span className="text-sm mt-2">{step.title}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg p-6 shadow-lg">
        {currentStep === steps.length ? (
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Congratulations!</h2>
            <p>You've completed the onboarding process. Welcome aboard!</p>
            <Rocket className="w-16 h-16 mx-auto text-blue-500 animate-bounce" />
            <button onClick={onComplete} className="bg-blue-500 text-white py-2 px-4 rounded">Get Started</button>
          </div>
        ) : (
          renderStepContent()
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0 || currentStep === 1}
          className="bg-gray-300 text-gray-700 py-2 px-4 rounded disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2 inline" /> Previous
        </button>
        {currentStep === 1 && signupMethod === "manual" ? (
          <button onClick={handleManualSignupSubmit} className="bg-blue-500 text-white py-2 px-4 rounded">
            Sign Up
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={currentStep === steps.length || (currentStep === 1 && !signupMethod)}
            className="bg-blue-500 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {currentStep === steps.length - 1 ? "Complete" : "Next"} <ArrowRight className="w-4 h-4 ml-2 inline" />
          </button>
        )}
      </div>
    </div>
  );
}