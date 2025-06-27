// app/api/account/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db';
import { UpdateAccountSchema } from '@/lib/types/account-schemas';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getUserAccount } from '@/lib/utils/account';
import { AccountService } from '@/lib/services/account-service';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ prefix: '[API /api/account/me]' });

// GET Current User's Account Details
export async function GET(request: NextRequest) {
    const supabase = await createSupabaseServerClient();

    // Get user and account
    const authResult = await getUserAccount(supabase);

    // Handle non-success cases
    if (authResult.error) {
        if (authResult.status !== 401) {
            logger.error('Auth check failed in GET:', { error: authResult.error, status: authResult.status });
        }
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // User is authenticated, proceed with fetching account details
    const { accountId } = authResult;
    
    if (!accountId) {
        logger.error('Account ID is null after successful auth check');
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    try {
        const accountService = new AccountService(supabase);
        const account = await accountService.getAccount(accountId);
        
        return NextResponse.json(account);
    } catch (error: any) {
        logger.error('Unexpected error in GET /api/account/me:', { message: error?.message, code: error?.code });
        return NextResponse.json({ error: error.message || 'Failed to fetch account details' }, { status: 500 });
    }
}

// PUT Update Current User's Account Details
export async function PUT(request: Request) {
    const cookieStore = cookies();
    const supabase = await createSupabaseServerClient();

    // Get user and account
    const authResult = await getUserAccount(supabase);

    // Handle non-success cases
    if (authResult.error) {
        if (authResult.status !== 401) {
            logger.error('Auth check failed in PUT:', { error: authResult.error, status: authResult.status });
        }
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // User is authenticated, proceed with update
    const { userId, accountId } = authResult;

    if (!userId || !accountId) {
        logger.error('User ID or Account ID is null after successful auth check', { userId, accountId });
        return NextResponse.json({ error: 'User or account not found' }, { status: 404 });
    }

    try {
        const json = await request.json();
        const validatedData = UpdateAccountSchema.parse(json);

        const accountService = new AccountService(supabase);
        const updatedAccount = await accountService.updateAccount(accountId, userId, validatedData);

        return NextResponse.json(updatedAccount);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            logger.warn('Invalid data received for account update:', { errors: error.errors });
            return NextResponse.json({ error: "Invalid input data", details: error.errors }, { status: 400 });
        }

        logger.error('Unexpected error in PUT /api/account/me:', { message: error?.message, code: error?.code });
        return NextResponse.json({ error: error.message || 'Failed to update account' }, { status: 500 });
    }
}

// DELETE Account
export async function DELETE(request: Request) {
    const cookieStore = cookies();
    const supabase = await createSupabaseServerClient();

    // Get user and account
    const authResult = await getUserAccount(supabase);
 
    // Handle non-success cases
    if (authResult.error) {
        if (authResult.status !== 401) {
            logger.error('Auth check failed in DELETE:', { error: authResult.error, status: authResult.status });
        }
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // User is authenticated, proceed with deletion
    const { userId, accountId } = authResult;

    if (!userId || !accountId) {
        logger.error('User ID or Account ID is null after successful auth check', { userId, accountId });
        return NextResponse.json({ error: 'User or account not found' }, { status: 404 });
    }

    try {
        const accountService = new AccountService(supabase);
        await accountService.deleteAccount(accountId, userId);
        
        // Sign the user out
        await supabase.auth.signOut();
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        logger.error('Unexpected error in DELETE /api/account/me:', { message: error?.message, code: error?.code });
        return NextResponse.json({ error: error.message || 'Failed to delete account' }, { status: 500 });
    }
}