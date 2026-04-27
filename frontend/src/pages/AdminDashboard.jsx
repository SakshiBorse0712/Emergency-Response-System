import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Shield, Users, Truck, Activity, LogOut } from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [emergencies, setEmergencies] = useState([]);

  useEffect(() => {
    const fetchEmergencies = async () => {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/emergency`, config);
      setEmergencies(data);
    };
    fetchEmergencies();
    // In a real app, you'd use socket.io here to listen to 'emergency_status_update' for real-time list updates
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <nav className="bg-gray-900 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center"><Shield className="mr-2 text-blue-500" /> Admin Command Center</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-300">{user?.name}</span>
          <button onClick={logout} className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded flex items-center">
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </button>
        </div>
      </nav>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><Activity className="w-6 h-6" /></div>
            <div><p className="text-sm text-gray-500">Active SOS</p><p className="text-2xl font-bold">{emergencies.filter(e => e.status !== 'completed').length}</p></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><Truck className="w-6 h-6" /></div>
            <div><p className="text-sm text-gray-500">Total Ambulances</p><p className="text-2xl font-bold">-</p></div>
          </div>
        </div>

        {/* Emergencies List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-gray-800">All Emergencies</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Patient</th>
                  <th className="p-4 font-medium">Hospital</th>
                  <th className="p-4 font-medium">Ambulance</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {emergencies.map((em) => (
                  <tr key={em._id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-500">{new Date(em.createdAt).toLocaleString()}</td>
                    <td className="p-4 font-medium">{em.patient?.name}</td>
                    <td className="p-4">{em.hospital?.address || 'N/A'}</td>
                    <td className="p-4">{em.ambulance?.vehicleNumber || 'Pending'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        em.status === 'completed' ? 'bg-green-100 text-green-700' :
                        em.status === 'pending' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {em.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
