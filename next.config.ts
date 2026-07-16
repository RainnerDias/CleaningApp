import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@fullcalendar/react',
    '@fullcalendar/daygrid',
    '@fullcalendar/timegrid',
    '@fullcalendar/interaction',
    '@fullcalendar/core',
  ],
}

export default nextConfig
