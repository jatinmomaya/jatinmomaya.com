export default function Bookshelf() {
    const books = [
      {
        title: "Steve Jobs",
        author: "Walter Isaacson",
        description:
          "The exclusive biography of Steve Jobs based on unprecedented access to his life.",
        image: "/books/steve-jobs.jpg",
      },
      {
        title: "Kitchen Confidential",
        author: "Anthony Bourdain",
        description:
          "A behind-the-scenes look at the restaurant industry from the late celebrity chef.",
        image: "/books/kitchen-confidential.jpg",
      },
      {
        title: "Never Finished",
        author: "David Goggins",
        description:
          "Inspiration from one of the world's toughest individuals on overcoming challenges.",
        image: "/books/never-finished.jpg",
      },
    ];
  
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Bookshelf</h1>
        <p className="mb-4">
          Here are some books I’ve read or am currently reading. Feel free to explore!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {books.map((book, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 flex flex-col items-center"
            >
              <img
                src={book.image}
                alt={book.title}
                className="w-32 h-48 object-cover mb-4"
              />
              <h2 className="text-xl font-semibold">{book.title}</h2>
              <p className="text-gray-500">by {book.author}</p>
              <p className="text-sm text-gray-700 mt-2">{book.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  