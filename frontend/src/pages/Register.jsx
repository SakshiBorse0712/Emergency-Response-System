import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'patient', phone: ''
  });
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const setLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFormData({ ...formData, longitude: pos.coords.longitude, latitude: pos.coords.latitude });
        alert("Location captured successfully!");
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        extraData: {
          longitude: parseFloat(formData.longitude),
          latitude: parseFloat(formData.latitude),
          address: formData.address,
          vehicleNumber: formData.vehicleNumber
        }
      };
      await register(payload);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 py-10">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-blue-600">Create Account</h2>
        
        {error && <div className="p-3 text-sm text-blue-500 bg-blue-100 rounded">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" name="name" required className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" required className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input type="text" name="phone" required className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" name="password" required className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select name="role" className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={handleChange} value={formData.role}>
              <option value="patient">Patient (User)</option>
              <option value="hospital">Hospital</option>
              <option value="ambulance">Ambulance Driver</option>
              <option value="admin">System Admin</option>
            </select>
          </div>

          {(formData.role === 'hospital' || formData.role === 'ambulance') && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm font-bold text-blue-800">Role Specific Details</p>
              
              {formData.role === 'hospital' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hospital Address</label>
                  <input type="text" name="address" required className="w-full px-4 py-2 mt-1 border rounded-lg" onChange={handleChange} />
                </div>
              )}

              {formData.role === 'ambulance' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vehicle Number</label>
                  <input type="text" name="vehicleNumber" required className="w-full px-4 py-2 mt-1 border rounded-lg" onChange={handleChange} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500">Longitude</label>
                  <input type="text" name="longitude" value={formData.longitude || ''} className="w-full px-2 py-1 bg-gray-50 border rounded" onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Latitude</label>
                  <input type="text" name="latitude" value={formData.latitude || ''} className="w-full px-2 py-1 bg-gray-50 border rounded" onChange={handleChange} />
                </div>
              </div>
              
              <button type="button" onClick={setLocation} className="w-full text-xs bg-blue-100 text-blue-700 py-2 rounded hover:bg-blue-200">
                📍 Get Current Location
              </button>
            </div>
          )}
          
          <button type="submit" className="w-full py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-200">
            Register
          </button>
        </form>
        
        <div className="text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
