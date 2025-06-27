# Vibe Coder's Community Map Editor

The Vibe Coder's Community Map Editor is an admin tool for designing and managing community map layouts. This tool allows administrators to create interactive maps with various elements like plots, buildings, decorative items, streets, and ground types.

## Features

- **Visual Map Editor**: Drag-and-drop interface for placing map items
- **Multiple Item Types**: Support for plots, buildings, decorative items, streets, and ground elements
- **Layer Management**: Organize and edit map items by category
- **Import/Export**: Save and load map configurations as JSON
- **Live Preview**: See your map changes in real-time
- **Active Map Selection**: Set which map configuration is active for the community

## Database Structure

The map configurations are stored in the `community_maps` table with the following structure:

```sql
CREATE TABLE community_maps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  map_data JSONB NOT NULL, -- Stores the entire map configuration as JSON
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Security

- Only users with the admin role can create or modify maps
- All users can view the active map configuration
- Row-level security policies are in place to enforce these permissions

## How to Use

1. **Creating a Map**:
   - Go to Admin > Maps > Create New Map
   - Design your map using the editor tools
   - Save your map when finished

2. **Editing a Map**:
   - Go to Admin > Maps
   - Click the Edit button on an existing map
   - Make your changes and save

3. **Setting an Active Map**:
   - Go to Admin > Maps
   - Click "Set Active" on the map you want to use
   - Only one map can be active at a time

4. **Previewing a Map**:
   - Go to Admin > Maps
   - Click the Preview button on any map
   - View how the map will appear in the community

## Map Editor Controls

- **Place Tool**: Click to add new items to the map
- **Move Tool**: Click and drag to reposition existing items
- **Delete Tool**: Click on items to remove them
- **Snap to Grid**: Enable for precise placement
- **Zoom**: Adjust the view scale
- **Layers Panel**: Organize and manage map items by category
- **Properties Panel**: Edit map and item details

## Integration with Community View

The community view automatically loads the active map configuration and displays it using Three.js. If no active map is found, it falls back to a default hardcoded layout.

```tsx
// Example of how the map is used in the community view
const { activeMap, isLoading } = useCommunityMap();

return (
  <div>
    {activeMap ? (
      // Render from the map configuration
      activeMap.items.map((item) => renderMapItem(item))
    ) : (
      // Fallback to hardcoded map elements
      <>
        <DefaultGroundElement />
        <DefaultStreets />
        <DefaultBuildings />
      </>
    )}
  </div>
);
```

## Tech Stack

- **Frontend**: Next.js, React, Three.js
- **Backend**: Supabase (PostgreSQL)
- **UI**: Shadcn UI components
- **State Management**: React hooks and context
