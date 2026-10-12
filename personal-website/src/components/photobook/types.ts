export interface PhotobookPhoto {
  src: string;
  caption: string;
  alt: string;
  /** Intrinsic dimensions; passed to <img> to prevent reflow. */
  width: number;
  height: number;
}

export interface PhotobookChapter {
  /** Stable id, also the folder name under public/photos/. */
  id: string;
  /** Display title, e.g. 'Mexico'. */
  title: string;
  /** Display subtitle, e.g. 'September 2026'. */
  subtitle: string;
  /** Photos in display order. */
  photos: PhotobookPhoto[];
}
