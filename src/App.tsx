import { useEffect, useState } from "react";
import "./App.css";

async function getKeys(path: string, setKeys: (keys: string[]) => void) {
  console.log("Starting fetch");
  await fetch(`http://localhost:3001/keys?path=${path}`)
    .then((res) => res.json())
    .then((data) => {
      setKeys(data.keys);
      console.log("Got keys", data.keys);
    })
    .then(() => console.log("Finished fetch"))
    .catch((err) => console.error("Failed to get keys", err));
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
          <li key={key} style={{ textAlign: "left" }}>{key}</li>
        ))}
      </ul>
    </>
  );
}

export default App;
