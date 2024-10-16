/* eslint-disable consistent-return */
import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import authConfig from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const url = req.nextUrl.clone();
  const isLoggedIn = !!req.auth;

  if (url.pathname.includes('/api/')) {
    return;
  }

  if (!isLoggedIn && url.pathname !== '/') {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && url.pathname === '/') {
    url.pathname = '/solicitacoes';
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/api', '/(api|trpc)(.*)'],
};
