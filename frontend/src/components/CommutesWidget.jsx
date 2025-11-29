import { useEffect, useRef, useState } from 'react'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

const CommutesWidget = ({ userLocation }) => {
  const iframeRef = useRef(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError('Google Maps API key is required')
      setLoading(false)
      return
    }

    if (!iframeRef.current) return

    const center = userLocation 
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : { lat: 3.1390, lng: 101.6869 } // Default: Kuala Lumpur

    // Create the full HTML page with Commutes widget
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
      font-family: 'Poppins', Arial, sans-serif;
    }
    .commutes {
      align-content: stretch;
      color: #202124;
      display: flex;
      flex-direction: column;
      flex-wrap: wrap;
      height: 100%;
      min-height: 256px;
      min-width: 360px;
      overflow: auto;
      width: 100%;
    }
    .commutes-info {
      flex: 0 0 110px;
      max-width: 100%;
      overflow: hidden;
    }
    .commutes-initial-state {
      border-radius: 8px;
      border: 1px solid #dadce0;
      display: flex;
      height: 98px;
      margin-top: 8px;
      padding: 0 16px;
    }
    .commutes-initial-state svg {
      align-self: center;
    }
    .commutes-initial-state .description {
      align-self: center;
      flex-grow: 1;
      padding: 0 16px;
    }
    .commutes-initial-state .description .heading {
      font: 22px/28px 'Poppins', Arial, sans-serif;
      margin: 0;
    }
    .commutes-initial-state .description p {
      color: #5f6368;
      font: 13px/20px 'Poppins', Arial, sans-serif;
      margin: 0;
    }
    .commutes-initial-state .add-button {
      align-self: center;
      background-color: #1a73e8;
      border-color: #1a73e8;
      border-radius: 4px;
      border-style: solid;
      color: #fff;
      cursor: pointer;
      display: inline-flex;
      fill: #fff;
      padding: 8px 16px 8px 8px;
      white-space: nowrap;
    }
    .commutes-initial-state .add-button .label {
      font: normal 600 15px/24px 'Poppins', Arial, sans-serif;
      padding-left: 8px;
    }
    .commutes-map {
      flex: 1;
      overflow: hidden;
      position: relative;
      width: 100%;
    }
    .commutes-map .map-view {
      background-color: rgb(229, 227, 223);
      height: 100%;
      left: 0;
      position: absolute;
      top: 0;
      width: 100%;
    }
  </style>
</head>
<body>
  <main class="commutes">
    <div class="commutes-map" aria-label="Map">
      <div class="map-view"></div>
    </div>
    <div class="commutes-info">
      <div class="commutes-initial-state">
        <svg aria-label="Directions Icon" width="53" height="53" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M41 20H18.6c-9.5 0-10.8 13.5 0 13.5h14.5C41 33.5 41 45 33 45H17.7" stroke="#D2E3FC" stroke-width="5"></path>
          <path d="M41 22c.2 0 .4 0 .6-.2l.4-.5c.3-1 .7-1.7 1.1-2.5l2-3c.8-1 1.5-2 2-3 .6-1 .9-2.3.9-3.8 0-2-.7-3.6-2-5-1.4-1.3-3-2-5-2s-3.6.7-5 2c-1.3 1.4-2 3-2 5 0 1.4.3 2.6.8 3.6s1.2 2 2 3.2c.9 1 1.6 2 2 2.8.5.9 1 1.7 1.2 2.7l.4.5.6.2Zm0-10.5c-.7 0-1.3-.2-1.8-.7-.5-.5-.7-1.1-.7-1.8s.2-1.3.7-1.8c.5-.5 1.1-.7 1.8-.7s1.3.2 1.8.7c.5.5.7 1.1.7 1.8s-.2 1.3-.7 1.8c-.5.5-1.1.7-1.8.7Z" fill="#185ABC"></path>
          <path d="m12 32-8 6v12h5v-7h6v7h5V38l-8-6Z" fill="#4285F4"></path>
        </svg>
        <div class="description">
          <h1 class="heading">Estimate commute time</h1>
          <p>See travel time and directions for places nearby</p>
        </div>
        <button class="add-button" autofocus>
          <svg aria-label="Add Icon" width="24px" height="24px" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0h24v24H0V0z" fill="none"/>
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          <span class="label">Add destination</span>
        </button>
      </div>
    </div>
  </main>
  <script>
    const center = ${JSON.stringify(center)};
    const apiKey = ${JSON.stringify(GOOGLE_MAPS_API_KEY)};
    const CONFIGURATION = {
      "defaultTravelMode": "DRIVING",
      "distanceMeasurementType": "METRIC",
      "initialDestinations": [],
      "mapOptions": {
        "center": center,
        "fullscreenControl": true,
        "mapTypeControl": false,
        "streetViewControl": false,
        "zoom": 14,
        "zoomControl": true,
        "maxZoom": 20,
        "mapId": ""
      },
      "mapsApiKey": apiKey
    };
    
    let initAttempts = 0;
    const maxAttempts = 10;
    
    function initMap() {
      initAttempts++;
      if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
        // Wait a bit more for Commutes class to be available
        setTimeout(() => {
          if (typeof Commutes !== 'undefined') {
            try {
              new Commutes(CONFIGURATION);
              console.log('Commutes widget initialized successfully');
            } catch (err) {
              console.error('Error initializing Commutes widget:', err);
              if (initAttempts < maxAttempts) {
                setTimeout(initMap, 500);
              }
            }
          } else {
            console.log('Commutes class not yet available, attempt', initAttempts);
            if (initAttempts < maxAttempts) {
              setTimeout(initMap, 500);
            } else {
              console.error('Commutes class not found after', maxAttempts, 'attempts');
            }
          }
        }, 100);
      } else {
        console.log('Google Maps API not yet loaded, attempt', initAttempts);
        if (initAttempts < maxAttempts) {
          setTimeout(initMap, 500);
        }
      }
    }
    
    // Load Google Maps API with Commutes widget
    const script = document.createElement('script');
    script.src = \`https://maps.googleapis.com/maps/api/js?key=\${apiKey}&callback=initMap&libraries=places,geometry&solution_channel=GMP_QB_commutes_v3_c\`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
    };
    document.head.appendChild(script);
  </script>
</body>
</html>`

    // Create blob URL and set as iframe source
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    iframeRef.current.src = url
    setLoading(false)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [userLocation])

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full rounded-lg overflow-hidden shadow-md relative bg-gray-100 flex items-center justify-center" style={{ minHeight: '600px' }}>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-6 py-4 rounded-lg text-sm max-w-md mx-4">
          <p className="font-semibold mb-2">⚠️ Google Maps API Key Required</p>
          <p className="text-xs mb-2">
            Add your Google Maps API key to <code className="bg-yellow-200 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> in your <code className="bg-yellow-200 px-1 rounded">.env</code> file.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-md relative" style={{ minHeight: '600px' }}>
      <iframe
        ref={iframeRef}
        style={{ width: '100%', height: '100%', minHeight: '600px', border: 'none' }}
        title="Commutes Widget"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        onLoad={() => setLoading(false)}
      />
      {loading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Commutes widget...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm z-10">
          <p className="font-semibold">⚠️ Error</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}

export default CommutesWidget
