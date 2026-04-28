import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { cookies } from 'next/headers';

// Middleware to check admin authentication
async function isAdmin(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  return !!token;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: players, error } = await supabaseServer
      .from('players')
      .select('*')
      .order('name');

    if (error) throw error;

    return NextResponse.json(players);
  } catch (error: any) {
    console.error('Error fetching players:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    // Attempt to delete
    const { error } = await supabaseServer
      .from('players')
      .delete()
      .eq('id', id);

    if (error) {
      // Check for foreign key constraint
      if (error.code === '23503') {
        return NextResponse.json({ 
          error: 'Pemain tidak bisa dihapus karena sedang terdaftar dalam turnamen atau pertandingan. Hapus pendaftaran turnamen terlebih dahulu.' 
        }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting player:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
