import React, { useEffect, useMemo, useState } from 'react';
import { collection, addDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { db } from './firebase';
import 'leaflet/dist/leaflet.css';
import './App.css';

const HONG_KONG_CENTER = [22.3193, 114.1694];

const DISTRICT_COORDINATES = {
  'central and western': [22.2866, 114.1549],
  'wan chai': [22.2769, 114.1758],
  'eastern': [22.2847, 114.2246],
  'southern': [22.2476, 114.1588],
  'kowloon city': [22.3283, 114.1917],
  'wong tai sin': [22.3414, 114.1939],
  'kwun tong': [22.3133, 114.2258],
  'yau tsim mong': [22.3216, 114.1722],
  'sham shui po': [22.3307, 114.1622],
  'islands': [22.2611, 113.9461],
  'kwai tsing': [22.3576, 114.1277],
  'north': [22.4947, 114.1381],
  'sai kung': [22.3823, 114.2705],
  'sha tin': [22.3838, 114.1887],
  'tai po': [22.4501, 114.1646],
  'tsuen wan': [22.3716, 114.1146],
  'tuen mun': [22.3915, 113.977],
  'yuen long': [22.4433, 114.0297],
};

function hashCode(value) {
  return Array.from(value).reduce((acc, char) => {
    return (acc << 5) - acc + char.charCodeAt(0);
  }, 0);
}

function deterministicOffset(seed, maxSpread = 0.02) {
  const x = Math.sin(seed) * 10000;
  const unit = x - Math.floor(x);
  return (unit - 0.5) * maxSpread;
}

function resolvePostPosition(post) {
  if (typeof post.latitude === 'number' && typeof post.longitude === 'number') {
    return [post.latitude, post.longitude];
  }

  const districtKey = (post.district || '').trim().toLowerCase();
  const districtBase = DISTRICT_COORDINATES[districtKey] || HONG_KONG_CENTER;
  const seedBase = hashCode(post.id || post.author || post.content || 'post');

  return [
    districtBase[0] + deterministicOffset(seedBase, 0.015),
    districtBase[1] + deterministicOffset(seedBase + 99, 0.02),
  ];
}

function App() {
  const [posts, setPosts] = useState([]);
  const [formData, setFormData] = useState({
    author: '',
    district: '',
    details: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const defaultIcon = useMemo(
    () =>
      L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    []
  );

  const mappedPosts = posts.map((post) => ({
    ...post,
    position: resolvePostPosition(post),
  }));

  const fetchPosts = async () => {
    setIsLoadingPosts(true);

    try {
      const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(postsQuery);
      const postsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: `Could not load community posts. ${error.message}`,
      });
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.author.trim() || !formData.details.trim()) {
      setStatusMessage({ type: 'error', text: 'Please add your name and a location description.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage({ type: '', text: '' });

    try {
      await addDoc(collection(db, 'posts'), {
        author: formData.author.trim(),
        district: formData.district.trim(),
        content: formData.details.trim(),
        createdAt: new Date(),
      });

      setFormData({ author: '', district: '', details: '' });
      setStatusMessage({
        type: 'success',
        text: 'Thanks for sharing. Your location note is now live for the community.',
      });
      await fetchPosts();
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: `Could not publish your post. ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="hero-kicker">Community-Led Menstrual Support</p>
        <h1>Men for Menstruation</h1>
        <p className="hero-subtitle">
          A shared map of free period product locations and lived community tips across Hong Kong.
        </p>
      </header>

      <main className="content-grid">
        <section className="panel mission-panel">
          <h2>Why This Exists</h2>
          <p>
            Period products should be easy to find without shame, stress, or guesswork. This platform helps
            people quickly discover support spots and keeps conversations around menstruation open and normal.
          </p>
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-value">{posts.length}</span>
              <span className="stat-label">Community posts</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">18</span>
              <span className="stat-label">HK districts supported</span>
            </div>
          </div>
        </section>

        <section className="panel form-panel">
          <h2>Share a Free Product Spot</h2>
          <form onSubmit={handleSubmit} className="post-form" noValidate>
            <label className="form-label" htmlFor="author">
              Your name
            </label>
            <input
              id="author"
              name="author"
              type="text"
              value={formData.author}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g. Chris"
              maxLength={60}
              required
            />

            <label className="form-label" htmlFor="district">
              District (optional)
            </label>
            <input
              id="district"
              name="district"
              type="text"
              value={formData.district}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g. Sha Tin"
              maxLength={60}
            />

            <label className="form-label" htmlFor="details">
              Location details
            </label>
            <textarea
              id="details"
              name="details"
              value={formData.details}
              onChange={handleInputChange}
              className="form-textarea"
              rows="4"
              placeholder="Describe where products are available and any useful notes."
              maxLength={400}
              required
            />
            <p className="character-count">{formData.details.length}/400</p>

            <button type="submit" disabled={isSubmitting} className="submit-btn">
              {isSubmitting ? 'Publishing...' : 'Publish Post'}
            </button>
          </form>

          {statusMessage.text ? (
            <p className={`status-message ${statusMessage.type}`}>{statusMessage.text}</p>
          ) : null}
        </section>

        <section className="panel map-panel">
          <div className="panel-header-row">
            <h2>Community Map</h2>
            <span>{mappedPosts.length} pins</span>
          </div>
          <div className="map-container">
            <MapContainer center={HONG_KONG_CENTER} zoom={11} className="map" scrollWheelZoom={false}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {mappedPosts.map((post) => (
                <Marker key={post.id} position={post.position} icon={defaultIcon}>
                  <Popup>
                    <strong>{post.author || 'Community Member'}</strong>
                    <p>{post.content}</p>
                    {post.district ? <p>District: {post.district}</p> : null}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </section>

        <section className="panel posts-panel">
          <div className="panel-header-row">
            <h2>Latest Community Posts</h2>
          </div>
          {isLoadingPosts ? (
            <p className="empty-state">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="empty-state">No posts yet. Be the first to map a support spot.</p>
          ) : (
            <div className="posts-container">
              {posts.map((post) => (
                <article key={post.id} className="post-card">
                  <div className="post-header">
                    <strong>{post.author || 'Community Member'}</strong>
                    <span className="post-date">
                      {post.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                    </span>
                  </div>
                  {post.district ? <p className="post-district">{post.district}</p> : null}
                  <p className="post-content">{post.content}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>&copy; 2026 Men for Menstruation. Care is strongest when communities share it.</p>
      </footer>
    </div>
  );
}

export default App;
