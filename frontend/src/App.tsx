import { NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Rankings from "./pages/Rankings";

function App() {
  return (
    <>
      <nav className="nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          Home
        </NavLink>
        <NavLink to="/rankings" className={({ isActive }) => (isActive ? "active" : "")}>
          Agent Rankings
        </NavLink>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rankings" element={<Rankings />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
