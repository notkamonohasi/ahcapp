import { Box, Container } from "@mui/material";
import CodeTestHome from "./pages/codeTest/Home";
import Header from "./pages/Header";
import Home from "./pages/Home";
import "./pages/style.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";

// 機能へのアクセスに変数を挟む様にする
function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/codetest" element={<CodeTestHome />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        marginRight: "10px",
      }}
    >
      <Box sx={{ height: "60px" }}>
        <Header />
      </Box>
      <Container
        sx={{
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: "1100px",
            minHeight: "100vh",
            paddingTop: "30px",
            paddingLeft: "5%",
            paddingRight: "5%",
            paddingBottom: "50px",
            display: "flex",
            backgroundColor: "white",
            boxShadow: "0px 0px 20px rgba(0, 0, 0, 1.0)", // atcoder.jp
          }}
        >
          <Router />
        </Box>
      </Container>
    </Box>
  );
}

export default App;
