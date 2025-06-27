// components/feedback-center.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, ThumbsDown, X, Plus, Bug, Lightbulb } from "lucide-react"
import type { FeatureRequest } from "@/lib/types"

// Mock data for demonstration
const MOCK_FEATURE_REQUESTS: FeatureRequest[] = [
  {
    id: "1",
    author: "Fry",
    authorId: "1",
    title: "Add hover cars for transportation",
    description: "It would be great if we could have hover cars to travel around the community faster.",
    createdAt: "1 week ago",
    upvotes: 24,
    downvotes: 3,
    status: "pending",
  },
  {
    id: "2",
    author: "Leela",
    authorId: "2",
    title: "Community events calendar",
    description: "We need a shared calendar for community events that everyone can see and add to.",
    createdAt: "2 weeks ago",
    upvotes: 18,
    downvotes: 1,
    status: "approved",
  },
  {
    id: "3",
    author: "Bender",
    authorId: "3",
    title: "Robot-only neighborhood",
    description: "We should have a special neighborhood just for robots. No humans allowed!",
    createdAt: "3 days ago",
    upvotes: 5,
    downvotes: 12,
    status: "rejected",
  },
  {
    id: "4",
    author: "Professor",
    authorId: "4",
    title: "Fix the teleportation bug",
    description: "Sometimes when I teleport to another house, I end up inside a wall. Please fix this!",
    createdAt: "5 days ago",
    upvotes: 15,
    downvotes: 0,
    status: "implemented",
  },
]

interface FeedbackCenterProps {
  onClose: () => void
}

export function FeedbackCenter({ onClose }: FeedbackCenterProps) {
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>(MOCK_FEATURE_REQUESTS)
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [activeTab, setActiveTab] = useState("features")
  const [filter, setFilter] = useState<string>("all")

  const handleUpvote = (id: string) => {
    setFeatureRequests(
      featureRequests.map((request) => (request.id === id ? { ...request, upvotes: request.upvotes + 1 } : request)),
    )
  }

  const handleDownvote = (id: string) => {
    setFeatureRequests(
      featureRequests.map((request) =>
        request.id === id ? { ...request, downvotes: request.downvotes + 1 } : request,
      ),
    )
  }

  const handleAddFeature = () => {
    if (!newTitle.trim() || !newDescription.trim()) return

    const newFeature: FeatureRequest = {
      id: Date.now().toString(),
      author: "You",
      authorId: "user",
      title: newTitle,
      description: newDescription,
      createdAt: "Just now",
      upvotes: 1,
      downvotes: 0,
      status: "pending",
    }

    setFeatureRequests([newFeature, ...featureRequests])
    setNewTitle("")
    setNewDescription("")
    setActiveTab("features")
  }

  const filteredRequests =
    filter === "all" ? featureRequests : featureRequests.filter((request) => request.status === filter)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader className="relative pb-2 border-b">
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 rounded-full" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="text-xl text-center">Feedback & Feature Requests</CardTitle>
          <CardDescription className="text-center">
            Report bugs or suggest new features for our community
          </CardDescription>
        </CardHeader>

        <Tabs defaultValue="features" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="features">
                <Lightbulb className="h-4 w-4 mr-2" />
                Feature Requests
              </TabsTrigger>
              <TabsTrigger value="new">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="features" className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-2 border-b">
              <div className="flex gap-2">
                <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
                  All
                </Button>
                <Button
                  variant={filter === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("pending")}
                >
                  Pending
                </Button>
                <Button
                  variant={filter === "approved" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("approved")}
                >
                  Approved
                </Button>
                <Button
                  variant={filter === "implemented" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("implemented")}
                >
                  Implemented
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="divide-y">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
                    <div key={request.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`/placeholder.svg?height=32&width=32`} alt={request.author} />
                          <AvatarFallback>{request.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{request.title}</h3>
                            <StatusBadge status={request.status} />
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {request.author} • {request.createdAt}
                          </div>
                          <p className="text-sm mb-3">{request.description}</p>
                          <div className="flex items-center gap-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1"
                              onClick={() => handleUpvote(request.id)}
                            >
                              <ThumbsUp className="h-4 w-4" /> {request.upvotes}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1"
                              onClick={() => handleDownvote(request.id)}
                            >
                              <ThumbsDown className="h-4 w-4" /> {request.downvotes}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No feature requests found with the selected filter
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="new" className="p-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submit a New Request</CardTitle>
                <CardDescription>Have an idea for improving our community? Let us know!</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="request-type" className="text-sm font-medium">
                    Request Type
                  </label>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-2">
                      <Bug className="h-4 w-4" /> Bug Report
                    </Button>
                    <Button variant="default" className="flex-1 gap-2">
                      <Lightbulb className="h-4 w-4" /> Feature Request
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title
                  </label>
                  <Input
                    id="title"
                    placeholder="Enter a title for your request"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    placeholder="Describe your feature request or bug report in detail"
                    rows={5}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleAddFeature}>Submit Request</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="text-xs">
          Pending
        </Badge>
      )
    case "approved":
      return (
        <Badge variant="outline" className="bg-blue-500 text-white border-none text-xs">
          Approved
        </Badge>
      )
    case "rejected":
      return (
        <Badge variant="outline" className="bg-red-500 text-white border-none text-xs">
          Rejected
        </Badge>
      )
    case "implemented":
      return (
        <Badge variant="outline" className="bg-green-500 text-white border-none text-xs">
          Implemented
        </Badge>
      )
    default:
      return null
  }
}
