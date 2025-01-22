export default function Blog() {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Blog</h1>
        <p className="mb-4">
          Welcome to my blog! Here, I share my thoughts, insights, and updates on various topics.
        </p>
        <ul className="space-y-4">
          <li>
            <a href="#" className="text-blue-500 hover:underline">
              Blog Post 1
            </a>
            <p>placeholder</p>
          </li>
          <li>
            <a href="#" className="text-blue-500 hover:underline">
              Blog Post 2
            </a>
            <p>placeholder</p>
          </li>
          <li>
            <a href="#" className="text-blue-500 hover:underline">
              Blog Post 3
            </a>
            <p>placeholder</p>
          </li>
        </ul>
      </div>
    );
  }
  