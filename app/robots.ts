import { MetadataRoute } from 'next'
import { getHost } from './lib/utils'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getHost()
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}