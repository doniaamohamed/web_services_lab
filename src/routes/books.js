const express = require('express');
const db = require('../../db/database');

const router = express.Router();

// GET /books
// Return all books. Optional query param: ?author_id=<id>
router.get('/', (req, res) => {
  const { author_id } = req.query;
  let books;
  if (author_id) {
   books = db.prepare(`SELECT books.*,authors.name AS author
                      FROM books
                      JOIN authors ON books.author_id = authors.id
                      WHERE books.author_id = ?
                   `).all(author_id);
  } else {
    books = db.prepare("SELECT * FROM books").all();
  }
  res.json(books);
  // res.status(501).json({ error: 'Not implemented' });
});

// GET /books/:id
// Return a single book including its author info. 404 if not found.
router.get('/:id', (req, res) => {
  const { id } = req.params;

  const book = db.prepare(` SELECT books.id, books.title, books.year, books.author_id, authors.name AS author_name, authors.bio AS author_bio
    FROM books
    JOIN authors ON books.author_id = authors.id
    WHERE books.id = ?
  `).get(id);

  if (!book) {
    return res.status(404).json({ error: "Book not found" });
  }

  res.json({id: book.id,title: book.title,year: book.year,author: { id: book.author_id, name: book.author_name, bio: book.author_bio}
  });
  // res.status(501).json({ error: 'Not implemented' });
});

// POST /books
// Create a new book. Body: { title, year?, author_id }
// Respond 201 with the created book. 404 if author_id does not exist.
router.post('/', (req, res) => {
  const { title, year, author_id } = req.body;
  const author = db.prepare("SELECT * FROM authors WHERE id = ?").get(author_id);
  if (!author) {
    return res.status(404).json({ error: "Author not found" });
  }
  const result = db.prepare("INSERT INTO books (title, year, author_id) VALUES (?, ?, ?)").run(title, year || null, author_id);
  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(book);
  // res.status(501).json({ error: 'Not implemented' });
});

// PATCH /books/:id
// Update title, year, or author_id. Body: { title?, year?, author_id? }
// Respond 200 with the updated book. 404 if not found.
router.patch('/:id', (req, res) => {
  // res.status(501).json({ error: 'Not implemented' });
  const { id } = req.params;
  const { title, year, author_id } = req.body;

  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(id);
  if (!book) {
    return res.status(404).json({ error: "Book not found" });
  }

  if (author_id) {
    const author = db.prepare("SELECT * FROM authors WHERE id = ?").get(author_id);

    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }
  }
   db.prepare(`
    UPDATE books
    SET
      title = COALESCE(?, title),
      year = COALESCE(?, year),
      author_id = COALESCE(?, author_id)
    WHERE id = ?
  `).run(title, year, author_id, id);

  const updated = db.prepare("SELECT * FROM books WHERE id = ?").get(id);
  res.json(updated);
});

// DELETE /books/:id
// Delete a book. 204 on success. 404 if not found.
router.delete('/:id', (req, res) => {
  // res.status(501).json({ error: 'Not implemented' });
  const { id } = req.params;

  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(id);
  if (!book) {
    return res.status(404).json({ error: "Book not found" });
  }
  db.prepare("DELETE FROM books WHERE id = ?").run(id);
  res.sendStatus(204);
});

module.exports = router;
