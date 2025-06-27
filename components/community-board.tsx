"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, MessageSquare, X, Send } from "lucide-react"
import type { CommunityPost } from "@/lib/types"

// Mock data for demonstration
const MOCK_POSTS: CommunityPost[] = [
  {
    id: "1",
    author: "Fry",
    authorId: "1",
    title: "Welcome to New New York!",
    content: "Hey everyone! Just moved into my new place. Anyone want to grab a Slurm sometime?",
    createdAt: "2 days ago",
    likes: 15,
    comments: [
      {
        id: "1",
        author: "Leela",
        authorId: "2",
        content: "Welcome to the neighborhood! I'd be happy to show you around.",
        createdAt: "1 day ago",
        likes: 3,
      },
      {
        id: "2",
        author: "Bender",
        authorId: "3",
        content: "I'll join if you're buying, meatbag!",
        createdAt: "1 day ago",
        likes: 7,
      },
    ],
  },
  {
    id: "2",
    author: "Professor",
    authorId: "4",
    title: "Community Science Fair",
    content:
      "I'm organizing a science fair next weekend. Bring your inventions, but please, no doomsday devices this time.",
    createdAt: "3 days ago",
    likes: 8,
    comments: [
      {
        id: "3",
        author: "Amy",
        authorId: "6",
        content: "I'll bring my new hover-scooter prototype!",
        createdAt: "2 days ago",
        likes: 2,
      },
    ],
  },
  {
    id: "3",
    author: "Zoidberg",
    authorId: "5",
    title: "Free Medical Advice",
    content: "Offering free medical consultations behind the dumpster. No license, no problem!",
    createdAt: "1 week ago",
    likes: 0,
    comments: [],
  },
]

interface CommunityBoardProps {
  onClose: () => void
}

export function CommunityBoard({ onClose }: CommunityBoardProps) {
  const [posts, setPosts] = useState<CommunityPost[]>(MOCK_POSTS)
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostContent, setNewPostContent] = useState("")
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState("posts")

  const handleLikePost = (postId: string) => {
    setPosts(posts.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post)))
  }

  const handleLikeComment = (postId: string, commentId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.map((comment) =>
                comment.id === commentId ? { ...comment, likes: comment.likes + 1 } : comment,
              ),
            }
          : post,
      ),
    )
  }

  const handleAddComment = (postId: string) => {
    if (!newComment[postId]?.trim()) return

    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                {
                  id: Date.now().toString(),
                  author: "You",
                  authorId: "user",
                  content: newComment[postId],
                  createdAt: "Just now",
                  likes: 0,
                },
              ],
            }
          : post,
      ),
    )

    setNewComment({
      ...newComment,
      [postId]: "",
    })
  }

  const handleAddPost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return

    const newPost: CommunityPost = {
      id: Date.now().toString(),
      author: "You",
      authorId: "user",
      title: newPostTitle,
      content: newPostContent,
      createdAt: "Just now",
      likes: 0,
      comments: [],
    }

    setPosts([newPost, ...posts])
    setNewPostTitle("")
    setNewPostContent("")
    setActiveTab("posts")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader className="relative pb-2 border-b">
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 rounded-full" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="text-2xl text-center">Community Board</CardTitle>
          <CardDescription className="text-center">
            Connect with your neighbors and stay updated on community events
          </CardDescription>
        </CardHeader>

        <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="posts">Community Posts</TabsTrigger>
              <TabsTrigger value="create">Create Post</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="posts" className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`/placeholder.svg?height=32&width=32`} alt={post.author} />
                        <AvatarFallback>{post.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        <CardDescription className="text-xs">
                          Posted by {post.author} • {post.createdAt}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm">{post.content}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-0 pb-2">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1 text-xs"
                        onClick={() => handleLikePost(post.id)}
                      >
                        <Heart className="h-4 w-4" /> {post.likes}
                      </Button>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="h-4 w-4" /> {post.comments.length}
                      </span>
                    </div>
                  </CardFooter>

                  {/* Comments */}
                  {post.comments.length > 0 && (
                    <div className="px-4 pb-2 space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Comments</div>
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="bg-muted/50 p-2 rounded-md">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={`/placeholder.svg?height=24&width=24`} alt={comment.author} />
                              <AvatarFallback>{comment.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">{comment.author}</span>
                            <span className="text-xs text-muted-foreground">• {comment.createdAt}</span>
                          </div>
                          <p className="text-xs mt-1">{comment.content}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-xs h-6 mt-1"
                            onClick={() => handleLikeComment(post.id, comment.id)}
                          >
                            <Heart className="h-3 w-3" /> {comment.likes}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add comment */}
                  <div className="px-4 pb-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a comment..."
                        className="text-xs h-8"
                        value={newComment[post.id] || ""}
                        onChange={(e) =>
                          setNewComment({
                            ...newComment,
                            [post.id]: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddComment(post.id)
                          }
                        }}
                      />
                      <Button size="sm" className="h-8 px-2" onClick={() => handleAddComment(post.id)}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create" className="p-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create a New Post</CardTitle>
                <CardDescription>Share news, events, or just say hello to your neighbors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title
                  </label>
                  <Input
                    id="title"
                    placeholder="Enter a title for your post"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="content" className="text-sm font-medium">
                    Content
                  </label>
                  <Textarea
                    id="content"
                    placeholder="What's on your mind?"
                    rows={5}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleAddPost}>Post to Community</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
