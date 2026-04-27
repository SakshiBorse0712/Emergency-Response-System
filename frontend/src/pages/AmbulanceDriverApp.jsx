import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { io } from 'socket.io-client';
import MapComponent from '../components/MapComponent';
import { Truck, LogOut, Navigation, CheckCircle } from 'lucide-react';

const AmbulanceDriverApp = () => {
  const { user, logout } = useAuth();
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('offline');
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
    
    // Fetch initial profile
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`, config).then(res => {
      if(res.data.ambulanceDetails) setStatus(res.data.ambulanceDetails.status);
    });

    // Fetch active emergencies
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/emergency`, config).then(res => {
      if(res.data.length > 0) setActiveEmergency(res.data[0]); // Ambulance usually has 1 active
    });

    // Setup Socket
    const newSocket = io(import.meta.env.VITE_BACKEND_URL);
    setSocket(newSocket);

    // Watch location
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(coords);
        
        // Emitting live location
        if(newSocket && activeEmergency) {
          newSocket.emit('ambulance_location_update', {
            emergencyId: activeEmergency._id,
            location: coords
          });
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );

    return () => {
      newSocket.close();
      navigator.geolocation.clearWatch(watchId);
    };
  }, [activeEmergency]);

  const toggleStatus = async () => {
    const newStatus = status === 'available' ? 'offline' : 'available';
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/resource/ambulance`, { status: newStatus }, config);
      setStatus(newStatus);
    } catch (e) {
      alert("Failed to update status");
    }
  };

  const updateEmergencyStatus = async (newStatus) => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/emergency/${activeEmergency._id}/status`, { status: newStatus }, config);
      setActiveEmergency(prev => ({ ...prev, status: newStatus }));
      
      if(socket) {
        socket.emit('emergency_status_update', { emergencyId: activeEmergency._id, status: newStatus });
      }

      if(newStatus === 'completed') {
        setActiveEmergency(null);
        setStatus('available'); // Auto back to available
      }
    } catch (e) {
      alert("Failed to update emergency status");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <nav className="bg-yellow-600 text-white p-4 shadow-md flex justify-between items-center z-10">
        <h1 className="text-xl font-bold flex items-center"><Truck className="mr-2" /> Driver App</h1>
        <div className="flex items-center space-x-4">
           <button onClick={toggleStatus} className={`px-3 py-1 rounded text-sm font-semibold ${status === 'available' ? 'bg-green-500' : 'bg-gray-500'}`}>
             {status.toUpperCase()}
           </button>
           <button onClick={logout} className="p-1 hover:bg-yellow-700 rounded"><LogOut className="w-5 h-5" /></button>
        </div>
      </nav>

      <div className="flex-1 relative">
        {location ? (
          <MapComponent 
            center={location} 
            markers={activeEmergency?.hospital ? [{
              position: { lat: activeEmergency.hospital.location.coordinates[1], lng: activeEmergency.hospital.location.coordinates[0] },
              title: "Hospital"
            }] : []} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">Locating...</div>
        )}

        {/* Dashboard Overlay */}
        {activeEmergency && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-11/12 max-w-md bg-white p-6 rounded-2xl shadow-2xl border-t-4 border-blue-500">
            <h3 className="font-bold text-xl text-gray-800 mb-2">Active Mission</h3>
            <p className="text-sm text-gray-600 mb-4">Patient: {activeEmergency.patient?.name} ({activeEmergency.patient?.phone})</p>
            
            <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm">
              <span className="font-semibold block text-gray-700 mb-1">Destination:</span>
              {activeEmergency.hospital?.address}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {activeEmergency.status === 'assigned' && (
                <button onClick={() => updateEmergencyStatus('en_route')} className="flex items-center justify-center py-3 bg-blue-600 text-white font-semibold rounded-lg col-span-2">
                  <Navigation className="w-5 h-5 mr-2" /> Start Journey
                </button>
              )}
              {activeEmergency.status === 'en_route' && (
                <button onClick={() => updateEmergencyStatus('arrived')} className="flex items-center justify-center py-3 bg-yellow-500 text-white font-semibold rounded-lg col-span-2">
                  Arrived at Patient
                </button>
              )}
              {activeEmergency.status === 'arrived' && (
                <button onClick={() => updateEmergencyStatus('completed')} className="flex items-center justify-center py-3 bg-green-600 text-white font-semibold rounded-lg col-span-2">
                  <CheckCircle className="w-5 h-5 mr-2" /> Complete Mission
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AmbulanceDriverApp;
