import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MapComponent from '../components/MapComponent';
import { AlertCircle, Phone, Navigation } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

const PatientApp = () => {
  const { user, logout } = useAuth();
  const [location, setLocation] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [ambulanceLoc, setAmbulanceLoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => console.error("Error getting location", error)
      );
    }

    // Connect Socket
    const newSocket = io(import.meta.env.VITE_BACKEND_URL);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket && activeRequest) {
      socket.emit('join_room', activeRequest._id);
      
      socket.on('receive_ambulance_location', (data) => {
        setAmbulanceLoc(data.location);
      });
      
      socket.on('receive_status_update', (data) => {
        setActiveRequest(prev => ({ ...prev, status: data.status }));
        if (data.status === 'assigned') {
          setNotification("Hospital & Ambulance have been assigned! They are on their way.");
        }
      });
    }
  }, [socket, activeRequest]);

  const handleSOS = async () => {
    if (!location) return alert("Please allow location access or set a mock location to use SOS.");
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/emergency/sos`,
        { longitude: location.lng, latitude: location.lat, emergencyType: 'critical' },
        config
      );
      setActiveRequest(data.emergencyRequest);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to trigger SOS");
    }
    setLoading(true); // Keep loading state until a few seconds after or status changes
    setTimeout(() => setLoading(false), 2000);
  };

  const setMockLocation = () => {
    const lng = prompt("Enter Mock Longitude (e.g. 0):", "0");
    const lat = prompt("Enter Mock Latitude (e.g. 0):", "0");
    if (lng && lat) {
      setLocation({ lng: parseFloat(lng), lat: parseFloat(lat) });
    }
  };

  const mapMarkers = [];
  if (activeRequest?.hospital?.location) {
    mapMarkers.push({
      position: { lat: activeRequest.hospital.location.coordinates[1], lng: activeRequest.hospital.location.coordinates[0] },
      title: "Assigned Hospital",
      icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }
    });
  }
  if (ambulanceLoc) {
    mapMarkers.push({
      position: ambulanceLoc,
      title: "Ambulance",
      icon: { url: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png' }
    });
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center z-10">
        <h1 className="text-xl font-bold flex items-center"><AlertCircle className="mr-2" /> RescueConnect</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">{user?.name}</span>
          <button onClick={logout} className="text-sm bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded">Logout</button>
        </div>
      </header>

      {notification && (
        <div className="bg-blue-600 text-white p-3 text-center animate-pulse relative z-20">
          {notification}
          <button onClick={() => setNotification(null)} className="absolute right-4 font-bold">X</button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 relative">
        {location ? (
          <MapComponent center={location} markers={mapMarkers} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200">
            <p className="text-gray-500 mb-4">Waiting for location access...</p>
            <button onClick={setMockLocation} className="text-sm bg-white px-4 py-2 rounded-lg shadow border hover:bg-gray-50">
              📍 Set Mock Location Manually
            </button>
          </div>
        )}

        {/* Mock Location Toggle */}
        {location && !activeRequest && (
          <button 
            onClick={setMockLocation} 
            className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full shadow-md hover:bg-white z-20"
            title="Update Location"
          >
            <Navigation className="w-5 h-5 text-blue-600" />
          </button>
        )}

        {/* Floating Panel */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-11/12 max-w-md bg-white p-6 rounded-2xl shadow-2xl border border-gray-100">
          {!activeRequest ? (
            <button 
              onClick={handleSOS}
              disabled={loading}
              className={`w-full py-4 text-xl font-bold text-white rounded-xl shadow-lg transition-transform transform active:scale-95 ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/50'}`}
            >
              {loading ? 'Finding Resources...' : '🚨 EMERGENCY SOS'}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-gray-800">Emergency Status</h3>
                <span className="px-3 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full uppercase tracking-wide">
                  {activeRequest.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Navigation className="w-5 h-5 mr-3 text-blue-500" />
                  <div>
                    <p className="font-semibold text-gray-800">Ambulance Assigned</p>
                    <p>{activeRequest.ambulance ? 'On the way' : 'Locating available ambulance...'}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <AlertCircle className="w-5 h-5 mr-3 text-blue-500" />
                  <div>
                    <p className="font-semibold text-gray-800">Destination Hospital</p>
                    <p>{activeRequest.hospital?.address || 'Searching...'}</p>
                  </div>
                </div>
              </div>

              {activeRequest.status === 'completed' && (
                <button onClick={() => setActiveRequest(null)} className="w-full mt-4 py-2 bg-gray-800 text-white rounded-lg">
                  Close Request
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientApp;
