# Bookstore Application

This is a full-stack Bookstore application built using **Node.js**, **Express**, **PostgreSQL**, and **bcrypt** for password hashing. The project includes features such as user authentication and book management.

## Features

- User registration and login (authentication using JWT tokens)
- Secure password storage with bcrypt
- Add, view, and manage books in the bookstore

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/bookstore-app.git
   cd bookstore-app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables. Create a `.env` file in the root directory with the following values:

   ```bash
   DATABASE_URL=your_database_url
   JWT_SECRET=your_jwt_secret
   ```

4. Create the PostgreSQL database and tables. Here's an example of how to create the users and books table:

   ```sql
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     email VARCHAR(100) UNIQUE NOT NULL,
     password VARCHAR(100) NOT NULL
   );

   CREATE TABLE books (
     id SERIAL PRIMARY KEY,
     title VARCHAR(255) NOT NULL,
     author VARCHAR(255) NOT NULL,
     genre VARCHAR(100),
     image_url VARCHAR(255)
   );
   ```

5. Run the application:

   ```bash
   npm start
   ```

6. Access the application on `http://localhost:3000`.

## API Endpoints

### User Authentication

- **POST** `/register` – Register a new user
  - Request body:
    ```json
    {
      "email": "test@example.com",
      "password": "password123"
    }
    ```
  - Response: `201 Created`

- **POST** `/login` – Log in a user and receive a JWT token
  - Request body:
    ```json
    {
      "email": "test@example.com",
      "password": "password123"
    }
    ```
  - Response: 
    ```json
    {
      "token": "your_jwt_token"
    }
    ```

### Book Management

- **GET** `/books` – Get a list of all books (with optional pagination)
  - Query parameters: `page` (default: 1), `limit` (default: 10)

- **POST** `/add-book` – Add a new book (Protected: requires a valid JWT token)
  - Request body:
    ```json
    {
      "title": "Book Title",
      "author": "Author Name",
      "genre": "Genre",
      "image_url": "http://example.com/cover.jpg"
    }
    ```
  - Response: `201 Created`

### Search and Filter

- **GET** `/books/search` – Search books by title, author, or genre
  - Query parameters: `title`, `author`, `genre`

## Future Enhancements

- Add user roles (admin, regular users)
- Implement book reviews and ratings
- Optimise database queries for better performance
- Search functionality
- Pagination
- Image uploads
- Deployment