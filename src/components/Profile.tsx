import React, { useState, useEffect, useRef } from "react";
import { User } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
// Remove UI component imports
import { LogOut, MessageSquare, Heart, Share2 } from "lucide-react";

interface Post {
  id: string;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  likes: number;
  comments: number;
}

const Profile: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const postsQuery = query(
          collection(db, "posts"),
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc"),
        );

        const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
          const newPosts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Post[];
          setPosts(newPosts);
        });

        return () => unsubscribePosts();
      } else {
        setPosts([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const PostMedia: React.FC<{ post: Post }> = ({ post }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
      const video = videoRef.current;
      const audio = audioRef.current;

      if (video && audio) {
        video.playbackRate = 0.5; // Slow down video to 50%

        let videoLoopCount = 0;

        const syncAudioVideo = () => {
          if (video.currentTime < video.duration * videoLoopCount) {
            // Video has looped
            videoLoopCount++;
          }
          // Don't adjust audio time, let it play continuously
        };

        const handleVideoEnded = () => {
          videoLoopCount++;
          video.play();
        };

        video.addEventListener('play', () => {
          if (audio.paused) audio.play();
        });
        video.addEventListener('pause', () => audio.pause());
        video.addEventListener('seeked', syncAudioVideo);
        video.addEventListener('timeupdate', syncAudioVideo);
        video.addEventListener('ended', handleVideoEnded);

        return () => {
          video.removeEventListener('play', () => {
            if (audio.paused) audio.play();
          });
          video.removeEventListener('pause', () => audio.pause());
          video.removeEventListener('seeked', syncAudioVideo);
          video.removeEventListener('timeupdate', syncAudioVideo);
          video.removeEventListener('ended', handleVideoEnded);
        };
      }
    }, [post.videoUrl, post.audioUrl]);

    if (post.imageUrl) {
      return (
        <img
          src={post.imageUrl}
          alt="Post image"
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

  if (!user) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <h2 className="text-2xl font-bold mb-4 text-center">Profile</h2>
        <p>Please sign in to view your profile.</p>
        <button
          onClick={() => navigate("/signin")}
          className="mt-4"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <header className="flex justify-between items-center mb-8 bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-lg shadow-lg">
        <div className="flex items-center space-x-4">
          <img
            src={user.photoURL || "/placeholder.svg?height=64&width=64"}
            alt="Profile picture"
            className="h-16 w-16 border-4 border-white rounded-full"
          />
          <div>
            <h1 className="text-3xl font-bold text-white">Your Profile</h1>
            <p className="text-sm text-white opacity-80">@{user.displayName || "username"}</p>
          </div>
        </div>
        <button
          className="bg-white text-black hover:bg-gray-200 transition-colors py-2 px-4 rounded"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4 inline" /> Sign Out
        </button>
      </header>
      <main className="space-y-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white shadow-md hover:shadow-lg transition-shadow p-6 rounded-lg"
          >
            <PostMedia post={post} />
            <p className="text-gray-800 whitespace-pre-wrap my-4">{post.text}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <div className="flex space-x-4">
                <button
                  className="flex items-center space-x-1"
                >
                  <Heart className="h-4 w-4" />
                  <span>{post.likes}</span>
                </button>
                <button
                  className="flex items-center space-x-1"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.comments}</span>
                </button>
              </div>
              <button>
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default Profile;
