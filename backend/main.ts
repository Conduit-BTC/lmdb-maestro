import express from 'express';
import getDb from '../utils/lmdbService';
import cors from "cors";

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

// Get all sub-databases and their keys
app.get('/keys', (req, res) => {
    try {
        console.log('GET /keys');
        const { path } = req.query;

        if (!path) {
            console.log('Error: Path is required');
            res.status(400).json({ error: 'Path is required' });
            return;
        }

        console.log(`Attempting to open LMDB at path: ${path}`);
        let db;
        try {
            db = getDb(path as string);
            console.log('Successfully opened LMDB database');
        } catch (error) {
            console.error(`Failed to open LMDB at path ${path}:`, error);
            res.status(500).json({ error: `Failed to open database: ${error.message}` });
            return;
        }

        // Check if we have any keys at all
        const allKeys = Array.from(db.getKeys());
        console.log(`Total keys at root level: ${allKeys.length}`);
        console.log('Root keys:', allKeys);

        const subDbs = [];

        // Iterate through each sub-database
        if (allKeys.length === 0) {
            console.log('No keys found in the database');
        } else {
            for (const subDbName of allKeys) {
                try {
                    console.log(`Processing subDB: ${subDbName}`);
                    const subDb = db.openDB(subDbName);

                    // Verify the sub-database was opened successfully
                    if (!subDb) {
                        console.log(`Failed to open subDB: ${subDbName} - null or undefined result`);
                        subDbs.push({
                            name: subDbName,
                            keys: [],
                            keyCount: 0,
                            error: 'Failed to open sub-database'
                        });
                        continue;
                    }

                    // Get keys from the sub-database
                    let subKeys;
                    try {
                        subKeys = Array.from(subDb.getKeys());
                        console.log(`SubDB ${subDbName} has ${subKeys.length} keys`);
                    } catch (keyError) {
                        console.error(`Error getting keys for subDB ${subDbName}:`, keyError);
                        subDbs.push({
                            name: subDbName,
                            keys: [],
                            keyCount: 0,
                            error: `Failed to get keys: ${keyError.message}`
                        });
                        continue;
                    }

                    // Add the sub-database with its keys and metadata
                    subDbs.push({
                        name: subDbName,
                        keys: subKeys,
                        keyCount: subKeys.length
                    });
                } catch (error) {
                    console.error(`Error processing sub-database ${subDbName}:`, error);
                    subDbs.push({
                        name: subDbName,
                        keys: [],
                        keyCount: 0,
                        error: `Failed to process: ${error.message}`
                    });
                }
            }
        }

        console.log(`Returning ${subDbs.length} sub-databases`);
        res.json({ subDbs });
    } catch (error) {
        console.error('Unhandled error in /keys endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a sub-database
app.delete('/delete', (req, res) => {
    try {
        console.log('DELETE /delete');
        const { path, subDb, key } = req.query;

        if (!path) {
            res.status(400).json({ error: 'Path is required' });
            return;
        }

        if (!subDb) {
            res.status(400).json({ error: 'Sub-database name is required' });
            return;
        }

        const db = getDb(path as string);

        // If key is provided, delete a specific key from the sub-database
        if (key) {
            try {
                const subDbInstance = db.openDB(subDb as string);
                subDbInstance.remove(key);
                res.json({ success: true, message: `Key '${key}' deleted from '${subDb}'` });
            } catch (error) {
                res.status(500).json({
                    error: `Failed to delete key '${key}' from '${subDb}': ${error.message}`
                });
            }
        } else {
            // Delete the entire sub-database
            db.remove(subDb);
            res.json({ success: true, message: `Sub-database '${subDb}' deleted` });
        }
    } catch (error) {
        console.error('Error in /delete endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get values for a specific key in a sub-database
app.get('/values', (req, res) => {
    try {
        console.log('GET /values');
        const { path, subDb, key } = req.query;

        if (!path) {
            res.status(400).json({ error: 'Path is required' });
            return;
        }

        if (!subDb) {
            res.status(400).json({ error: 'Sub-database name is required' });
            return;
        }

        if (!key) {
            res.status(400).json({ error: 'Key is required' });
            return;
        }

        const db = getDb(path as string);
        const subDbInstance = db.openDB(subDb as string);
        const value = subDbInstance.get(key);

        res.json({
            subDb: subDb,
            key: key,
            value: value
        });
    } catch (error) {
        console.error('Error in /values endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
