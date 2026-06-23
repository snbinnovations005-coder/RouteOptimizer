import MapComponent from "@/components/MapComponent";

export default function Home() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || "";

  return (
    <main className="flex flex-col min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-500 tracking-tight">
          🗺️ Route Optimizer
        </h1>
        <p className="mt-1 text-gray-500 text-sm">
          Paste Google Maps links → get the shortest optimized driving route (TSP)
        </p>
      </header>

      <div className="flex-1 w-full bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
        <MapComponent apiKey={apiKey} />
      </div>
    </main>
  );
}

