import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Sign In - Mulls.io Console'
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
        {/* Lock icon */}
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
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '40px',
                border: '4px solid white',
                borderRadius: '8px 8px 0 0',
                borderBottom: 'none',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '24px',
                  background: 'white',
                  borderRadius: '0 0 4px 4px',
                  position: 'absolute',
                  top: '20px',
                  left: '-4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    background: '#10b981',
                    borderRadius: '50%',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <h1
          style={{
            fontSize: '64px',
            fontWeight: 'bold',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            lineHeight: 1.1,
          }}
        >
          Sign In
        </h1>
        <p
          style={{
            fontSize: '28px',
            fontWeight: 400,
            color: '#cbd5e1',
            margin: 0,
          }}
        >
          Access your Mulls.io Console
        </p>
      </div>
    ),
    {
      ...size,
    }
  )
}