import { Outlet } from "react-router-dom";
import GovHeader from "./GovHeader";
import GovFooter from "./GovFooter";

const GovLayout = () => (
  <>
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
    <GovHeader />
    <main id="main-content" tabIndex={-1}>
      <Outlet />
    </main>
    <GovFooter />
  </>
);

export default GovLayout;
