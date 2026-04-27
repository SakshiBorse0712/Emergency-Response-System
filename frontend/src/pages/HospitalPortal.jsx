import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Activity, BedDouble, Wind, LogOut, Bell } from 'lucide-react';
import { io } from 'socket.io-client';

const HospitalPortal = () => {
  const { user, logout } = useAuth();
  const [resources, setResources] = useState({ beds: 0, icu: 0, oxygen: 0 });
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        
        // Fetch emergencies assigned to this hospital
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/emergency`, config);
        setEmergencies(res.data);
        
        // Fetch current hospital profile for resources
        const profileRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`, config);
        if (profileRes.data.hospitalDetails) {
          setResources(profileRes.data.hospitalDetails.resources);
        }
      } catch (error) {
        console.error("Failed to fetch hospital data");
      }
      setLoading(false);
    };
    fetchData();

    // Setup Socket
    const newSocket = io(import.meta.env.VITE_BACKEND_URL);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket && user?.hospitalDetails) {
      socket.emit('join_room', user.hospitalDetails._id); // Join specific hospital room

      socket.on('new_emergency', (data) => {
        setEmergencies(prev => [data.emergencyRequest, ...prev]);
        setNotification({
          type: 'emergency',
          message: `New Emergency SOS from ${data.emergencyRequest.patient?.name}!`,
          timestamp: new Date()
        });
        
        // Clear notification after 10 seconds
        setTimeout(() => setNotification(null), 10000);
      });
    }
  }, [socket, user]);

  const handleResourceUpdate = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/resource/hospital`, resources, config);
      alert('Resources updated successfully');
    } catch (error) {
      alert('Failed to update resources');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-blue-800 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center"><Activity className="mr-2" /> Hospital Portal</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm">{user?.name}</span>
          <button onClick={logout} className="flex items-center text-sm bg-blue-700 hover:bg-blue-900 px-3 py-1 rounded transition">
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </button>
        </div>
      </nav>

      {/* Real-time Notification Banner */}
      {notification && (
        <div className="bg-red-600 text-white p-4 flex justify-between items-center animate-bounce shadow-lg">
          <div className="flex items-center">
            <Bell className="w-6 h-6 mr-3" />
            <div>
              <p className="font-bold">URGENT NOTIFICATION</p>
              <p>{notification.message}</p>
            </div>
          </div>
          <button onClick={() => setNotification(null)} className="font-bold border border-white px-2 rounded">X</button>
        </div>
      )}

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Resource Management */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Update Resources</h2>
            <form onSubmit={handleResourceUpdate} className="space-y-4">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <BedDouble className="w-4 h-4 mr-2 text-blue-500" /> General Beds
                </label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 focus:ring-blue-500" value={resources.beds} onChange={(e) => setResources({...resources, beds: e.target.value})} />
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <Activity className="w-4 h-4 mr-2 text-blue-500" /> ICU Beds
                </label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 focus:ring-blue-500" value={resources.icu} onChange={(e) => setResources({...resources, icu: e.target.value})} />
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <Wind className="w-4 h-4 mr-2 text-green-500" /> Oxygen Cylinders
                </label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 focus:ring-blue-500" value={resources.oxygen} onChange={(e) => setResources({...resources, oxygen: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">Save Updates</button>
            </form>
          </div>
        </div>

        {/* Right Col: Incoming Emergencies */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Active Emergency Admissions</h2>
            
            {loading ? (
              <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-2 bg-slate-200 rounded"></div><div className="space-y-3"><div className="grid grid-cols-3 gap-4"><div className="h-2 bg-slate-200 rounded col-span-2"></div><div className="h-2 bg-slate-200 rounded col-span-1"></div></div><div className="h-2 bg-slate-200 rounded"></div></div></div></div>
            ) : emergencies.length === 0 ? (
              <div className="text-center text-gray-500 py-10">No active emergencies assigned to this hospital.</div>
            ) : (
              <div className="space-y-4">
                {emergencies.map(req => (
                  <div key={req._id} className="p-4 border border-blue-100 bg-blue-50 rounded-lg flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900">{req.patient?.name}</h3>
                      <p className="text-sm text-gray-600">Type: <span className="font-semibold uppercase text-blue-600">{req.emergencyType}</span></p>
                      <p className="text-xs text-gray-500 mt-1">Status: {req.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-800">Ambulance: {req.ambulance?.vehicleNumber}</p>
                      <button className="mt-2 text-sm bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700">Mark Arrived</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalPortal;
