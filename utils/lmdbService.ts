import { RootDatabase, open } from 'lmdb';

class LMDBInstance {
    private static _instance: LMDBInstance;
    private db: RootDatabase;

    private constructor(path: string) {
        if (!path) {
            throw new Error('Path is required');
        }
        this.db = open({
            path,
            maxReaders: 100,
            mapSize: 2 * 1024 * 1024 * 1024, // 2GB
        });
    }

    // Static method to get the singleton instance
    public static getInstance(path: string): LMDBInstance {
        if (!LMDBInstance._instance) {
            LMDBInstance._instance = new LMDBInstance(path);
        }
        return LMDBInstance._instance;
    }

    // Getter for the database instance
    public getDB(): RootDatabase {
        return this.db;
    }
}

export default function getDb(path: string): RootDatabase {
    return LMDBInstance.getInstance(path).getDB();
}
