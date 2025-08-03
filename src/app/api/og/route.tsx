import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { SITE_NAME, SITE_DESCRIPTION } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || SITE_NAME
    const description = searchParams.get('description') || SITE_DESCRIPTION
    const type = searchParams.get('type') || 'default'

    // Different icons/styles based on type
    const getIcon = (type: string) => {
      switch (type) {
        case 'dashboard':
          return (
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
          )
        case 'auth':
          return (
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
          )
        default:
          return null
      }
    }

    const gradientColor = type === 'auth' ? 
      'linear-gradient(135deg, #34d399 0%, #10b981 100%)' :
      'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%)'

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
          {/* Background pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `radial-gradient(circle at 25% 25%, #334155 1px, transparent 1px),
                                radial-gradient(circle at 75% 75%, #334155 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
              opacity: 0.3,
            }}
          />
          
          {/* Main content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              zIndex: 1,
              maxWidth: '900px',
              padding: '0 60px',
            }}
          >
            {/* Icon */}
            {getIcon(type) && (
              <div style={{ marginBottom: '32px' }}>
                {getIcon(type)}
              </div>
            )}
            
            <h1
              style={{
                fontSize: type === 'default' ? '72px' : '64px',
                fontWeight: 'bold',
                marginBottom: '24px',
                background: gradientColor,
                backgroundClip: 'text',
                color: 'transparent',
                lineHeight: 1.1,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: type === 'default' ? '32px' : '28px',
                fontWeight: 400,
                color: '#cbd5e1',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {description}
            </p>
          </div>
          
          {/* Bottom accent */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '8px',
              background: type === 'auth' ? 
                'linear-gradient(90deg, #10b981 0%, #059669 100%)' :
                'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e) {
    console.log(`${e instanceof Error ? e.message : 'Unknown error'}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}