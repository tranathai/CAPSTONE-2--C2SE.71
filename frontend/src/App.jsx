import { Routes, Route } from "react-router-dom";
import Layout from "./components/UI/Layout";
import ReviewPage from "./components/Content/ReviewPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ReviewPage />} />
        <Route path="review" element={<ReviewPage />} />
      </Route>
    </Routes>
  );
}

export default App;
