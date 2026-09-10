import StaticPage from "./StaticPage";
import { Link } from "react-router-dom";

export default function Help() {
  return (
    <StaticPage title="Help" description="Get help using RepairMyPDF tools." canonical="/help">
      <p>Most tools follow the same steps: upload your file, adjust options if needed, run the tool, then download your result.</p>
      <h2>Common questions</h2>
      <p>
        <strong>Why can't I upload my file?</strong> Check that it matches the accepted format and is under the size
        limit shown on the tool page.
      </p>
      <p>
        <strong>A tool says "Coming Soon" — when will it be ready?</strong> We're building tools incrementally; check
        back or watch the <Link to="/">homepage</Link> for updates.
      </p>
      <p>Still stuck? <Link to="/contact">Contact us</Link>.</p>
    </StaticPage>
  );
}
