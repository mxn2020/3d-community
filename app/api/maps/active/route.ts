// app/api/maps/active/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db';
import { MapService } from '@/lib/services/map-service';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const mapService = new MapService(supabase);
    
    const activeMap = await mapService.getActiveMap();
    
    return NextResponse.json(activeMap);
  } catch (error) {
    console.error('Error fetching active map:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active map' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    const supabase = await createSupabaseServerClient();
    const mapService = new MapService(supabase);
    
    await mapService.setMapActive(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting active map:', error);
    return NextResponse.json(
      { error: 'Failed to set active map' },
      { status: 500 }
    );
  }
}

