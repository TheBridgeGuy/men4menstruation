import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Map click handler component
function MapClickHandler({ setSelectedLocation }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setSelectedLocation({ lat, lng });
    },
  });
  return null;
}

function App() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Fetch posts from Firestore
  const fetchPosts = async () => {
    try {
      console.log('Fetching posts from Firebase...');
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      console.log('Found', querySnapshot.size, 'posts');
      
      const postsData = [];
      querySnapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() });
      });
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    }
  };

  // Add a new post
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim() || !authorName.trim()) {
      alert('Please fill in both fields');
      return;
    }

    if (!selectedLocation) {
      alert('Please click on the map to select a location');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting to add post...');
      console.log('Author:', authorName);
      console.log('Content:', newPost);
      console.log('Location:', selectedLocation);
      
      const docRef = await addDoc(collection(db, 'posts'), {
        content: newPost,
        author: authorName,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        createdAt: new Date(),
      });
      
      console.log('Post added successfully with ID:', docRef.id);
      alert('Location posted successfully!');
      setNewPost('');
      setAuthorName('');
      setSelectedLocation(null);
      await fetchPosts(); // Refresh posts
    } catch (error) {
      console.error('Error adding post:', error);
      alert('Error posting location: ' + error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Fix Leaflet marker icons
  const defaultIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <div className="App">
      <header className="App-header">
        <h1>🩸 Men for Menstruation (Temp)</h1>
        <p>Spreading awareness, easing periods, supporting the HK girlies</p>
      </header>

      <main className="main-content">
        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            We're working to normalize conversations about menstruation and ensure 
            everyone has access to period products and education. 
          </p>
        </section>

        <section className="post-form-section">
          <h2>Free Period Product Locations</h2>
          <form onSubmit={handleSubmit} className="post-form">
            <div className="form-group">
              <input
                type="text"
                placeholder="Your name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <textarea
                placeholder="Location Description"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="form-textarea"
                rows="4"
                required
              />
            </div>
            {selectedLocation && (
              <div className="location-info">
                <p style={{ color: '#27ae60', fontWeight: 'bold' }}>
                  ✓ Location selected: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                </p>
              </div>
            )}
            {!selectedLocation && (
              <div className="location-info" style={{ color: '#e74c3c' }}>
                <p>📍 Click on the map below to select a location</p>
              </div>
            )}
            <button 
              type="submit" 
              disabled={loading}
              className="submit-btn"
            >
              {loading ? 'Posting...' : 'Share Post'}
            </button>
          </form>
        </section>

        <section className="map-section">
          <h2>📍 Locations Map</h2>
          <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>Click on the map to place your pin</p>
          <div className="map-container">
            <MapContainer center={[22.3193, 114.1694]} zoom={12} className="map">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapClickHandler setSelectedLocation={setSelectedLocation} />
              
              {/* Show temporary pin for selected location */}
              {selectedLocation && (
                <Marker 
                  position={[selectedLocation.lat, selectedLocation.lng]}
                  icon={L.icon({
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41],
                    className: 'pending-marker'
                  })}
                >
                  <Popup>
                    <div>
                      <strong>New Location (Pending)</strong>
                      <p>Lat: {selectedLocation.lat.toFixed(6)}</p>
                      <p>Lng: {selectedLocation.lng.toFixed(6)}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Show existing posts */}
              {posts.map((post) => {
                // Only show markers if latitude and longitude are defined
                if (!post.latitude || !post.longitude) {
                  return null;
                }
                return (
                  <Marker 
                    key={post.id} 
                    position={[post.latitude, post.longitude]}
                    icon={L.icon({
                      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41]
                    })}
                  >
                    <Popup>
                      <div>
                        <strong>{post.author}</strong>
                        <p>{post.content}</p>
                        <small>Lat: {post.latitude?.toFixed(6)}</small><br/>
                        <small>Lng: {post.longitude?.toFixed(6)}</small>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </section>

        <section className="posts-section">
          <h2>Community Posts</h2>
          {posts.length === 0 ? (
            <p className="no-posts">No posts yet. Be the first to share!</p>
          ) : (
            <div className="posts-container">
              {posts.map((post) => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <strong>{post.author}</strong>
                    <span className="post-date">
                      {post.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                    </span>
                  </div>
                  <div className="post-content">
                    {post.content}
                  </div>
                  {post.latitude && post.longitude && (
                    <div className="post-coordinates" style={{ marginTop: '8px', fontSize: '0.85em', color: '#7f8c8d' }}>
                      📍 Coordinates: {post.latitude?.toFixed(6)}, {post.longitude?.toFixed(6)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="App-footer">
        <p>&copy; 2026 Men for Menstruation. Together we can make a difference.</p>
      </footer>
    </div>
  );
}

export default App;
