import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { notifications, clearNotification } = useContext(SocketContext);

  return (
    <nav className="bg-indigo-400 text-emerald-850 font-semibold shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold">
            GigFlow
          </Link>

          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link to="/" className="hover:text-indigo-200">Browse Gigs</Link>
                <Link to="/create-gig" className="hover:text-indigo-200">Post a Gig</Link>
                <Link to="/my-bids" className="hover:text-indigo-200">My Bids</Link>
                
                {notifications.length > 0 && (
                  <div className="relative">
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                    <button className="hover:text-indigo-200">
                      🔔
                    </button>
                  </div>
                )}
                
                <span className="text-indigo-200">{user.name}</span>
                <button
                  onClick={logout}
                  className="bg-indigo-900 px-4 py-2 rounded hover:bg-amber-300 text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-indigo-200">Login</Link>
                <Link to="/register" className="bg-indigo-700 px-4 py-2 rounded hover:bg-indigo-800">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 space-y-2 z-50">
          {notifications.map((notif, index) => (
            <div key={index} className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex justify-between items-center">
              <span>{notif.message}</span>
              <button
                onClick={() => clearNotification(index)}
                className="ml-4 text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </nav>
  );
}