import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function GigDetail() {
  const { id } = useParams();
  const [gig, setGig] = useState(null);
  const [bids, setBids] = useState([]);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidData, setBidData] = useState({ message: '', price: '' });
  const { api, user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGig();
    if (user) {
      fetchBids();
    }
  }, [id, user]);

  const fetchGig = async () => {
    try {
      const res = await api.get(`/gigs/${id}`);
      setGig(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    try {
      const res = await api.get(`/bids/${id}`);
      setBids(res.data);
    } catch (error) {
      // User is not owner, can't see bids
      setBids([]);
    }
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    try {
      await api.post('/bids', {
        gigId: id,
        ...bidData
      });
      setShowBidForm(false);
      setBidData({ message: '', price: '' });
      alert('Bid submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit bid');
    }
  };

  const handleHire = async (bidId) => {
    if (!confirm('Are you sure you want to hire this freelancer?')) return;
    
    try {
      await api.patch(`/bids/${bidId}/hire`);
      alert('Freelancer hired successfully!');
      fetchGig();
      fetchBids();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to hire');
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!gig) return <div className="text-center py-12">Gig not found</div>;

  const isOwner = user && gig.ownerId._id === user.id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{gig.title}</h1>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
            gig.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {gig.status}
          </span>
        </div>
        
        <p className="text-gray-600 mb-6 whitespace-pre-wrap">{gig.description}</p>
        
        <div className="flex justify-between items-center mb-6">
          <div className="text-3xl font-bold text-indigo-600">₹{gig.budget}</div>
          <div className="text-gray-500">Posted by: {gig.ownerId.name}</div>
        </div>

        {user && !isOwner && gig.status === 'open' && (
          <button
            onClick={() => setShowBidForm(!showBidForm)}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            {showBidForm ? 'Cancel' : 'Submit a Bid'}
          </button>
        )}

        {showBidForm && (
          <form onSubmit={handleSubmitBid} className="mt-6 space-y-4 border-t pt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Proposal
              </label>
              <textarea
                required
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={bidData.message}
                onChange={(e) => setBidData({ ...bidData, message: e.target.value })}
                placeholder="Explain why you're the best fit for this job..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Price (₹)
              </label>
              <input
                type="number"
                required
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={bidData.price}
                onChange={(e) => setBidData({ ...bidData, price: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium"
            >
              Submit Bid
            </button>
          </form>
        )}
      </div>

      {isOwner && bids.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Bids Received</h2>
          <div className="space-y-4">
            {bids.map((bid) => (
              <div key={bid._id} className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{bid.freelancerId.name}</h3>
                    <p className="text-gray-500 text-sm">{bid.freelancerId.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">₹{bid.price}</div>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      bid.status === 'hired' ? 'bg-green-100 text-green-800' :
                      bid.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {bid.status}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{bid.message}</p>
                {bid.status === 'pending' && gig.status === 'open' && (
                  <button
                    onClick={() => handleHire(bid._id)}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
                  >
                    Hire
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}