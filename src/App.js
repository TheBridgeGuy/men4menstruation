import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

function App() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    try {
      console.log('Attempting to add post...');
      console.log('Author:', authorName);
      console.log('Content:', newPost);
      
      const docRef = await addDoc(collection(db, 'posts'), {
        content: newPost,
        author: authorName,
        createdAt: new Date(),
      });
      
      console.log('Post added successfully with ID:', docRef.id);
      alert('Location posted successfully!');
      setNewPost('');
      setAuthorName('');
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
          <div className="map-container">
            <MapContainer center={[22.3193, 114.1694]} zoom={12} className="map">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {posts.map((post) => (
                <Marker 
                  key={post.id} 
                  position={[22.3193 + (Math.random() - 0.5) * 0.2, 114.1694 + (Math.random() - 0.5) * 0.2]}
                  icon={defaultIcon}
                >
                  <Popup>
                    <div>
                      <strong>{post.author}</strong>
                      <p>{post.content}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
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
