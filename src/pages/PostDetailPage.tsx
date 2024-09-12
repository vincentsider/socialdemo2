import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  createdAt: { seconds: number; nanoseconds: number };
  userId: string;
}

const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const postDoc = await getDoc(doc(db, 'posts', id));
        if (postDoc.exists()) {
          setPost({ id: postDoc.id, ...postDoc.data() } as Post);
        } else {
          setError('Post not found');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to fetch post. Please try again later.');
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) return <div>Loading post...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!post) return <div>Post not found</div>;

  const formatDate = (timestamp: { seconds: number; nanoseconds: number }) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <img src={post.imageUrl} alt={post.title} className="w-full max-w-2xl mx-auto mb-4 rounded-lg shadow-lg" />
      <p className="text-gray-700 text-lg mb-4">{post.content}</p>
      <p className="text-sm text-gray-500">Posted on: {formatDate(post.createdAt)}</p>
    </div>
  );
};

export default PostDetailPage;