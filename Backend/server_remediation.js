require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const xss = require('xss'); // Sanitization
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Secure Data Storage ---
let recipes = [
    { 
        id: 1, 
        name: 'Nasi Goreng Spesial', 
        description: 'Nasi goreng dengan telur dan ayam', 
        image: 'default',
        ingredients: ['2 piring nasi', 'Bumbu rahasia', 'Telur'],
        steps: ['Goreng nasi', 'Sajikan'],
        images: [], 
        comments: [] 
    },
    { 
        id: 2, 
        name: 'Mie Ayam Bakso', 
        description: 'Mie ayam dengan bakso sapi', 
        image: 'default',
        ingredients: ['Mie', 'Ayam', 'Bakso'],
        steps: ['Rebus mie', 'Sajikan'],
        images: [], 
        comments: [] 
    },
    { 
        id: 3, 
        name: 'Sate Ayam Madura', 
        description: 'Sate ayam dengan bumbu kacang khas Madura', 
        image: 'default',
        ingredients: ['Daging Ayam', 'Kacang', 'Kecap'],
        steps: ['Bakar sate', 'Sajikan'],
        images: [], 
        comments: [] 
    }
];

// --- Secure File Upload ---

// Folder Upload Validation
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // REMEDIATION - Timestamp or Random String to prevent overwriting
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'img-' + uniqueSuffix + ext);
    }
});

// REMEDIATION - File Filter (Whitelist Extension & MIME Type)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimeType = allowedTypes.test(file.mimetype);
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimeType && extName) {
        return cb(null, true);
    }
    cb(new Error('Security Error: Only image files are allowed!'));
};

// REMEDIATION: Limit File Size (Prevent DoS)
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // Max 2MB
});

// --- Routes ---

app.use('/uploads', express.static('uploads')); 

app.get('/recipes', (req, res) => res.json(recipes));

app.get('/recipes/:id', (req, res) => {
    const recipe = recipes.find(r => r.id == req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Not found' });
    res.json(recipe);
});

// REMEDIATION: Secure Comment (Prevent XSS)
app.post('/recipes/:id/comment', (req, res) => {
    const recipe = recipes.find(r => r.id == req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Not found' });

    const { user, text } = req.body;
    
    // REMEDIATION: Input Sanitization using xss library
    const cleanUser = xss(user);
    const cleanText = xss(text);

    recipe.comments.push({
        id: recipe.comments.length + 1,
        user: cleanUser,
        text: cleanText,
        date: new Date().toLocaleString()
    });

    res.json({ message: "Comment added securely", recipe });
});

// REMEDIATION: Secure Upload
app.post('/recipes/:id/upload', (req, res) => {
    // Multer to capture errors from fileFilter
    const uploadSingle = upload.single('file');

    uploadSingle(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message }); 
        }
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const recipe = recipes.find(r => r.id == req.params.id);
        if (recipe) {
            recipe.image = req.file.filename;
        }
        res.json({ message: "File uploaded securely!", filename: req.file.filename });
    });
});

// Secure Admin Dashboard
app.get('/admin/dashboard', (req, res) => {
    let allComments = [];
    recipes.forEach(r => {
        r.comments.forEach(c => allComments.push({ user: c.user, text: c.text }));
    });
    let html = `
        <h1>Secure Admin Dashboard</h1>
        <p>Data Clean & Safe</p>
        <ul>
            ${allComments.map(c => `<li><b>${c.user}</b>: ${c.text}</li>`).join('')}
        </ul>
    `;
    res.send(html);
});

app.listen(PORT, () => {
    console.log(`SECURE Server running on http://localhost:${PORT}`);
});