import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.75rem'
};

const MapComponent = ({ center, markers = [], route = null }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={14}
      options={{ disableDefaultUI: true, zoomControl: true }}
    >
      {/* Current Center Marker (Usually User) */}
      <Marker position={center} icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }} />
      
      {/* Other Markers (Hospitals, Ambulances) */}
      {markers.map((marker, index) => (
        <Marker key={index} position={marker.position} icon={marker.icon} title={marker.title} />
      ))}

      {/* Route Polyline if provided */}
      {route && (
        <Polyline
          path={route}
          options={{ strokeColor: '#EF4444', strokeOpacity: 0.8, strokeWeight: 5 }}
        />
      )}
    </GoogleMap>
  ) : <div className="w-full h-full flex items-center justify-center bg-gray-200 animate-pulse rounded-xl">Loading Map...</div>;
};

export default MapComponent;
