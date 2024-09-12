export interface Post {
  id: string;
  title: string;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  userId: string;
  createdAt: Date;
  likes: number;
  comments: number;
  saved?: boolean;
}