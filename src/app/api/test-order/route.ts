import { NextResponse } from 'next/server';
import { getOrder } from '@/app/actions/orders';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' });

    try {
        const data = await getOrder(id);
        return NextResponse.json({ data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message, stack: err.stack });
    }
}
