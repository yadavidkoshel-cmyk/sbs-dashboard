import Home from "./pages/Home";
import Admin from "./pages/Admin";

function App() {
  const path = window.location.pathname;

  if (path === "/admin" || path === "/admin/") {
    return <Admin />;
  }

  return <Home />;
}

export default App;