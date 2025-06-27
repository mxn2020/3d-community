// app/api/maps/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db';
import { MapService } from '@/lib/services/map-service';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const mapService = new MapService(supabase);
    const maps = await mapService.getMaps();
    
    return NextResponse.json(maps);
  } catch (error) {
    console.error('Error fetching maps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maps' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const mapData = await request.json();
    const supabase = await createSupabaseServerClient();
    const mapService = new MapService(supabase);
    
    const savedMap = await mapService.saveMap(mapData);
    
    return NextResponse.json(savedMap);
  } catch (error) {
    console.error('Error creating map:', error);
    return NextResponse.json(
      { error: 'Failed to create map' },
      { status: 500 }
    );
  }
}

