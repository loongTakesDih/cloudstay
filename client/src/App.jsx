import { useState } from "react";
import api from "./api/api";

function App() {
  const [message, setMessage] = useState("");

  const testApi = async () => {
    try {
      const response = await api.get("/health");
      setMessage(response.data.message);
    } catch (error) {
      setMessage("API connection failed");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">CloudStay</h1>

      <button
        onClick={testApi}
        className="rounded-lg bg-black px-4 py-2 text-white"
      >
        Test Backend API
      </button>

      {message && <p className="text-lg">{message}</p>}
    </div>
  );
}

export default App;