export default function Resume() {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Resume</h1>
        <p className="mb-4">
          Below is my resume. Feel free to view or download it!
        </p>
        <iframe
          src="/resume.pdf"
          className="w-full h-screen border-2 border-gray-300"
          title="Resume"
        ></iframe>
      </div>
    );
  }
  