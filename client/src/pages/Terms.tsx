import StaticPage from "./StaticPage";

export default function Terms() {
  return (
    <StaticPage title="Terms of Service" description="Terms of use for I Hate PDF." canonical="/terms">
      <p><strong>Last updated:</strong> {new Date().getFullYear()}</p>
      <h2>Use of the service</h2>
      <p>I Hate PDF provides online file utility tools "as is." You're responsible for the files you upload and for having the right to process them.</p>
      <h2>Prohibited use</h2>
      <p>You may not use I Hate PDF to process files you don't have rights to, or to attempt to disrupt, exploit, or gain unauthorized access to the service.</p>
      <h2>Availability</h2>
      <p>Tools marked "Coming Soon" are not yet available. We aim for high uptime but do not guarantee uninterrupted service.</p>
      <h2>Limitation of liability</h2>
      <p>I Hate PDF is provided without warranties of any kind. We are not liable for data loss resulting from use of the service; always keep your own backups of important files.</p>
    </StaticPage>
  );
}
