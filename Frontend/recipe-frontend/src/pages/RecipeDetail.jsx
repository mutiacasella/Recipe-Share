import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const RecipeDetail = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  
  // State for input forms
  const [commentForm, setCommentForm] = useState({ user: '', text: '' });
  const [file, setFile] = useState(null);

  const fetchRecipe = () => {
    axios.get(`http://localhost:3000/recipes/${id}`)
      .then(res => setRecipe(res.data))
      .catch(err => console.error("Error fetching recipe:", err));
  };

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  // --- HANDLER: INSECURE FILE UPLOAD ---
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Pilih file gambar dulu!");

    const formData = new FormData();
    formData.append('file', file); // Key 'file'

    try {
      await axios.post(`http://localhost:3000/recipes/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('✅ Photo uploaded! (Refresh page to see it)');
      fetchRecipe();
    } catch (err) {
      alert('❌ Upload failed');
    }
  };

  // --- HANDLER: STORED XSS ---
  const handleComment = async (e) => {
    e.preventDefault();
    try {
      // Kirim data ke backend (user & text)
      await axios.post(`http://localhost:3000/recipes/${id}/comment`, commentForm);
      setCommentForm({ user: '', text: '' });
      fetchRecipe(); // Refresh for payload XSS rendering 
    } catch (err) {
      console.error(err);
    }
  };

  if (!recipe) return <div style={{textAlign:'center', marginTop:'50px'}}>Loading recipes...</div>;

  return (
    <div>
      {/* HERO HEADER */}
      <div className="detail-header">
        <img 
          src={recipe.image.startsWith('default') 
            ? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000&q=80" 
            : `http://localhost:3000/uploads/${recipe.image}`} 
          alt={recipe.name} 
          className="detail-img"
        />
        <h1 className="detail-title">{recipe.name}</h1>
        <p className="detail-desc">{recipe.description}</p>
      </div>

      {/* INGREDIENTS & STEPS */}
      <div className="recipe-content">
        <div>
          <h3 className="section-title">🥕 Ingredients</h3>
          <ul className="ingredients-list">
            {recipe.ingredients && recipe.ingredients.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
            {!recipe.ingredients && <p>No ingredients data.</p>}
          </ul>
        </div>
        <div>
          <h3 className="section-title">🔥 Instructions</h3>
          <ol className="steps-list">
            {recipe.steps && recipe.steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
            {!recipe.steps && <p>No steps data.</p>}
          </ol>
        </div>
      </div>

      {/* VULNERABILITY ZONE 1: FILE UPLOAD */}
      <div className="vuln-section">
        <div className="vuln-header">
          <span className="vuln-icon">📸</span>
          <div>
            <h3>Cooked this? Share your photo!</h3>
          </div>
        </div>
        
        <form onSubmit={handleUpload} className="form-row">
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])} 
            className="input-field"
          />
          <button type="submit" className="btn-primary">UPLOAD</button>
        </form>
      </div>

      {/* VULNERABILITY ZONE 2: COMMENTS (STORED XSS) */}
      <div className="vuln-section">
        <div className="vuln-header">
          <span className="vuln-icon">💬</span>
          <div>
            <h3>Community Reviews & Tips</h3>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleComment}>
          <input 
            type="text" 
            placeholder="Your Name" 
            className="input-field"
            style={{marginBottom: '10px'}}
            value={commentForm.user}
            onChange={e => setCommentForm({...commentForm, user: e.target.value})}
          />
          <textarea 
            placeholder="Write your review or tips..." 
            className="input-field"
            rows="3"
            style={{marginBottom: '10px'}}
            value={commentForm.text}
            onChange={e => setCommentForm({...commentForm, text: e.target.value})}
          ></textarea>
          <button type="submit" className="btn-primary" style={{width:'100%'}}>POST REVIEW</button>
        </form>

        {/* List Komentar - VULNERABLE RENDERING */}
        <ul className="comment-list">
          {recipe.comments.map((c, index) => (
            <li key={index} className="comment-item">
              <div>
                <span className="comment-user">{c.user}</span>
                <span className="comment-date">{c.date}</span>
              </div>
              {/* dangerouslySetInnerHTML for simulated XSS vulnerability */}
              <div 
                className="comment-body"
                dangerouslySetInnerHTML={{ __html: c.text }}
              ></div>
            </li>
          ))}
          {recipe.comments.length === 0 && <p style={{color:'#aaa', fontStyle:'italic'}}>No reviews yet. Be the first!</p>}
        </ul>
      </div>

    </div>
  );
};

export default RecipeDetail;