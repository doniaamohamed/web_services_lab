const db = require("../../db/database");
const { GraphQLError } = require("graphql");

module.exports = {
  Query: {

    authors: () => {
      return db.prepare("SELECT * FROM authors").all();
    },

    author: (_, { id }) => {
      return db.prepare("SELECT * FROM authors WHERE id = ?").get(id) || null;
    },

    books: (_, { authorId }) => {
      if (authorId) {
        return db
          .prepare("SELECT * FROM books WHERE author_id = ?")
          .all(authorId);
      }

      return db.prepare("SELECT * FROM books").all();
    },

    book: (_, { id }) => {
      return db.prepare("SELECT * FROM books WHERE id = ?").get(id) || null;
    },

    loans: (_, { returned }) => {

      if (returned === true) {
        return db
          .prepare("SELECT * FROM loans WHERE returned_at IS NOT NULL")
          .all();
      }

      if (returned === false) {
        return db
          .prepare("SELECT * FROM loans WHERE returned_at IS NULL")
          .all();
      }

      return db.prepare("SELECT * FROM loans").all();
    },

    loan: (_, { id }) => {
      return db.prepare("SELECT * FROM loans WHERE id = ?").get(id) || null;
    }

  },

 Mutation: {
  createAuthor(_, { name, bio }) {

    const result = db
      .prepare("INSERT INTO authors(name,bio) VALUES(?,?)")
      .run(name, bio || null);

    return db
      .prepare("SELECT * FROM authors WHERE id=?")
      .get(result.lastInsertRowid);
  },

  updateAuthor(_, { id, name, bio }) {

    const author = db.prepare(
      "SELECT * FROM authors WHERE id=?"
    ).get(id);

    if (!author) return null;

    db.prepare(`
      UPDATE authors
      SET
        name = COALESCE(?,name),
        bio = COALESCE(?,bio)
      WHERE id=?
    `).run(name, bio, id);

    return db.prepare(
      "SELECT * FROM authors WHERE id=?"
    ).get(id);
  },

  deleteAuthor(_, { id }) {

    const author = db.prepare(
      "SELECT * FROM authors WHERE id=?"
    ).get(id);

    if (!author) return false;

    db.prepare("DELETE FROM authors WHERE id=?").run(id);

    return true;
  },



  // BOOKS

  createBook(_, { title, year, authorId }) {

    const author = db.prepare(
      "SELECT * FROM authors WHERE id=?"
    ).get(authorId);

    if (!author)
      throw new GraphQLError("Author not found");

    const result = db.prepare(`
      INSERT INTO books(title,year,author_id)
      VALUES(?,?,?)
    `).run(title, year || null, authorId);

    return db.prepare(
      "SELECT * FROM books WHERE id=?"
    ).get(result.lastInsertRowid);
  },

  updateBook(_, { id, title, year, authorId }) {

    const book = db.prepare(
      "SELECT * FROM books WHERE id=?"
    ).get(id);

    if (!book) return null;

    if (authorId) {

      const author = db.prepare(
        "SELECT * FROM authors WHERE id=?"
      ).get(authorId);

      if (!author)
        throw new GraphQLError("Author not found");
    }

    db.prepare(`
      UPDATE books
      SET
        title=COALESCE(?,title),
        year=COALESCE(?,year),
        author_id=COALESCE(?,author_id)
      WHERE id=?
    `).run(title, year, authorId, id);

    return db.prepare(
      "SELECT * FROM books WHERE id=?"
    ).get(id);
  },

  deleteBook(_, { id }) {

    const book = db.prepare(
      "SELECT * FROM books WHERE id=?"
    ).get(id);

    if (!book) return false;

    db.prepare(
      "DELETE FROM books WHERE id=?"
    ).run(id);

    return true;
  },



  //LOANS

  checkoutBook(_, { bookId, borrowerName }) {

    const book = db.prepare(
      "SELECT * FROM books WHERE id=?"
    ).get(bookId);

    if (!book)
      throw new GraphQLError("Book not found");

    const activeLoan = db.prepare(`
      SELECT *
      FROM loans
      WHERE book_id=?
      AND returned_at IS NULL
    `).get(bookId);

    if (activeLoan)
      throw new GraphQLError("Book already on loan");

    const today = new Date().toISOString().split("T")[0];

    const result = db.prepare(`
      INSERT INTO loans(book_id,borrower_name,loaned_at)
      VALUES(?,?,?)
    `).run(bookId, borrowerName, today);

    return db.prepare(
      "SELECT * FROM loans WHERE id=?"
    ).get(result.lastInsertRowid);
  },

  returnBook(_, { loanId }) {

    const loan = db.prepare(
      "SELECT * FROM loans WHERE id=?"
    ).get(loanId);

    if (!loan)
      throw new GraphQLError("Loan not found");

    if (loan.returned_at)
      throw new GraphQLError("Book already returned");

    const today = new Date().toISOString().split("T")[0];

    db.prepare(`
      UPDATE loans
      SET returned_at=?
      WHERE id=?
    `).run(today, loanId);

    return db.prepare(
      "SELECT * FROM loans WHERE id=?"
    ).get(loanId);
  }

},

  Author: {
    books(parent) {
    return db
      .prepare("SELECT * FROM books WHERE author_id = ?")
      .all(parent.id);
    }
  },

  Book: {
   author(parent) {
    return db
      .prepare("SELECT * FROM authors WHERE id = ?")
      .get(parent.author_id);
    }
  },

  Loan: {
    borrowerName(parent) {
    return parent.borrower_name;
  },

  loanedAt(parent) {
    return parent.loaned_at;
  },

  returnedAt(parent) {
    return parent.returned_at;
  },

  book(parent) {
    return db
      .prepare("SELECT * FROM books WHERE id = ?")
      .get(parent.book_id);
    }

  }
};