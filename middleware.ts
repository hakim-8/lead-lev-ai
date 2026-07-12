import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define the routes that REQUIRE authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)", // Matches /dashboard and any sub-routes like /dashboard/settings
]);

export default clerkMiddleware(async (auth, req) => {
  // If the incoming request matches the protected route criteria, enforce auth
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
