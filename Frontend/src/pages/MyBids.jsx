import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function MyBids() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const { api } = useContext(AuthContext);

  useEffect(() => {
    fetchMyBids();
  }, []);

  const fetchMyBids = async () => {
    try {
      const res = await api.get('/bids/user/my-bids');
      setBids(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bids</h1>
      
      {bids.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          You haven't submitted any bids yet
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => (
            <div key={bid._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Link 
                    to={`/gigs/${bid.gigId._id}`}
                    className="text-xl font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    {bid.gigId.title}
                  </Link>
                  <p className="text-gray-500 text-sm mt-1">
                    Budget: ₹{bid.gigId.budget}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">₹{bid.price}</div>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    bid.status === 'hired' ? 'bg-green-100 text-green-800' :
                    bid.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {bid.status}
                  </span>
                </div>
              </div>
              <p className="text-gray-600">{bid.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}