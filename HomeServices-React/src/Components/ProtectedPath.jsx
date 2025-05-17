import { Navigate } from "react-router-dom";

const ProtectedPath = ({ comp, cond }) => {
  return cond ? comp : <Navigate to="/login" />;
};

export default ProtectedPath;
