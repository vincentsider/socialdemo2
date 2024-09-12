import React, { useRef, useEffect, useState } from 'react';
import { LogOut, MessageSquare, Heart, Share2, Bookmark, Mail, Linkedin, Facebook } from "lucide-react";
import { doc, updateDoc, increment, collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Post } from '../types/Post';

interface Comment {
  id: string;
  text: string;
  userId: string;
  createdAt: Date;
}

interface PostDetailProps {
  post: Post;
  onClose: () => void;
  onUpdate: (updatedPost: Post) => void;
}

const PostDetail: React.FC<PostDetailProps> = ({ post, onClose, onUpdate }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(post.saved || false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;

    if (video && audio) {
      let videoLoopCount = 0;

      const syncAudioVideo = () => {
        if (video.currentTime < video.duration * videoLoopCount) {
          videoLoopCount++;
        }
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

      // Fetch comments
      const commentsQuery = query(
        collection(db, 'posts', post.id, 'comments'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
        const newComments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }) as Comment);
        setComments(newComments);
      });

      return () => {
        video.removeEventListener('play', () => {
          if (audio.paused) audio.play();
        });
        video.removeEventListener('pause', () => audio.pause());
        video.removeEventListener('seeked', syncAudioVideo);
        video.removeEventListener('timeupdate', syncAudioVideo);
        video.removeEventListener('ended', handleVideoEnded);
        unsubscribe();
      };
    }
  }, [post.id, post.videoUrl, post.audioUrl]);

  const handleLike = async () => {
    const newLikeCount = isLiked ? post.likes - 1 : post.likes + 1;
    setIsLiked(!isLiked);
    const postRef = doc(db, 'posts', post.id);
    await updateDoc(postRef, {
      likes: increment(isLiked ? -1 : 1)
    });
    onUpdate({ ...post, likes: newLikeCount });
  };

  const handleSave = async () => {
    setIsSaved(!isSaved);
    const postRef = doc(db, 'posts', post.id);
    await updateDoc(postRef, {
      saved: !isSaved
    });
    onUpdate({ ...post, saved: !isSaved });
  };

  const handleComment = async () => {
    if (commentText.trim()) {
      const postRef = doc(db, 'posts', post.id);
      const commentRef = collection(postRef, 'comments');
      await addDoc(commentRef, {
        text: commentText,
        userId: 'currentUserId', // Replace with actual user ID when auth is implemented
        createdAt: new Date()
      });
      await updateDoc(postRef, {
        comments: increment(1)
      });
      setCommentText('');
      onUpdate({ ...post, comments: post.comments + 1 });
    }
  };

  const handleShare = async (platform?: string) => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    const shareData = {
      title: post.title,
      text: post.text,
      url: shareUrl,
    };

    if (platform) {
      let shareUrl = '';
      switch (platform) {
        case 'whatsapp':
          shareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareData.title}\n${shareData.url}`)}`;
          break;
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}`;
          break;
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`;
          break;
        case 'email':
          shareUrl = `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(`${shareData.text}\n\n${shareData.url}`)}`;
          break;
      }
      window.open(shareUrl, '_blank');
    } else if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      console.log('Web Share API not supported');
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Link copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{post.title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <LogOut className="h-6 w-6" />
            </button>
          </div>
          {post.imageUrl && (
            <img src={post.imageUrl} alt={post.title} className="w-full h-auto object-cover rounded-lg mb-4" />
          )}
          {post.videoUrl && (
            <>
              <video
                ref={videoRef}
                src={post.videoUrl}
                controls
                loop
                className="w-full h-auto rounded-lg mb-4"
              />
              {post.audioUrl && (
                <audio
                  ref={audioRef}
                  src={post.audioUrl}
                  className="hidden"
                />
              )}
            </>
          )}
          <p className="text-gray-800 whitespace-pre-wrap mb-6">{post.text}</p>
          <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
            <div className="flex space-x-4">
              <button onClick={handleLike} className={`flex items-center space-x-1 ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
                <Heart className="h-5 w-5" fill={isLiked ? 'currentColor' : 'none'} />
                <span>{post.likes}</span>
              </button>
              <button className="flex items-center space-x-1 hover:text-blue-500">
                <MessageSquare className="h-5 w-5" />
                <span>{post.comments}</span>
              </button>
            </div>
            <div className="flex space-x-4">
              <button onClick={handleSave} className={`hover:text-yellow-500 ${isSaved ? 'text-yellow-500' : ''}`}>
                <Bookmark className="h-5 w-5" fill={isSaved ? 'currentColor' : 'none'} />
              </button>
              <div className="relative group">
                <button onClick={() => handleShare()} className="hover:text-green-500">
                  <Share2 className="h-5 w-5" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden group-hover:block">
                  <div className="py-1">
                    <button onClick={() => handleShare('whatsapp')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                      Share on WhatsApp
                    </button>
                    <button onClick={() => handleShare('linkedin')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                      Share on LinkedIn
                    </button>
                    <button onClick={() => handleShare('facebook')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                      Share on Facebook
                    </button>
                    <button onClick={() => handleShare('email')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                      Share via Email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Comments</h3>
            <div className="space-y-2 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-100 p-2 rounded">
                  <p className="text-sm">{comment.text}</p>
                  <p className="text-xs text-gray-500">
                    {comment.createdAt.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-2 border rounded-md"
              rows={3}
            />
            <button
              onClick={handleComment}
              className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Post Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;