import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/admin/',
        '/settings/',
        '/api/',
        '/auth/',
        '/sign-in',
        '/sign-up',
        '/forgot-password',
        '/reset-password',
        '/verify-email',
        '/team-invite',
        '/sso/',
      ],
    },
    sitemap: 'https://console.mulls.io/sitemap.xml',
  }
}