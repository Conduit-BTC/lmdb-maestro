import { open } from 'lmdb';

// Cache opened databases to avoid reopening the same one multiple times
const dbCache = new Map();

function getDb(path: string) {
    if (dbCache.has(path)) {
        return dbCache.get(path);
    }

    console.log(`Opening new LMDB database at: ${path}`);

    const db = open({
        path: path,
        // Add any additional configuration options here
        noSync: false,
        maxDbs: 100,
    });

    dbCache.set(path, db);
    return db;
}

export default getDb;
