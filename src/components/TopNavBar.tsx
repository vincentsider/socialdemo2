import React from 'react';
import { Link, useLocation } from "react-router-dom";
import { Home as HomeIcon, User, PlusSquare } from "lucide-react";

const TopNavBar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="top-nav bg-gray-800 text-white p-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold">Everyday Life</Link>
      <div className="flex space-x-4">
        <Link
          to="/"
          className={`flex items-center ${location.pathname === "/" ? "text-blue-400" : ""}`}
        >
          <HomeIcon size={20} className="mr-1" />
          <span>Home</span>
        </Link>
        <Link
          to="/add-post"
          className={`flex items-center ${location.pathname === "/add-post" ? "text-blue-400" : ""}`}
        >
          <PlusSquare size={20} className="mr-1" />
          <span>Add Post</span>
        </Link>
        <Link
          to="/profile"
          className={`flex items-center ${location.pathname === "/profile" ? "text-blue-400" : ""}`}
        >
          <User size={20} className="mr-1" />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
};

export default TopNavBar;