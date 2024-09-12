import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, MessageSquare, Heart, Share2 } from "lucide-react"

export default function Component() {
  const posts = [
    {
      id: 1,
      content: "Experiencing the daily office grind with a smile! 🖥️ Whether it's working on projects or enjoying a much-needed break with our trusty handheld fan, staying cool and productive has never been this fun. Watch as I juggle work tasks, keep my spirits high, and find simple joys in the little things that make each day worthwhile. #WorkLife #OfficeVibes #StayCool",
      likes: 24,
      comments: 5,
    },
    {
      id: 2,
      content: "Join me on a tranquil ride through the serene countryside. As we navigate these lush green roads, surrounded by quaint gardens and the calm rustle of leaves, experience the peace and simplicity of country living. Take in the vibrant flowers, the charming garden sheds, and the winding paths that lead us through this picturesque journey. Perfect for anyone seeking a moment of relaxation away from the hustle and bustle of city life. 🌳🌸 🚗 #CountrysideDrive #NatureLovers #PeacefulJourney",
      likes: 42,
      comments: 8,
    },
    {
      id: 3,
      content: "Embark on a mesmerizing nocturnal journey that transitions from the bustling city streets to the serene, snow-covered landscapes under a canopy of stars. This video captures the thrilling essence of a high-speed drive through vibrant urban areas, seamlessly transitioning into a tranquil, snow-blanketed highway. Experience the contrast between the dynamic city lights and the serene, glittering night sky, as streaks of stars guide you through ethereal, dreamlike scenes. Join us for this captivating night drive that showcases the beauty of our world in motion, from the heart of the city to the tranquility of snowy backroads. Buckle up and let's explore the magic of night travel together! 🌃 #NightDrive #CityLights #SnowyEscape #TravelVibes #RoadTrip",
      likes: 67,
      comments: 12,
    },
    {
      id: 4,
      image: "/placeholder.svg?height=400&width=600",
      content: "Embark on a mesmerizing night drive through a futuristic cityscape and into a surreal, star-studded snowy wilderness. This breathtaking journey seamlessly transitions from vibrant urban lights to the tranquil and otherworldly charm of snow-covered landscapes under a sky glittering with stars. Watch as the city fades away, replaced by the serene beauty of endless snowy hills and a galaxy of stars streaming by. Buckle up and enjoy the ride!",
      likes: 89,
      comments: 15,
    },
  ]

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <header className="flex justify-between items-center mb-8 bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-lg shadow-lg">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16 border-4 border-white">
            <AvatarImage src="/placeholder.svg?height=64&width=64" alt="Profile picture" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-white">Your Profile</h1>
            <p className="text-sm text-white opacity-80">@yourusername</p>
          </div>
        </div>
        <Button variant="secondary" className="hover:bg-white hover:text-black transition-colors">
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </header>
      <main className="space-y-6">
        {posts.map((post) => (
          <Card key={post.id} className="p-6 shadow-md hover:shadow-lg transition-shadow">
            {post.image && (
              <img
                src={post.image}
                alt="Post image"
                className="w-full h-auto object-cover mb-4 rounded-md"
              />
            )}
            <p className="text-gray-800 whitespace-pre-wrap mb-4">{post.content}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                  <Heart className="h-4 w-4" />
                  <span>{post.likes}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.comments}</span>
                </Button>
              </div>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </main>
    </div>
  )
}