import StaticPage from "./StaticPage";

export default function Security() {
  return (
    <StaticPage title="Security" description="How RepairMyPDF keeps your files and data safe." canonical="/security">
      <p>We treat every uploaded file as untrusted input and validate it before processing:</p>
      <ul>
        <li>File type is checked against its actual signature, not just its extension or claimed MIME type.</li>
        <li>File size limits are enforced per tool.</li>
        <li>Filenames are sanitized before use on the server.</li>
        <li>Each job runs in an isolated temporary workspace that is deleted after use.</li>
        <li>Processing runs with timeouts and resource limits to prevent abuse.</li>
        <li>Traffic to processing endpoints is rate-limited.</li>
      </ul>
      <p>
        Found a security issue? Please report it to{" "}
        <a href="mailto:security@repairmypdf.com">security@repairmypdf.com</a>.
      </p>
    </StaticPage>
  );
}
