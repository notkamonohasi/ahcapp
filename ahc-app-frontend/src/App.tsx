import CodeTest from "./pages/CodeTest";
import Header from "./pages/Header";
import Home from "./pages/Home";
import "./pages/style.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";

// 機能へのアクセスに変数を挟む様にする
function Router() {
  return (
    <BrowserRouter>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/codetest" element={<CodeTest />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <>
      <Header />
      <div className="container">
        <Router />
      </div>
    </>
  );
}

export default App;
