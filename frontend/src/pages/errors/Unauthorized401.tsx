import { Navigate } from "react-router";

export default function Unauthorized401() {
  return (
    <div className="flex items-center justify-center h-screen">
      <button
        onClick={() => Navigate({ to: "/login", replace: true })}
        className="btn btn-primary"
      >
        Ir a login
      </button>
      <button
        onClick={() => Navigate({ to: "/", replace: true })}
        className="btn btn-secondary"
      >
        Ir a home
      </button>
      <br />
      <h1>401 Unauthorized</h1>
    </div>
  );
}
