import express from 'express';
import getDb from '../utils/lmdbService';
import cors from "cors";

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

app.get('/keys', (req, res) => {
    try {
        console.log('GET /keys');
        const { path } = req.query;
        if (!path) {
            res.status(400).json({ error: 'Path is required' });
            return;
        }

        const db = getDb(path);

        const keys = [];

        for (const key of db.getKeys()) {
            keys.push(key);
        }

        res.json({ keys });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/values', (req, res) => {
    try {
        console.log('GET /values');
        const { path, key } = req.query;
        if (!path) {
            res.status(400).json({ error: 'Path is required' });
            return;
        }
        if (!key) {
            res.status(400).json({ error: 'Key is required' });
            return;
        }

        const db = getDb(path);
        const value = db.get(key);

        res.json({ value });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
