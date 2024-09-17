const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS
app.use(cors({
    origin: true, // Allow any origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow all methods
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'], // Allow more headers
    credentials: true // Allow cookies
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Serve static files from the 'public' directory if it exists
app.use(express.static(__dirname));

// Serve the index.html file from the root directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const HF_API_KEY = process.env.HF_API_KEY;

if (!HF_API_KEY) {
    console.error('HF_API_KEY is not set. Please set it in your environment or .env file.');
    process.exit(1);
}

app.post('/generate-image', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const response = await fetch(
            "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
            {
                headers: {
                    Authorization: `Bearer ${HF_API_KEY}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({ inputs: prompt }),
            }
        );

        if (!response.ok) {
            throw new Error('Failed to generate image');
        }

        const result = await response.buffer();
        
        // Convert buffer to base64
        const base64Image = result.toString('base64');
        
        // Send back the base64 encoded image
        res.json({ image: `data:image/png;base64,${base64Image}` });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});