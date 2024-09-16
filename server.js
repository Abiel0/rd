const express = require('express');
const serverless = require('serverless-http');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Add cors middleware
app.use(cors({
    origin: '*',  // Allow all origins
    methods: ['GET', 'POST'],  // Allow GET and POST methods
    allowedHeaders: ['Content-Type', 'Authorization']  // Allow these headers
}));

app.use(express.json());

// Serve static files from the 'public' directory if it exists
app.use(express.static('public'));

// Serve the index.html file from the root directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const HF_API_KEY = process.env.HF_API_KEY;

if (!HF_API_KEY) {
    console.error('HF_API_KEY is not set. Please set it in your environment or .env file.');
    // Don't exit the process in serverless environment
    // Instead, we'll handle this in the route
}

app.post('/generate-image', async (req, res) => {
    if (!HF_API_KEY) {
        return res.status(500).json({ error: 'HF_API_KEY is not set' });
    }

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

// This is for local development
if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

// Export the serverless function
module.exports.handler = serverless(app);