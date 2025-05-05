const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Script model
const scriptSchema = new mongoose.Schema({
  name: { type: String, required: true },
  content: { type: String, required: true },
  accessKey: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

const Script = mongoose.model('Script', scriptSchema);

// Routes

// Upload a script
app.post('/api/scripts', async (req, res) => {
  try {
    const { name, content } = req.body;
    
    // Generate a random access key
    const accessKey = Math.random().toString(36).substring(2, 15);
    
    const script = new Script({
      name,
      content,
      accessKey
    });
    
    await script.save();
    
    res.status(201).json({
      message: 'Script uploaded successfully',
      accessKey,
      executeUrl: `/api/execute/${accessKey}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all scripts (names and access keys only)
app.get('/api/scripts', async (req, res) => {
  try {
    const scripts = await Script.find().select('name accessKey createdAt -_id');
    res.json(scripts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute a script (for Roblox)
app.get('/api/execute/:accessKey', async (req, res) => {
  try {
    const script = await Script.findOne({ accessKey: req.params.accessKey });
    
    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }
    
    // Set content type to plain text for Roblox to execute
    res.setHeader('Content-Type', 'text/plain');
    res.send(script.content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
