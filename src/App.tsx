import { useEffect, useState } from "react";
import "./App.css";

interface SubDb {
  name: string;
  keys: string[];
  keyCount: number;
  error?: string;
}

// API functions
const API_URL = "http://localhost:3001";

async function getSubDatabases(path: string): Promise<SubDb[]> {
  console.log(`Fetching sub-databases from: ${path}`);
  try {
    const res = await fetch(`${API_URL}/keys?path=${encodeURIComponent(path)}`);
    const data = await res.json();

    if (!res.ok) {
      console.error("API error:", data);
      throw new Error(data.error || "Failed to fetch sub-databases");
    }

    console.log("API response:", data);

    // Ensure we have the expected data structure
    if (!data.subDbs) {
      console.error("Unexpected API response format:", data);
      throw new Error(
        "Unexpected API response format - missing subDbs property",
      );
    }

    return data.subDbs || [];
  } catch (error) {
    console.error("Error in getSubDatabases:", error);
    throw error;
  }
}

async function deleteSubDatabase(path: string, subDb: string): Promise<void> {
  const res = await fetch(
    `${API_URL}/delete?path=${encodeURIComponent(path)}&subDb=${
      encodeURIComponent(subDb)
    }`,
    { method: "DELETE" },
  );
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete sub-database");
  }
}

async function deleteSubDatabaseKey(
  path: string,
  subDb: string,
  key: string,
): Promise<void> {
  const res = await fetch(
    `${API_URL}/delete?path=${encodeURIComponent(path)}&subDb=${
      encodeURIComponent(subDb)
    }&key=${encodeURIComponent(key)}`,
    { method: "DELETE" },
  );
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete key");
  }
}

async function getKeyValue(
  path: string,
  subDb: string,
  key: string,
): Promise<any> {
  const res = await fetch(
    `${API_URL}/values?path=${encodeURIComponent(path)}&subDb=${
      encodeURIComponent(subDb)
    }&key=${encodeURIComponent(key)}`,
  );
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch value");
  }
  const data = await res.json();
  return data.value;
}

// Components
function KeyItem({
  dbPath,
  subDb,
  keyName,
  onDelete,
}: {
  dbPath: string;
  subDb: string;
  keyName: string;
  onDelete: () => void;
  onRefresh: () => void;
}) {
  const [value, setValue] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadValue = async () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setLoading(true);
      try {
        const data = await getKeyValue(dbPath, subDb, keyName);
        setValue(data);
      } catch (error) {
        console.error("Failed to load value:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setIsExpanded(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete key '${keyName}'?`)) {
      try {
        await deleteSubDatabaseKey(dbPath, subDb, keyName);
        onDelete();
      } catch (error) {
        console.error("Failed to delete key:", error);
        alert(`Failed to delete key: ${error.message}`);
      }
    }
  };

  return (
    <div className="key-item">
      <div className="key-header">
        <span onClick={loadValue} className="key-name">
          ◦ {keyName}
        </span>
        <button onClick={handleDelete} className="delete-btn">Delete</button>
      </div>

      {isExpanded && (
        <div className="key-value">
          {loading
            ? <p>Loading...</p>
            : <pre>{JSON.stringify(value, null, 2)}</pre>}
        </div>
      )}
    </div>
  );
}

function SubDbItem({
  dbPath,
  subDb,
  onDelete,
  onRefresh,
}: {
  dbPath: string;
  subDb: SubDb;
  onDelete: () => void;
  onRefresh: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDelete = async () => {
    if (
      confirm(`Are you sure you want to delete sub-database '${subDb.name}'?`)
    ) {
      try {
        await deleteSubDatabase(dbPath, subDb.name);
        onDelete();
      } catch (error) {
        console.error("Failed to delete sub-database:", error);
        alert(`Failed to delete sub-database: ${error.message}`);
      }
    }
  };

  return (
    <div className="subdb-item">
      <div className="subdb-header">
        <div
          className="subdb-name"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          • {subDb.name}{" "}
          <span className="key-count">({subDb.keyCount} keys)</span>
        </div>
        <button onClick={handleDelete} className="delete-btn">Delete</button>
      </div>

      {subDb.error && <div className="error-message">{subDb.error}</div>}

      {isExpanded && subDb.keys.length > 0 && (
        <div className="keys-container">
          {subDb.keys.map((key) => (
            <KeyItem
              key={key}
              dbPath={dbPath}
              subDb={subDb.name}
              keyName={key}
              onDelete={onRefresh}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const [dbPath, setDbPath] = useState<string>("/Users/aceaspades/Pro");
  const [subDbs, setSubDbs] = useState<SubDb[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDatabase = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSubDatabases(dbPath);
      setSubDbs(data);
    } catch (error) {
      console.error("Failed to load database:", error);
      setError(`Failed to load database: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load initial data if path is provided
    if (dbPath) {
      loadDatabase();
    }
  }, []);

  return (
    <div className="app-container">
      <header>
        <h1>LMDB Maestro</h1>
        <h2>Make a little magic</h2>
      </header>

      <div className="db-controls">
        <input
          type="text"
          value={dbPath}
          onChange={(e) => setDbPath(e.target.value)}
          placeholder="Enter path to .mdb file"
          className="path-input"
        />
        <button
          onClick={loadDatabase}
          disabled={loading}
          className="load-btn"
        >
          {loading ? "Loading..." : "Load"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {subDbs.length > 0
        ? (
          <div className="content-container">
            <h3>Sub Databases</h3>
            <div className="subdbs-list">
              {subDbs.map((subDb) => (
                <SubDbItem
                  key={subDb.name}
                  dbPath={dbPath}
                  subDb={subDb}
                  onDelete={loadDatabase}
                  onRefresh={loadDatabase}
                />
              ))}
            </div>
          </div>
        )
        : !loading && !error
        ? (
          <div className="empty-state">
            No sub-databases found. Enter a valid LMDB path and click Load.
          </div>
        )
        : null}
    </div>
  );
}

export default App;
