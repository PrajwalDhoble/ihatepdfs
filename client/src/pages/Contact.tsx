import StaticPage from "./StaticPage";

export default function Contact() {
  return (
    <StaticPage title="Contact" description="Get in touch with the I Hate PDF team." canonical="/contact">
      <p>Have a question, found a bug, or want to suggest a tool? Reach out and we'll get back to you.</p>
      <p>
        Email: <a href="mailto:support@ihatepdf.net">support@ihatepdf.net</a>
      </p>
    </StaticPage>
  );
}
