require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Student = require('./models/Student');

const app = express();
const PORT = process.env.PORT || 5000;

// Parse JSON request bodies
app.use(express.json());

// Health route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Reject malformed IDs with 400
function checkId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid student ID' });
  }
  next();
}

// GET all students
app.get('/api/students', async (req, res, next) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    next(err);
  }
});

// GET one student
app.get('/api/students/:id', checkId, async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    next(err);
  }
});

// POST create student
app.post('/api/students', async (req, res, next) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (err) {
    next(err);
  }
});

// PUT update student
app.put('/api/students/:id', checkId, async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    next(err);
  }
});

// DELETE student
app.delete('/api/students/:id', checkId, async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student deleted successfully', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (no stack traces sent to clients)
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation failed', details: messages });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid input' });
  }
  console.error(err); // logged on the server only
  res.status(500).json({ error: 'Internal server error' });
});

// Start listening only after the DB connection succeeds
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
  