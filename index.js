const express = require('express');
const app = express();
const port = 3000;
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

app.use(express.json());

// Middleware to authenticate the token
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];
    // console.log("Token received:", token);

    if (!token) {
        return res.status(403).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        // Executre next middleware in pipeline
        next();
    } catch (err) {
        console.error("JWT verification failed:", err.message);
        res.status(401).json({ error: 'Invalid token.' });
    }
}

app.get('/', (req, res) => {
    res.send('Welcome to the Bookstore Inventory Management System!');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// GET all books in database
app.get('/books', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error: Error getting books.');
    }
});

// GET all users in database
app.get('/register', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error: Error getting users.');
    }
});

// GET a book by its ID
app.get('/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).send('Book not found');
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error: Cannot find specific book')
    }
});
// Add a new book (Protected Route)
app.post('/books', authenticateToken, async (req, res) => {
    try {
        const { title, author, genre, price, stock } = req.body;

        const result = await pool.query(
            'INSERT INTO books (title, author, genre, price, stock) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, author, genre, price, stock]
        );

        // Return the newly added book with a 201 status code
        const newBook = result.rows[0];
        res.status(201).json({
            message: 'Book added successfully!',
            book: newBook
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while adding the book.' });
    }
});


// Add a user
app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (email, password) VALUES ($1, $2)', [email, hashedPassword]
        );
        res.status(201).send('User created')
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error: Error creating user')
    }
});

// Login route
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        // Compare the provided password with the hashed password in the database
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Generate JWT
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Send token
        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// UPDATE a book with all parameters
app.put('/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, author, genre, price, stock } = req.body;

        const result = await pool.query(
            'UPDATE books SET title = $1, author = $2, genre = $3, price = $4, stock = $5 WHERE id = $6 RETURNING *',
            [title, author, genre, price, stock, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).send('Book not found');
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error: Error updating book.')
    }
});

// DELETE a book by its ID
app.delete('/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).send('Book not found');
        }

        res.send('Book deleted successfully');
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error: Cannot delete specific book')
    }
});

// PATCH an existing book with some parameters by its ID
app.patch('/books/:id', async (req, res) => {
    const { id } = req.params;
    const { title, author, genre, price, stock } = req.body;

    try {
        const fields = [];
        const values = [];

        // Check for each field and add to fields and values arrays if present
        if (title) {
            fields.push('title');
            values.push(title);
        }
        if (author) {
            fields.push('author');
            values.push(author);
        }
        if (genre) {
            fields.push('genre');
            values.push(genre);
        }
        if (price) {
            fields.push('price');
            values.push(price);
        }
        if (stock) {
            fields.push('stock');
            values.push(stock);
        }

        // If no fields are provided to update, return a 400 Bad Request
        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        // Construct the SET clause for the SQL query
        const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

        // Execute the SQL update query
        const result = await pool.query(
            `UPDATE books SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
            [...values, id]
        );

        // If the task with the given ID does not exist, return a 404 Not Found
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }

        // Return the updated book
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating book' });
    }
});

