import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const RecipeDetail = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  
  // State for forms
  const [commentForm, setCommentForm] = useState({ user: '', text: '' });
  const [file, setFile] = useState(null);
  const [customName, setCustomName] = useState(''); // State for custom filename
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
    if (!file) return alert("Pilih file dulu!");

    const formData = new FormData();
    
    // Custom filename first
    if(customName) {
        formData.append('customName', customName);
    }
    
    // Then the file
    formData.append('file', file);

    try {
      await axios.post(`http://localhost:3000/recipes/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('✅ Upload Success!');
      setCustomName('');
      fetchRecipe(); 
    } catch (err) {
      alert('❌ Upload failed');
    }
  };

  // --- HANDLER: STORED XSS ---
  const handleComment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:3000/recipes/${id}/comment`, commentForm);
      setCommentForm({ user: '', text: '' });
      fetchRecipe(); 
    } catch (err) {
      console.error(err);
    }
  };

  if (!recipe) return <div style={{textAlign:'center', marginTop:'50px'}}>Loading...</div>;

  return (
    <div>
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

      <div className="recipe-content">
        <div>
          <h3 className="section-title">🥕 Ingredients</h3>
          <ul className="ingredients-list">
            {recipe.ingredients && recipe.ingredients.map((item, idx) => <li key={idx}>{item}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="section-title">🔥 Instructions</h3>
          <ol className="steps-list">
            {recipe.steps && recipe.steps.map((step, idx) => <li key={idx}>{step}</li>)}
          </ol>
        </div>
      </div>

      {/* VULNERABILITY ZONE 1: FILE UPLOAD */}
      <div className="vuln-section">
        <div className="vuln-header">
          <span className="vuln-icon">📸</span>
          <div>
            <h3>Upload Result</h3>
          </div>
        </div>
        
        <form onSubmit={handleUpload} style={{display:'flex', flexDirection:'column', gap:'10px'}}>
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])} 
            className="input-field"
          />
          {/* Input berbahaya tambahan untuk Path Traversal */}
          <input 
            type="text" 
            placeholder="Custom Filename" 
            className="input-field"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
          <button type="submit" className="btn-primary">UPLOAD</button>
        </form>
      </div>

      {/* VULNERABILITY ZONE 2: COMMENTS (STORED XSS) */}
      <div className="vuln-section">
        <div className="vuln-header">
          <span className="vuln-icon">💬</span>
          <div>
            <h3>Reviews</h3>
          </div>
        </div>

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
            placeholder="Write review..." 
            className="input-field"
            rows="3"
            style={{marginBottom: '10px'}}
            value={commentForm.text}
            onChange={e => setCommentForm({...commentForm, text: e.target.value})}
          ></textarea>
          <button type="submit" className="btn-primary" style={{width:'100%'}}>POST REVIEW</button>
        </form>

        <ul className="comment-list">
          {recipe.comments.map((c, index) => (
            <li key={index} className="comment-item">
              <div>
                <span className="comment-user">{c.user}</span>
                <span className="comment-date">{c.date}</span>
              </div>
              <div 
                className="comment-body"
                dangerouslySetInnerHTML={{ __html: c.text }}
              ></div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RecipeDetail;