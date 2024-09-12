import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import axios from "axios";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/card"
import { Label } from "../components/ui/label"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Button } from "../components/ui/button"

import "./LoadingSpinner.css";

const API_BASE_URL = "https://getinference-backend-server-template-getinference.replit.app";

const AddPost: React.FC = () => {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [loadingImageToText, setLoadingImageToText] = useState(false);
  const [loadingVideoToText, setLoadingVideoToText] = useState(false);
  const navigate = useNavigate();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setGeneratedImageUrl(null);

      setLoadingImageToText(true);
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const imageRef = ref(storage, `temp/${user.uid}/${Date.now()}`);
        await uploadBytes(imageRef, file);
        const imageUrl = await getDownloadURL(imageRef);

        const response = await axios.post(
          `${API_BASE_URL}/openai/image-to-text`,
          { imageUrl }
        );
        setTitle(response.data.title);
        setText(response.data.content);
        setGeneratedImageUrl(imageUrl);
      } catch (error) {
        console.error("Error generating text from image:", error);
      } finally {
        setLoadingImageToText(false);
      }
    }
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideo(file);
      setGeneratedVideoUrl(null);
      setAudioUrl(null);

      setLoadingVideoToText(true);
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const videoRef = ref(storage, `temp/${user.uid}/${Date.now()}`);
        await uploadBytes(videoRef, file);
        const videoUrl = await getDownloadURL(videoRef);

        const response = await axios.post(
          `${API_BASE_URL}/openai/video-to-text`,
          { videoUrl }
        );
        setTitle(response.data.description);
        setText(response.data.description);
        setGeneratedVideoUrl(videoUrl);
        setAudioUrl(response.data.audio_url);  // This should now be a valid Firebase Storage URL
      } catch (error) {
        console.error("Error generating text from video:", error);
      } finally {
        setLoadingVideoToText(false);
      }
    }
  };

  const fetchSuggestion = async (title: string) => {
    console.log("Fetching suggestion for title:", title);
    setLoadingText(true);
    try {
      console.log("Making API request to:", `${API_BASE_URL}/openai/text`);
      const response = await axios.post(
        `${API_BASE_URL}/openai/text`,
        { prompt: title },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      console.log("API response:", response.data);
      setText(response.data.response);
    } catch (error) {
      console.error("Error generating post text:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:");
        console.error("Response data:", error.response?.data);
        console.error("Response status:", error.response?.status);
        console.error("Response headers:", error.response?.headers);
      }
      setText("Error generating post text. Please try again.");
    } finally {
      setLoadingText(false);
    }
  };

  const fetchImage = async (prompt: string) => {
    setLoadingImage(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/flux/image`,
        { prompt }
      );
      setGeneratedImageUrl(response.data.image_url);
    } catch (error) {
      console.error("Error generating image:", error);
      setGeneratedImageUrl(null);
    } finally {
      setLoadingImage(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (e.target.value) {
      fetchSuggestion(e.target.value);
    } else {
      setText("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingText(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      let imageUrl = generatedImageUrl || "";
      if (image) {
        const imageRef = ref(storage, `posts/${user.uid}/${Date.now()}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, "posts"), {
        title,
        text,
        imageUrl,
        videoUrl: generatedVideoUrl,
        audioUrl,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      navigate("/");
    } catch (error) {
      console.error("Error adding document: ", error);
    } finally {
      setLoadingText(false);
    }
  };

  const LoadingSpinner = () => (
    <div className="loading-spinner"></div>
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;

    if (video && audio) {
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
  }, [generatedVideoUrl, audioUrl]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-2xl p-6 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create a New Post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Post Title</Label>
            <Input
              id="title"
              value={title}
              onChange={handleTitleChange}
              placeholder="Enter post title"
              readOnly={loadingImageToText || loadingVideoToText}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Post Content</Label>
            <Textarea
              id="content"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Post content will be generated based on the title"
              className="min-h-[100px]"
            />
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fetchSuggestion(title)}
            disabled={loadingText}
          >
            {loadingText ? <LoadingSpinner /> : "Get Another Suggestion"}
          </Button>
          <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            <Input id="image" type="file" onChange={handleImageChange} accept="image/*" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="video">Video</Label>
            <Input id="video" type="file" onChange={handleVideoChange} accept="video/*" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => fetchImage(title)} disabled={loadingImage}>
            {loadingImage ? <LoadingSpinner /> : "Generate Image"}
          </Button>
          <Button onClick={handleSubmit} disabled={loadingText}>
            {loadingText ? <LoadingSpinner /> : "Post"}
          </Button>
        </CardFooter>
      </Card>
      
      {(loadingImageToText || loadingVideoToText) && (
        <div className="mt-4 flex items-center justify-center">
          <LoadingSpinner />
          <span className="ml-2">Processing media...</span>
        </div>
      )}

      {generatedImageUrl && (
        <Card className="w-full max-w-2xl mt-4">
          <CardContent>
            <img src={generatedImageUrl} alt="Generated" className="w-full h-64 object-cover rounded-lg mb-4" />
            <Button
              variant="outline"
              onClick={() => fetchImage(title)}
              disabled={loadingImage}
              className="w-full"
            >
              {loadingImage ? "Loading..." : "Generate Another Image"}
            </Button>
          </CardContent>
        </Card>
      )}

      {generatedVideoUrl && (
        <Card className="w-full max-w-2xl mt-4">
          <CardContent>
            <video 
              ref={videoRef}
              src={generatedVideoUrl} 
              controls 
              loop
              className="w-full h-64 object-cover rounded-lg mb-4" 
            />
            {audioUrl && (
              <audio 
                ref={audioRef}
                src={audioUrl} 
                loop // Add loop to audio as well
                className="hidden" // Hide audio controls
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddPost;