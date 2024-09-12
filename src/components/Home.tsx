import React, { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import PostDetail from "./PostDetail";
import { useNavigate } from "react-router-dom";
import { Post } from "../types/Post";

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const newPosts = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || "Untitled",  // Provide a default title if it's missing
          text: data.text,
          imageUrl: data.imageUrl,
          videoUrl: data.videoUrl,
          audioUrl: data.audioUrl,
          userId: data.userId,
          likes: data.likes || 0,
          comments: data.comments || 0,
          createdAt: data.createdAt?.toDate() || new Date(),  // Convert Firestore Timestamp to Date
        } as Post;
      });
      setPosts(newPosts);
    });

    return () => unsubscribe();
  }, []);

  const PostMedia: React.FC<{ post: Post }> = ({ post }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
      const video = videoRef.current;
      const audio = audioRef.current;

      if (video && audio) {
        video.playbackRate = 0.5; // Set playback rate to 50%

        const handlePlay = () => {
          if (audio.paused) audio.play();
          video.playbackRate = 0.5; // Ensure 50% speed on play
        };

        video.addEventListener('play', handlePlay);

        return () => {
          video.removeEventListener('play', handlePlay);
        };
      }
    }, [post.videoUrl, post.audioUrl]);

    if (post.imageUrl) {
      return (
        <img
          src={post.imageUrl}
          alt={post.title}
          className="w-full h-64 sm:h-80 object-cover rounded-t-lg"
        />
      );
    } else if (post.videoUrl) {
      return (
        <>
          <video
            ref={videoRef}
            src={post.videoUrl}
            controls
            loop
            className="w-full h-64 sm:h-80 object-cover rounded-t-lg"
          />
          {post.audioUrl && (
            <audio
              ref={audioRef}
              src={post.audioUrl}
              className="hidden"
            />
          )}
        </>
      );
    }
    return null;
  };

  const truncateTitle = (title: string | undefined, maxLength: number) => {
    if (!title) return "Untitled";  // Return a default value if title is undefined
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
  };

  const handleClosePostDetail = () => {
    setSelectedPost(null);
  };

  const handleUpdatePost = (updatedPost: Post) => {
    setPosts(posts.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
    setSelectedPost(updatedPost);
  };

  const handleLike = () => {
    // Implement like functionality
    console.log("Like clicked");
  };

  const handleSave = () => {
    // Implement save functionality
    console.log("Save clicked");
  };

  const handleShare = () => {
    // You can implement analytics or any other logic here
    console.log("Post shared");
  };

  const handleGetStarted = () => {
    navigate('/add-post');
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <div className="hero bg-gradient-to-r from-blue-500 to-purple-600 text-white py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">Everyday Life, Uniquely Narrated</h1>
        <p className="text-lg sm:text-xl mb-8">
          Experience the magic of the ordinary as our app transforms daily moments into captivating stories. 
          With entertaining and humorous voiceovers, we bring a fresh and delightful perspective to the everyday, 
          making each moment unforgettable.
        </p>
        <button 
          className="bg-white text-blue-500 font-semibold py-2 px-4 rounded shadow-md hover:bg-gray-100"
          onClick={handleGetStarted}
        >
          Get Started
        </button>
      </div>

      {/* Posts Section */}
      <div className="posts py-16 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Recent Posts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {posts.map((post) => (
            <div 
              key={post.id} 
              className="post bg-white shadow-lg rounded-lg overflow-hidden cursor-pointer"
              onClick={() => handlePostClick(post)}
            >
              <PostMedia post={post} />
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{truncateTitle(post.title, 50)}</h3>
                <p className="text-gray-600 text-sm line-clamp-3">{post.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="footer bg-gray-800 text-white py-6 text-center">
        <p>&copy; 2024 Our App. All rights reserved.</p>
      </footer>

      {selectedPost && (
        <PostDetail
          post={selectedPost}
          onClose={handleClosePostDetail}
          onUpdate={handleUpdatePost}
        />
      )}
    </div>
  );
};

export default Home;