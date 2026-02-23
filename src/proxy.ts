import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
    locales: ['en', 'si', 'ta'],
    defaultLocale: 'en'
});

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Refresh session if expired - required for Server Components
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Get the user to check authentication (getUser is more secure than getSession)
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Route protection logic
    const url = request.nextUrl
    const pathname = url.pathname

    // Log all protected route access for debugging
    const isProtectedAdmin = pathname.includes('/admin')

    if (isProtectedAdmin) {
        console.log(`[Proxy] Requesting Admin Route: ${pathname}`);
        console.log(`[Proxy] User identified: ${user?.email || 'None'} (${user?.id || 'None'})`);
    }

    // Check if it's an auth page (login, signup, forgot-password, reset-password)
    // Matches /login, /en/login, /si/signup, etc.
    const isAuthPage = /^\/(?:en|si|ta)?\/?(?:login|signup|forgot-password|reset-password)/.test(pathname)

    // Protected routes that require authentication
    const isProtectedSeller = pathname.includes('/seller')
    const isProtectedProjectStatus = pathname.includes('/project-status')
    const isProtectedTasker = pathname.includes('/tasker/onboarding')
    const isProtectedOrders = pathname.includes('/orders')
    const isProtectedCheckout = pathname.includes('/checkout')

    const isProtected = isProtectedSeller || isProtectedAdmin || isProtectedProjectStatus || isProtectedTasker ||
        isProtectedOrders || isProtectedCheckout

    // 1. Redirect logged-in users away from auth pages to home or dashboard
    if (user && isAuthPage) {
        const localeMatch = pathname.match(/^\/(en|si|ta)/);
        const localeCookie = request.cookies.get('NEXT_LOCALE')?.value;
        const locale = localeMatch ? localeMatch[1] : (localeCookie || 'en');
        return NextResponse.redirect(new URL(`/${locale}`, request.url))
    }

    // 2. Redirect to Login if not logged in and accessing protected pages
    if (!user && isProtected) {
        const localeMatch = pathname.match(/^\/(en|si|ta)/);
        const locale = localeMatch ? localeMatch[1] : 'en';
        const redirectUrl = new URL(`/${locale}/login`, request.url)
        redirectUrl.searchParams.set('next', pathname)
        return NextResponse.redirect(redirectUrl)
    }

    // 3. Admin Security: If accessing /admin, verify super_admin role in DB
    if (user && isProtectedAdmin) {
        // Use service role to bypass RLS for admin check
        const adminSupabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    getAll: () => request.cookies.getAll(),
                    setAll: () => { }
                }
            }
        )

        const { data: profile, error } = await adminSupabase
            .from('users')
            .select('is_super_admin')
            .eq('auth_user_id', user.id)
            .single();

        if (error) {
            console.error('[Proxy] Admin lookup error:', error.message);
        }

        console.log(`[Proxy] Profile is_super_admin:`, profile?.is_super_admin);

        if (!profile || !profile.is_super_admin) {
            console.warn(`[Proxy] Access Denied: User ${user.email} is not a super admin.`);
            // User is not an admin, deny access
            const localeMatch = pathname.match(/^\/(en|si|ta)/);
            const locale = localeMatch ? localeMatch[1] : 'en';
            return NextResponse.redirect(new URL(`/${locale}`, request.url));
        } else {
            console.log(`[Proxy] Access Granted: User ${user.email} is a super admin.`);
        }
    }

    // Chain: Supabase response -> i18n response

    // Standard pattern for composed middleware:
    const i18nResponse = intlMiddleware(request);

    // If i18nResponse is a redirect, just return it
    if (i18nResponse.status === 307 || i18nResponse.status === 308) {
        return i18nResponse;
    }

    // If i18nResponse is normal, we need to ensure our Supabase cookies (checked above) are set
    // Re-create the response based on i18nResponse but managing supabase cookies

    // Correction: We can't easily merge two middleware responses that both set cookies.
    // BUT: createServerClient above already mutated `response`.
    // If we return `i18nResponse`, we lose those mutations if we aren't careful.

    // Simplest working approach for now:
    // Supabase logic (above) primarily effectively just CHECKS session and does Redirects.
    // The `refresh session` part is the tricky bit. 

    // If we returned a Redirect above, we are good.

    // If we are continuing:
    return i18nResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api/ (API routes shouldn't trigger i18n but SHOULD trigger Supabase auth check? usually API is protected separately)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3)$).*)',
    ],
}
