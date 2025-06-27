export type HouseType =
  | "type1"
  | "type2"
  | "type3"
  | "type4"
  | "type5"
  | "type6"
  | "type7"
  | "type8"
  | "type9"
  | "type10"
  | "type11"
  | "type12"
  | "type13"
  | "type14"
  | "type15"
  | "type16"
  | "type17"
  | "type18"
  | "type19"
  | "type20"
  // Simpsons house types
  | "simpson1"
  | "simpson2"
  | "simpson3"
  | "simpson4"
  | "simpson5"
  | "simpson6"
  | "simpson7"
  | "simpson8"
  // Marvel Avengers house types
  | "avenger1"
  | "avenger2"
  | "avenger3"
  | "avenger4"
  | "avenger5"
  | "avenger6"
  | "avenger7"
  | "avenger8"

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  socialLinks?: {
    website?: string
    twitter?: string
    github?: string
  }
  level: number
  points: number
}

export interface Plot {
  id: string
  position: [number, number, number]
  owner?: string
  houseType?: HouseType
  houseColor?: string
}

export interface Community {
  id: string
  name: string
  plots: Plot[]
}

export interface PlotData {
  id: string;
  position: [number, number, number]; // Or separate x, y, z fields from DB
  ownerId: string | null;
  houseType: string | null;
  houseColor: string | null;
  likesCount: number | null;
  // Add fields needed for ProfileCard if owner_id is present:
  ownerName?: string; // Fetch this via join or separate query
  ownerLevel?: number; // Fetch this
  ownerAvatarUrl?: string; // Fetch this
}

export interface CommunityPost {
  id: string
  author: string
  authorId: string
  title: string
  content: string
  createdAt: string
  likes: number
  comments: Comment[]
}

export interface Comment {
  id: string
  author: string
  authorId: string
  content: string
  createdAt: string
  likes: number
}

export interface FeatureRequest {
  id: string
  author: string
  authorId: string
  title: string
  description: string
  createdAt: string
  upvotes: number
  downvotes: number
  status: "pending" | "approved" | "rejected" | "implemented"
}
