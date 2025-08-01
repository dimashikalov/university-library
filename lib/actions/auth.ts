'use server';

import { signIn } from '@/auth';
import { db } from '@/database/drizzle';
import { users } from '@/database/schema';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import ratelimit from '@/lib/ratelimit';
import { redirect } from 'next/navigation';
import { workflowClient } from '@/lib/workflow';
import config from '@/lib/config';

const handlerTooFast = async () => {
  const ip = (await headers()).get('x-forwarded-for') || '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) return redirect('/too-fast');
};

export const signInWithCredentials = async (
  params: Pick<AuthCredentials, 'email' | 'password'>
) => {
  const { email, password } = params;

  // const ip = (await headers()).get('x-forwarded-for') || '127.0.0.1';
  // const { success } = await ratelimit.limit(ip);

  // if (!success) return redirect('/too-fast');
  await handlerTooFast();

  try {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Signin error' };
  }
};

export const signUp = async (params: AuthCredentials) => {
  const { email, fullName, password, universityCard, universityId } = params;

  // const ip = (await headers()).get('x-forwarded-for') || '127.0.0.1';
  // const { success } = await ratelimit.limit(ip);

  // if (!success) return redirect('/too-fast');
  await handlerTooFast();

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return { success: false, error: 'User already exists' };
  }

  const hashedPassword = await hash(password, 10);

  try {
    await db.insert(users).values({
      fullName,
      email,
      universityId,
      password: hashedPassword,
      universityCard,
    });

    await workflowClient.trigger({
      url: `${config.env.prodApiEndpoint}/api/workflow/onboarding`,
      body: {
        email,
        fullName,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    await signInWithCredentials({ email, password });
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Signup error' };
  }
};
