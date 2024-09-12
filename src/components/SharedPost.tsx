import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import PostDetail from './PostDetail';
import { Post } from '../types/Post';

const SharedPost: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (postId) {
        const postDoc = await getDoc(doc(db, 'posts', postId));
        if (postDoc.exists()) {
          const postData = postDoc.data();
          setPost({
            id: postDoc.id,
            ...postData,
            likes: postData.likes || 0,  // Provide default value if not present
            comments: postData.comments || 0  // Provide default value if not present
          } as Post);
        }
      }
    };

    fetchPost();
  }, [postId]);

  if (!post) {
    return <div>Loading...</div>;
  }

  const handleUpdatePost = (updatedPost: Post) => {
    setPost({ ...post!, ...updatedPost });
  };

  return (
    <div className="shared-post">
      <PostDetail
        post={post}
        onClose={() => {}} // No-op for shared posts
        onUpdate={handleUpdatePost}
      />
    </div>
  );
};

export default SharedPost;