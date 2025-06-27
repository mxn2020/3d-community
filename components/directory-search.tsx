"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, X, MapPin, Home } from "lucide-react"

// Mock data for demonstration
const MOCK_RESIDENTS = [
  {
    id: "1",
    name: "Fry",
    level: 3,
    houseType: "type1",
    position: [0, 0, 0] as [number, number, number],
  },
  {
    id: "2",
    name: "Leela",
    level: 5,
    houseType: "type2",
    position: [5, 0, 2] as [number, number, number],
  },
  {
    id: "3",
    name: "Bender",
    level: 7,
    houseType: "type3",
    position: [-5, 0, -2] as [number, number, number],
  },
  {
    id: "4",
    name: "Professor",
    level: 4,
    houseType: "type4",
    position: [3, 0, -5] as [number, number, number],
  },
  {
    id: "5",
    name: "Zoidberg",
    level: 2,
    houseType: "type5",
    position: [-3, 0, 5] as [number, number, number],
  },
  {
    id: "6",
    name: "Amy",
    level: 6,
    houseType: "type6",
    position: [12, 0, 12] as [number, number, number],
  },
  {
    id: "7",
    name: "Hermes",
    level: 4,
    houseType: "type7",
    position: [-12, 0, -12] as [number, number, number],
  },
  {
    id: "8",
    name: "Scruffy",
    level: 2,
    houseType: "type8",
    position: [12, 0, -12] as [number, number, number],
  },
  {
    id: "9",
    name: "Kif",
    level: 3,
    houseType: "type9",
    position: [-12, 0, 12] as [number, number, number],
  },
  {
    id: "10",
    name: "Nibbler",
    level: 8,
    houseType: "type10",
    position: [20, 0, 0] as [number, number, number],
  },
]

interface DirectorySearchProps {
  onClose: () => void
  onNavigateToHouse: (position: [number, number, number]) => void
}

export function DirectorySearch({ onClose, onNavigateToHouse }: DirectorySearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [residents, setResidents] = useState(MOCK_RESIDENTS)

  const filteredResidents = residents.filter((resident) =>
    resident.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleNavigate = (position: [number, number, number]) => {
    onNavigateToHouse(position)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader className="relative pb-2 border-b">
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 rounded-full" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="text-xl text-center">Community Directory</CardTitle>
          <CardDescription className="text-center">Find and visit your neighbors</CardDescription>
        </CardHeader>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search residents..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <CardContent className="flex-1 overflow-auto p-0">
          <div className="divide-y">
            {filteredResidents.length > 0 ? (
              filteredResidents.map((resident) => (
                <div key={resident.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={`/placeholder.svg?height=40&width=40`} alt={resident.name} />
                        <AvatarFallback>{resident.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{resident.name}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Home className="h-3 w-3" /> House Type {resident.houseType.replace("type", "")}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className="bg-[#FF6B6B] text-white border-none">
                        Level {resident.level}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() => handleNavigate(resident.position)}
                      >
                        <MapPin className="h-3 w-3" /> Visit
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">No residents found matching "{searchTerm}"</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
