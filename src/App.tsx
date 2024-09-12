import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import TopNavBar from './components/TopNavBar';
import HomePage from './pages/HomePage';
import AddPost from './components/AddPost';
import Profile from './components/Profile';
import SharedPost from './components/SharedPost';

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <TopNavBar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/add-post" element={<AddPost />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/post/:postId" element={<SharedPost />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
