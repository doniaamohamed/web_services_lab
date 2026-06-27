const express = require('express');
const db = require('../../db/database');

const router = express.Router();

// GET /loans
// Return all loans. Optional query param: ?returned=true|false
// (filter by whether returned_at is set)
router.get('/', (req, res) => {
  const { returned } = req.query;
  let loans;

  if (returned === "true") {
    loans = db.prepare("SELECT * FROM loans WHERE returned_at IS NOT NULL").all();
  } else if (returned === "false") {
    loans = db.prepare("SELECT * FROM loans WHERE returned_at IS NULL").all();
  } else {
    loans = db.prepare("SELECT * FROM loans").all();
  }
  res.json(loans);

  // res.status(501).json({ error: 'Not implemented' });
});

// GET /loans/:id
// Return a single loan including book info. 404 if not found.
router.get('/:id', (req, res) => {
  const loan = db.prepare(`SELECT loans.*,books.id AS b_id,books.title,books.year,books.author_id
    FROM loans
    JOIN books ON loans.book_id = books.id
    WHERE loans.id = ?
  `).get(req.params.id);

  if (!loan) {
    return res.status(404).json({ error: "Loan not found" });
  }
  res.json({
  id: loan.id,
  book_id: loan.book_id,
  borrower_name: loan.borrower_name,
  loaned_at: loan.loaned_at,
  returned_at: loan.returned_at,
  book: {
    id: loan.b_id,
    title: loan.title,
    year: loan.year,
    author_id: loan.author_id
  }
});
  // res.status(501).json({ error: 'Not implemented' });
});

// POST /loans
// Check out a book. Body: { book_id, borrower_name }
// 404 if book not found.
// 409 if the book is already on active loan (returned_at IS NULL).
// Respond 201 with the created loan.
router.post('/', (req, res) => {
  const { book_id, borrower_name } = req.body;

  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(book_id);

  if (!book) {
    return res.status(404).json({ error: "Book not found" });
  }

  const activeLoan = db.prepare("SELECT * FROM loans WHERE book_id = ? AND returned_at IS NULL").get(book_id);

  if (activeLoan) {
    return res.status(409).json({
      error: "Book is already on loan",
    });
  }

  const today = new Date().toISOString().split("T")[0];

  const result = db.prepare(`INSERT INTO loans (book_id, borrower_name, loaned_at) VALUES (?, ?, ?)`).run(book_id, borrower_name, today);

  const loan = db.prepare("SELECT * FROM loans WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(loan);
  // res.status(501).json({ error: 'Not implemented' });
});

// PATCH /loans/:id/return
// Mark a loan as returned (set returned_at = today).
// 404 if loan not found. 409 if already returned.
// Respond 200 with the updated loan.
router.patch('/:id/return', (req, res) => {
  // res.status(501).json({ error: 'Not implemented' });
  const loan = db.prepare("SELECT * FROM loans WHERE id = ?").get(req.params.id);
  if (!loan) {
    return res.status(404).json({ error: "Loan not found" });
  }

  if (loan.returned_at) {
    return res.status(409).json({
      error: "Book already returned",
    });
  }

  const today = new Date().toISOString().split("T")[0];

  db.prepare("UPDATE loans SET returned_at = ? WHERE id = ?").run(today, req.params.id);

  const updated = db.prepare("SELECT * FROM loans WHERE id = ?").get(req.params.id);
  res.json(updated);
});

module.exports = router;
