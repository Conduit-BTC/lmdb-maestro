import { useState } from "react";
import "./App.css";

async function getKeys(path: string, setKeys: (keys: string[]) => void) {
  await fetch(`http://localhost:3001/keys?path=${path}`)
    .then((res) => res.json())
    .then((data) => {
      setKeys(data.keys);
      console.log("Got keys", data.keys);
    })
    .then(() => console.log("Finished fetch"))
    .catch((err) => console.error("Failed to get keys", err));
}

async function deleteItem(path: string, key: string) {
  await fetch(`http://localhost:3001/delete?path=${path}&key=${key}`, {
    method: "DELETE",
  })
    .then((res) => res.json())
    .then(() => console.log("Finished delete"))
    .catch((err) => console.error("Failed to delete", err));
}

function App() {
  const [keys, setKeys] = useState([]);

  return (
    <>
      <h1>LMDB Maestro</h1>
      <h2>Make a little magic</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const p = document.getElementById("path") as HTMLInputElement;
          if (!p) {
            console.error("No path input found");
            return;
          }
          await getKeys(p.value, setKeys);
        }}
      >
        <input
          id="path"
          type="text"
          placeholder="Enter a path to your .mdb file"
        />
        <button>Load</button>
      </form>

      <h3>Keys</h3>
      <ul>
        {keys.map((key) => (
          <section>
            <li key={key} style={{ textAlign: "left" }}>{key}</li>
            <DbItemControls dbKey={key} />
          </section>
        ))}
      </ul>
    </>
  );
}

function DbItemControls({ dbKey }: { dbKey: string }) {
  return (
    <div>
      <button
        onClick={() => {
          const p = document.getElementById("path") as HTMLInputElement;
          if (!p) {
            console.error("No path input found");
            return;
          }
          const path = p.value;
          console.log("Deleting", path, dbKey);
          deleteItem(path, dbKey);
        }}
      >
        Delete
      </button>
    </div>
  );
}

export default App;
