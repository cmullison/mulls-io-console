import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Dashboard - Mulls.io Console'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Dashboard icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '24px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                background: 'white',
                borderRadius: '8px',
                display: 'flex',
                flexWrap: 'wrap',
                padding: '8px',
                gap: '4px',
              }}
            >
              <div style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '2px' }} />
              <div style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '2px' }} />
              <div style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '2px' }} />
              <div style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '2px' }} />
            </div>
          </div>
        </div>
        
        <h1
          style={{
            fontSize: '64px',
            fontWeight: 'bold',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            lineHeight: 1.1,
          }}
        >
          Dashboard
        </h1>
        <p
          style={{
            fontSize: '28px',
            fontWeight: 400,
            color: '#cbd5e1',
            margin: 0,
          }}
        >
          Monitor and configure your Mulls.io services
        </p>
      </div>
    ),
    {
      ...size,
    }
  )
}