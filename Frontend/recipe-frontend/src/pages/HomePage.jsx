import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const HomePage = () => {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3000/recipes')
      .then(res => setRecipes(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <div className="hero">
        <h1>What are you craving?</h1>
        <p>Explore secret recipes from our underground kitchen.</p>
      </div>

      <div className="recipe-grid">
        {recipes.map(recipe => (
          <Link to={`/recipe/${recipe.id}`} key={recipe.id} className="recipe-card">
            <img 
              src={recipe.image.startsWith('default') 
                ? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80" 
                : `http://localhost:3000/uploads/${recipe.image}`} 
              alt={recipe.name} 
              className="card-img"
            />
            <div className="card-info">
              <div className="card-title">{recipe.name}</div>
              <div className="card-desc">{recipe.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HomePage;