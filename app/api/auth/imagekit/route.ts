import config from '@/lib/config';
import ImageKit from 'imagekit';
import { NextResponse } from 'next/server';

const {
  env: {
    imagekit: { privateKey, publicKey, urlEndpoint },
  },
} = config;

const imagekit = new ImageKit({
  publicKey,
  privateKey,
  urlEndpoint,
});

// export async function GET() {
//   return NextResponse.json(imagekit.getAuthenticationParameters());
// }

export async function GET() {
  const authParams = imagekit.getAuthenticationParameters();

  return new NextResponse(JSON.stringify(authParams), {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', // или конкретный фронтенд-домен
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', // или конкретный фронтенд-домен
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
