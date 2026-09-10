import StaticPage from "./StaticPage";

export default function About() {
  return (
    <StaticPage title="About" description="Learn about RepairMyPDF, a simple online file utility platform." canonical="/about">
      <p>
        RepairMyPDF is an online file utility platform built to help people fix, convert and optimize PDFs,
        images and documents without installing software or creating an account.
      </p>
      <p>
        We're starting focused on PDF and image tools that solve everyday problems — a file that's too big to
        email, a document that needs merging, an image that needs converting — and expanding carefully from there.
      </p>
      <p>
        Every tool on RepairMyPDF either works as described or is clearly marked "Coming Soon." We don't publish
        placeholder buttons that don't do anything.
      </p>
    </StaticPage>
  );
}
