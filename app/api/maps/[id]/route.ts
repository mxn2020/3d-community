// app/api/maps/[id]/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db';
import { MapService } from '@/lib/services/map-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createSupabaseServerClient();
    const mapService = new MapService(supabase);
    
    const map = await mapService.getMapById(id);
    
    if (!map) {
      return NextResponse.json(
        { error: 'Map not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(map);
  } catch (error) {
    const { id } = await params;
    console.error(`Error fetching map ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch map' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const mapData = await request.json();
    
    // Ensure the ID in the path matches the ID in the body
    mapData.id = id;
    
    const supabase = await createSupabaseServerClient();
    const mapService = new MapService(supabase);
    
    const updatedMap = await mapService.saveMap(mapData);
    
    return NextResponse.json(updatedMap);
  } catch (error) {
    console.error(`Error updating map ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update map' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createSupabaseServerClient();
    const mapService = new MapService(supabase);
    
    await mapService.deleteMap(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting map ${id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete map' },
      { status: 500 }
    );
  }
}

