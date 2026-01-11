import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Home() {
  const [gigs, setGigs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { api } = useContext(AuthContext);

  useEffect(() => {
    fetchGigs();
  }, [search]);

  const fetchGigs = async () => {
    try {
      const res = await api.get(`/gigs?search=${search}`);
      setGigs(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Gigs</h1>
        <input
          type="text"
          placeholder="Search gigs by title..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : gigs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No gigs found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gigs.map((gig) => (
            <div key={gig._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{gig.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  gig.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {gig.status}
                </span>
              </div>
              <p className="text-gray-600 mb-4 line-clamp-3">{gig.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-indigo-600">₹{gig.budget}</span>
                <Link
                  to={`/gigs/${gig._id}`}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                >
                  View Details
                </Link>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Posted by: {gig.ownerId.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}