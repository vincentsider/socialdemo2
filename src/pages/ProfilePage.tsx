import React from 'react';

const ProfilePage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">User Profile</h1>
      <div className="bg-white shadow-md rounded p-4">
        <p>Username: [User's name]</p>
        <p>Email: [User's email]</p>
        {/* Add more user details here */}
      </div>
      {/* You can add a list of user's posts or other profile-related content here */}
    </div>
  );
};

export default ProfilePage;