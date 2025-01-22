export default function Photography() {
    const photos = [
      { src: "/photos/2023/january/photo1.jpg", alt: "Photo 1", year: 2023, month: "January" },
      { src: "/photos/2023/january/photo2.jpg", alt: "Photo 2", year: 2023, month: "January" },
      { src: "/photos/2023/february/photo1.jpg", alt: "Photo 3", year: 2023, month: "February" },
      { src: "/photos/2022/december/photo1.jpg", alt: "Photo 4", year: 2022, month: "December" },
    ];
  
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Photography</h1>
        <p className="mb-4">
          Explore my photography portfolio, organized by year and month.
        </p>
        {Array.from(new Set(photos.map((photo) => photo.year))).map((year) => (
          <div key={year} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{year}</h2>
            {Array.from(new Set(photos.filter((p) => p.year === year).map((p) => p.month))).map(
              (month) => (
                <div key={month} className="mb-4">
                  <h3 className="text-xl font-semibold mb-2">{month}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photos
                      .filter((photo) => photo.year === year && photo.month === month)
                      .map((photo, index) => (
                        <img
                          key={index}
                          src={photo.src}
                          alt={photo.alt}
                          className="w-full h-48 object-cover rounded-md shadow-md"
                        />
                      ))}
                  </div>
                </div>
              )
            )}
          </div>
        ))}
      </div>
    );
  }
  