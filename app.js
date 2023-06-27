const express = require('express');
const CollectionService = require('./databaseEngine');

const app = express();

const PORT = 3000;

// Middleware to parse JSON requests
app.use(express.json());


// Create an instance of UserMasterService for user references
const userMaster = new CollectionService('userMaster');

// Create a new user reference
app.post('/users', (req, res) => {
  const referenceData = req.body;
  const createdReference = userMaster.createReference(referenceData);
  res.status(201).json(createdReference);
});

// Get a user reference by ID
app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  const reference = userMaster.getReference(userId);

  if (reference) {
    res.json(reference);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Update a user reference by ID
app.put('/users/:id', (req, res) => {
  const userId = req.params.id;
  const referenceData = req.body;
  userMaster.updateReference(userId, referenceData);
  const reference = userMaster.getReference(userId);
  res.json(reference);
});

// Delete a user reference by ID
app.delete('/users/:id', (req, res) => {
  const userId = req.params.id;
  userMaster.deleteReference(userId);
  res.sendStatus(204);
});


// Get the list of all users
app.get('/users', (req, res) => {
    const users = userMaster.getAllDocs();
    res.json(users);
  });

// Start the server
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
