import "./chunk-RPUOO7AV.mjs";

// src/routes/home/home.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jsx } from "react/jsx-runtime";
var Home = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/orders", { replace: true });
  }, [navigate]);
  return /* @__PURE__ */ jsx("div", {});
};
export {
  Home as Component
};
