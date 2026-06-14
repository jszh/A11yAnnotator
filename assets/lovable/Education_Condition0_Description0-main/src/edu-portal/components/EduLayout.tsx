import { Outlet } from "react-router-dom";
import EduHeader from "./EduHeader";
import EduFooter from "./EduFooter";

const EduLayout = () => (
  <div className="flex min-h-screen flex-col font-sans">
    <EduHeader />
    <main className="flex-1">
      <Outlet />
    </main>
    <EduFooter />
  </div>
);

export default EduLayout;
