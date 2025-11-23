require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Vulnerability ---

// Vulnerable data storage
let recipes = [
    { 
        id: 1, 
        name: 'Nasi Goreng Mafia', 
        description: 'Pedas gila dengan bumbu rahasia para mafia.',
        image: 'default',
        ingredients: [
            '2 piring nasi putih dingin',
            '5 buah cabai rawit merah (ulek kasar)',
            '2 siung bawang putih',
            'Kecap manis secukupnya',
            '1 butir telur ayam',
            'Kerupuk secukupnya'
        ],
        steps: [
            'Tumis bawang putih dan cabai hingga harum.',
            'Masukkan telur, orak-arik hingga matang.',
            'Masukkan nasi, aduk rata dengan bumbu.',
            'Tambahkan kecap manis, garam, dan penyedap.',
            'Sajikan dengan kerupuk dan tatapan tajam.'
        ],
        images: [], 
        comments: []
    },
    { 
        id: 2, 
        name: 'Smoothie Bowl Naga', 
        description: 'Sehat, segar, dan estetik untuk feed Instagram.',
        image: 'default', 
        ingredients: [
            '1 buah naga merah beku',
            '1 buah pisang beku',
            '100ml susu almond',
            'Topping: Granola, Chia seeds, Kelapa'
        ],
        steps: [
            'Blender buah naga, pisang, dan susu hingga halus.',
            'Tuang ke dalam mangkuk kelapa.',
            'Hias dengan topping se-estetik mungkin.',
            'Foto dulu sebelum dimakan.'
        ],
        images: [],
        comments: []
    },
    { 
        id: 3, 
        name: 'Indomie Carbonara', 
        description: 'Anak kosan style tapi rasa restoran bintang lima.',
        image: 'default',
        ingredients: [
            '1 bungkus Indomie Goreng',
            '100ml susu full cream',
            'Keju cheddar parut',
            'Sosis/Smoked beef',
            'Parsley kering'
        ],
        steps: [
            'Rebus mie setengah matang, tiriskan.',
            'Masak susu dan keju hingga mengental.',
            'Masukkan bumbu Indomie dan mie.',
            'Aduk rata hingga creamy.',
            'Sajikan hangat.'
        ],
        images: [],
        comments: []
    }
];

// Vulnerable file upload setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');         // no validation
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);  // no sanitization
    }
});

const upload = multer({ 
    storage: storage      // no file filter
});

// --- Middleware ---

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Routes ---

// Home - List Recipes
app.get('/', (req, res) => {
    res.json({
        message: "Recipe Share API - Backend Ready for Testing",
        endpoints: {
            home: "GET /",
            recipes: "GET /recipes",
            recipe_detail: "GET /recipe/:id", 
            post_comment: "POST /recipe/:id/comment",
            upload_file: "POST /recipe/:id/upload",
            admin_dashboard: "GET /admin/dashboard (Target XSS)"
        },
        recipes: recipes
    });
});

// Recipes List - Show all recipes
app.get('/recipes', (req, res) => {
    res.json(recipes);
});

// Recipe Detail - Show specific recipe
app.get('/recipe/:id', (req, res) => { 
    const recipeId = parseInt(req.params.id);
    const recipe = recipes.find(r => r.id === recipeId);
    
    if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
    }
    
    res.json(recipe); 
});

app.get('/recipes/:id', (req, res) => { 
    const recipeId = parseInt(req.params.id);
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.json(recipe);
});

// Comments - XSS Stored Vulnerability for specific recipe
app.post('/recipe/:id/comment', (req, res) => {
    const recipeId = parseInt(req.params.id);
    const recipe = recipes.find(r => r.id === recipeId);
    
    if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
    }
    
    // Support req.body.user dari Frontend, fallback to 'name'
    const { name, comment, user } = req.body; 
    
    // no input sanitization
    recipe.comments.push({
        id: recipe.comments.length + 1,
        user: user || name || 'Anonymous', 
        comment: comment, 
        text: comment,    
        date: new Date().toLocaleString()
    });
    
    res.json({
        message: "Comment added successfully",
        vulnerability: "XSS Stored - No input sanitization",
        recipe: recipe
    });
});
// Alternate route to support both 'comment' and 'text' fields
app.post('/recipes/:id/comment', (req, res) => {
    const recipeId = parseInt(req.params.id);
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    
    const { user, text } = req.body; 
    
    // no input sanitization
    recipe.comments.push({
        id: recipe.comments.length + 1,
        user: user || 'Anonymous',
        text: text, // XSS Payload stored here
        date: new Date().toLocaleString()
    });
    
    res.json({ message: "Comment added", recipe });
});

// Upload - Insecure File Upload Vulnerability for specific recipe
app.post('/recipe/:id/upload', upload.single('file'), (req, res) => { 
    const recipeId = parseInt(req.params.id);
    const recipe = recipes.find(r => r.id === recipeId);
    
    if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
    }
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    
    // no file type validation
    recipe.images.push(req.file.filename);
    recipe.image = req.file.filename; 
    
    res.json({
        message: "File uploaded successfully", 
        vulnerability: "Insecure File Upload - No file validation",
        file: {
            filename: req.file.filename,
            size: req.file.size,
            path: req.file.path
        },
        recipe: recipe
    });
});

// Alternate route to support /recipes/:id/upload
app.post('/recipes/:id/upload', upload.single('file'), (req, res) => {
    const recipeId = parseInt(req.params.id);
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    
    // no file type validation
    recipe.image = req.file.filename;
    res.json({ message: "File uploaded", filename: req.file.filename });
});

// Serve uploaded files directly
app.use('/uploads', express.static('uploads'));

// --- Admin Dashboard (XSS Target Trigger) ---
app.get('/admin/dashboard', (req, res) => {
    // Simulate admin session cookie
    res.cookie('session_id', 'SECRET_ADMIN_SESSION_999', { httpOnly: false });

    let allComments = [];
    recipes.forEach(r => {
        r.comments.forEach(c => {
            allComments.push({ recipe: r.name, user: c.user || c.name, text: c.text || c.comment });
        });
    });

    // Render HTML server-side (Vulnerable to XSS)
    let html = `
        <h1>Admin Dashboard</h1>
        <p>Welcome Admin. Session: SECRET_ADMIN_SESSION_999</p>
        <h2>Recent Comments Review</h2>
        <ul>
            ${allComments.map(c => `<li><b>${c.user}</b> on ${c.recipe}: <br> ${c.text}</li>`).join('')}
        </ul>
    `;
    res.send(html);
});

// --- Start Server ---

app.listen(PORT, () => {
    console.log(`Vulnerable Server running on http://localhost:${PORT}`);
    console.log(`Home: http://localhost:${PORT}/`);
    console.log(`Admin XSS Target: http://localhost:${PORT}/admin/dashboard`);
});