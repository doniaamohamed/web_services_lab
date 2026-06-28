const typeDefs = `

type Author {
  id: ID!
  name: String!
  bio: String
  books: [Book!]!
}

type Book {
  id: ID!
  title: String!
  year: Int
  author: Author!
}

type Loan {
  id: ID!
  book: Book!
  borrowerName: String!
  loanedAt: String!
  returnedAt: String
}

type Query {
  authors: [Author!]!
  author(id: ID!): Author

  books(authorId: ID): [Book!]!
  book(id: ID!): Book

  loans(returned: Boolean): [Loan!]!
  loan(id: ID!): Loan
}

type Mutation {
  createAuthor(name: String!, bio: String): Author!
  updateAuthor(id: ID!, name: String, bio: String): Author
  deleteAuthor(id: ID!): Boolean!

  createBook(title: String!, year: Int, authorId: ID!): Book!
  updateBook(id: ID!, title: String, year: Int, authorId: ID): Book
  deleteBook(id: ID!): Boolean!

  checkoutBook(bookId: ID!, borrowerName: String!): Loan!
  returnBook(loanId: ID!): Loan!
}

`;

module.exports = typeDefs;