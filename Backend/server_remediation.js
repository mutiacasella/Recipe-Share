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
        name: 'Nasi Goreng Mafia', 
        description: 'Pedas gila dengan bumbu rahasia para mafia.',
        image: 'nasi_goreng.png', 
        ingredients: ['Nasi', 'Cabai Setan', 'Bawang', 'Kecap', 'Telur'],
        steps: ['Tumis bumbu', 'Masak telur', 'Campur nasi', 'Sajikan dengan tatapan tajam'],
        images: [], 
        comments: []
    },
    { 
        id: 2, 
        name: 'Smoothie Bowl Naga', 
        description: 'Sehat, segar, dan estetik untuk feed Instagram.',
        image: 'smoothie.png', 
        ingredients: ['Buah Naga', 'Pisang', 'Susu Almond', 'Chia Seeds'],
        steps: ['Blender buah', 'Tuang ke mangkuk', 'Hias topping', 'Foto dulu sebelum makan'],
        images: [],
        comments: []
    },
    { 
        id: 3, 
        name: 'Indomie Carbonara', 
        description: 'Anak kosan style tapi rasa restoran bintang lima.',
        image: 'indomie.png', 
        ingredients: ['Indomie', 'Susu UHT', 'Keju Cheddar', 'Sosis'],
        steps: ['Rebus mie setengah matang', 'Masak kuah susu dan keju', 'Campur semua', 'Sajikan hangat'],
        images: [],
        comments: []
    },
    { 
        id: 4, 
        name: 'Sate Ayam Madura', 
        description: 'Sate ayam juicy dengan bumbu kacang kental asli Madura.',
        image: 'sate_ayam.png', 
        ingredients: ['Daging Ayam', 'Kacang Tanah', 'Kecap Manis', 'Bawang Merah', 'Jeruk Limau'],
        steps: ['Potong daging dadu', 'Tusuk ke tusukan sate', 'Bakar sambil dioles kecap', 'Sajikan dengan bumbu kacang'],
        images: [],
        comments: []
    },
    { 
        id: 5, 
        name: 'Rendang Daging Sapi', 
        description: 'Masakan terlezat di dunia, dimasak 8 jam penuh cinta.',
        image: 'rendang.png', 
        ingredients: ['Daging Sapi', 'Santan', 'Lengkuas', 'Serai', 'Cabai', 'Rempah Rahasia'],
        steps: ['Tumis bumbu halus', 'Masukkan daging dan santan', 'Masak api kecil sampai kering (8 jam)', 'Siap disantap'],
        images: [],
        comments: []
    },
    { 
        id: 6, 
        name: 'Gado-Gado Jakarta', 
        description: 'Salad-nya orang Indonesia dengan bumbu kacang medok.',
        image: 'gado_gado.png', 
        ingredients: ['Lontong', 'Tauge', 'Kangkung', 'Tahu', 'Tempe', 'Kerupuk'],
        steps: ['Rebus semua sayuran', 'Goreng tahu tempe', 'Ulek bumbu kacang', 'Campur semua bahan'],
        images: [],
        comments: []
    },
    { 
        id: 7, 
        name: 'Soto Ayam Lamongan', 
        description: 'Kuah kuning segar dengan taburan koya yang gurih.',
        image: 'soto_ayam.png', 
        ingredients: ['Ayam Kampung', 'Kunyit', 'Jahe', 'Soun', 'Telur Rebus', 'Bubuk Koya'],
        steps: ['Rebus ayam dengan bumbu kuning', 'Suwir ayam', 'Tata soun dan kol di mangkuk', 'Siram kuah panas'],
        images: [],
        comments: []
    },
    { 
        id: 8, 
        name: 'Bakso Beranak', 
        description: 'Bakso jumbo yang di dalamnya ada bakso kecil-kecil.',
        image: 'bakso.png', 
        ingredients: ['Daging Sapi Giling', 'Tepung Tapioka', 'Bawang Putih', 'Kaldu Sapi', 'Mie Kuning'],
        steps: ['Bentuk adonan bakso besar', 'Isi dengan bakso kecil', 'Rebus hingga mengapung', 'Sajikan dengan kuah'],
        images: [],
        comments: []
    },
    { 
        id: 9, 
        name: 'Pempek Kapal Selam', 
        description: 'Pempek isi telur besar dengan cuko pedas manis.',
        image: 'pempek.png', 
        ingredients: ['Ikan Tenggiri', 'Tepung Sagu', 'Telur Bebek', 'Gula Merah', 'Asam Jawa'],
        steps: ['Uleni ikan dan tepung', 'Bentuk mangkuk, isi telur', 'Rebus hingga matang', 'Goreng dan sajikan dengan cuko'],
        images: [],
        comments: []
    },
    { 
        id: 10, 
        name: 'Martabak Manis Keju', 
        description: 'Terang bulan tebal dengan topping keju susu melimpah.',
        image: 'martabak.png', 
        ingredients: ['Tepung Terigu', 'Gula Pasir', 'Telur', 'Soda Kue', 'Keju Parut', 'Susu Kental Manis'],
        steps: ['Buat adonan martabak', 'Panggang di teflon panas', 'Oles mentega', 'Tabur keju parut', 'Lipat dan potong'],
        images: [],
        comments: []
    }
];

recipes.forEach(recipe => {
    recipe.comments.forEach(comment => {
        if (comment.text && !comment.comment) {
            comment.comment = comment.text;
            delete comment.text;
        }
    });
});

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
        // REMEDIATION - Ignore user input for filename
        // Use Timestamp or Random String to prevent overwriting and path traversal
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

    const { user, comment } = req.body;

    // REMEDIATION: Input Sanitization using xss library
    const cleanUser = xss(user);
    const cleanText = xss(comment);

    recipe.comments.push({
        id: recipe.comments.length + 1,
        user: cleanUser,
        comment: cleanText,
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
        r.comments.forEach(c => allComments.push({ user: c.user, comment: c.comment }));
    });
    
    // Render  secure Admin Dashboard
    let html = `
        <html>
        <head><title>Secure Dashboard</title></head>
        <body style="font-family:sans-serif; padding:20px;">
            <h1 style="color:green">✅ Secure Admin Dashboard</h1>
            <p>Data Clean & Safe. No raw HTML rendering.</p>
            <table border="1" cellpadding="10" style="border-collapse:collapse; width:100%">
                <tr><th>User</th><th>Comment (Sanitized)</th></tr>
                ${allComments.map(c => `<tr><td>${c.user}</td><td>${c.comment}</td></tr>`).join('')}
            </table>
        </body>
        </html>
    `;
    res.send(html);
});

app.get('/recipes/:id', (req, res) => {
    const recipe = recipes.find(r => r.id == req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Not found' });
    
    console.log('\n=== /recipes/' + req.params.id + ' ===');
    console.log('Recipe:', recipe.name);
    console.log('Comments count:', recipe.comments.length);
    if (recipe.comments.length > 0) {
        console.log('First comment:', recipe.comments[0]);
        console.log('First comment keys:', Object.keys(recipe.comments[0]));
    }
    console.log('================\n');
    
    res.json(recipe);
});

app.listen(PORT, () => {
    console.log(`SECURE Server running on http://localhost:${PORT}`);
});