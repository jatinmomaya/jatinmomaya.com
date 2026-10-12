/** Front-cover artwork for each navigation book (SVG, drawn to match the v6 mockup). */
import type { ComponentType } from 'react';

export function PhotosCover() {
  return (
    <svg viewBox="0 0 150 200" role="img" aria-label="Mexico photobook cover">
      <rect width="150" height="200" fill="#33523f" />
      <rect width="11" height="200" fill="#273f31" />
      <rect x="28" y="24" width="94" height="72" fill="#f3ead6" />
      <circle cx="100" cy="43" r="7" fill="#d9a441" />
      <path d="M28 96 L62 53 L88 79 L102 65 L122 83 L122 96 Z" fill="#7a8a99" />
      <path d="M28 96 L56 64 L78 84 L94 72 L122 96 Z" fill="#5a6a79" opacity="0.8" />
      <text x="75" y="140" textAnchor="middle" fontSize="17" letterSpacing="5" fill="#f3ead6" fontFamily="ui-monospace, monospace">MEXICO</text>
      <text x="75" y="162" textAnchor="middle" fontSize="10" letterSpacing="4" fill="#f3ead6" fontFamily="ui-monospace, monospace" opacity="0.85">PHOTOBOOK</text>
      <line x1="52" y1="176" x2="98" y2="176" stroke="#f3ead6" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

export function FieldNotesCover() {
  return (
    <svg viewBox="0 0 150 200" role="img" aria-label="Field notes book cover">
      <rect width="150" height="200" fill="#dcc9a3" />
      <g stroke="#4a4a4a" strokeWidth="2.4" fill="none">
        <circle cx="10" cy="22" r="5" /><circle cx="10" cy="42" r="5" /><circle cx="10" cy="62" r="5" />
        <circle cx="10" cy="82" r="5" /><circle cx="10" cy="102" r="5" /><circle cx="10" cy="122" r="5" />
        <circle cx="10" cy="142" r="5" /><circle cx="10" cy="162" r="5" /><circle cx="10" cy="182" r="5" />
      </g>
      <rect x="38" y="52" width="84" height="30" fill="#f3ead6" />
      <text x="80" y="72" textAnchor="middle" fontSize="11" letterSpacing="2" fill="#4a3b22" fontFamily="ui-monospace, monospace">FIELD NOTES</text>
      <line x1="38" y1="104" x2="122" y2="104" stroke="#b89b62" strokeWidth="3" />
      <line x1="38" y1="118" x2="122" y2="118" stroke="#b89b62" strokeWidth="3" />
      <line x1="38" y1="132" x2="104" y2="132" stroke="#b89b62" strokeWidth="3" />
    </svg>
  );
}

export function AboutCover() {
  return (
    <svg viewBox="0 0 150 200" role="img" aria-label="About book cover">
      <rect width="150" height="200" fill="#2e3d5c" />
      <rect width="11" height="200" fill="#232f49" />
      <circle cx="75" cy="30" r="4" fill="none" stroke="#8a93a8" strokeWidth="2" />
      <circle cx="75" cy="170" r="4" fill="none" stroke="#8a93a8" strokeWidth="2" />
      <rect x="42" y="72" width="66" height="52" fill="#f3ead6" />
      <text x="75" y="102" textAnchor="middle" fontSize="12" letterSpacing="2" fill="#2e3d5c" fontFamily="ui-monospace, monospace">ABOUT</text>
    </svg>
  );
}

export const BOOK_COVERS: Record<string, ComponentType> = {
  photos: PhotosCover,
  'field-notes': FieldNotesCover,
  about: AboutCover,
};
