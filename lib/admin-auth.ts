import 'server-only';

import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

/**
 * Returns the list of admin emails from the environment.
 * Falls back to an empty array if ADMIN_EMAILS is not set.
 */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function hasAdminEmail(): Promise<boolean> {
  const user = await currentUser();
  const primaryEmail = user?.emailAddresses
    ?.find((email) => email.id === user.primaryEmailAddressId)
    ?.emailAddress?.toLowerCase();

  return Boolean(primaryEmail && getAdminEmails().includes(primaryEmail));
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  return hasAdminEmail();
}

/**
 * Checks whether the currently signed-in Clerk user is an admin.
 * Call this at the top of every admin server component or route handler.
 * Redirects to sign-in if not authenticated, or to / if not authorised.
 */
export async function requireAdmin(): Promise<void> {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in?redirect_url=/admin');
  }

  if (!(await hasAdminEmail())) {
    redirect('/?error=unauthorized');
  }
}
