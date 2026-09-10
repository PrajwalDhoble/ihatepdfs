import StaticPage from "./StaticPage";

export default function Privacy() {
  return (
    <StaticPage title="Privacy Policy" description="How RepairMyPDF handles your files and data." canonical="/privacy">
      <p><strong>Last updated:</strong> {new Date().getFullYear()}</p>
      <h2>File processing</h2>
      <p>
        Files you upload are processed in an isolated, temporary workspace on our servers (or directly in your
        browser for tools marked as client-side). Files are automatically deleted after processing completes, after
        you download the result, or after a short expiration window — whichever comes first.
      </p>
      <h2>What we don't do</h2>
      <p>We do not permanently store your uploaded files by default, and we do not sell your files or their contents.</p>
      <h2>Analytics</h2>
      <p>
        We collect minimal, aggregated usage events (such as which tool was used and whether processing succeeded)
        to improve the product. We do not collect unnecessary personal information.
      </p>
      <h2>Cookies</h2>
      <p>Basic cookies may be used for essential site functionality. Any analytics or advertising cookies will be disclosed here as they're introduced.</p>
    </StaticPage>
  );
}
