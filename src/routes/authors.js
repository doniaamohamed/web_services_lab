const express = require('express');
const db = require('../../db/database');

const router = express.Router();

// GET /authors
// Return all authors.
router.get('/', (req, res) => {
  const authors = db.prepare("SELECT * FROM authors").all();
  res.json(authors);
  // res.status(501).json({ error: 'Not implemented' });
});

// GET /authors/:id
// Return a single author. 404 if not found.
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const author = db.prepare("SELECT * FROM authors WHERE id = ?").get(id);
  if (!author) {
    return res.status(404).json({ error: "Author not found" });
  }
  res.json(author);
  // res.status(501).json({ error: 'Not implemented' });
});

// POST /authors
// Create a new author. Body: { name, bio? }
// Respond 201 with the created author.
router.post('/', (req, res) => {
  const { name, bio } = req.body;
  const result = db.prepare("INSERT INTO authors (name, bio) VALUES (?, ?)").run(name, bio || null);
  const author = db.prepare("SELECT * FROM authors WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(author);
  // res.status(501).json({ error: 'Not implemented' });
});

// PATCH /authors/:id
// Update name and/or bio. Body: { name?, bio? }
// Respond 200 with the updated author. 404 if not found.
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { name, bio } = req.body;
  const author = db.prepare("SELECT * FROM authors WHERE id = ?").get(id);
  if (!author) {
    return res.status(404).json({ error: "Author not found" });
  }
  db.prepare( `UPDATE authors
    SET
      name = COALESCE(?, name),
      bio = COALESCE(?, bio)
    WHERE id = ?`
  ).run(name, bio, id);

  const updated = db.prepare("SELECT * FROM authors WHERE id = ?").get(id);
  res.json(updated);

  // res.status(501).json({ error: 'Not implemented' });
});

// DELETE /authors/:id
// Delete an author and their books (cascade). 204 on success. 404 if not found.
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const author = db.prepare("SELECT * FROM authors WHERE id = ?").get(id);
  if (!author) {
    return res.status(404).json({ error: "Author not found" });
  }
  db.prepare("DELETE FROM authors WHERE id = ?").run(id);
  res.sendStatus(204);
  // res.status(501).json({ error: 'Not implemented' });
});

// GET /authors/:id/books
// Return all books by this author. 404 if author not found.
router.get('/:id/books', (req, res) => {
  const { id } = req.params;
  const author = db.prepare("SELECT * FROM authors WHERE id = ?").get(id);
  if (!author) {
    return res.status(404).json({ error: "Author not found" });
  }
  const books = db.prepare("SELECT * FROM books WHERE author_id = ?").all(id);
  res.json(books);

  // res.status(501).json({ error: 'Not implemented' });
});

module.exports = router;
