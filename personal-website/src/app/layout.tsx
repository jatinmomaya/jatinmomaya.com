import ConditionalHeader from '../components/ConditionalHeader';
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConditionalHeader />
        {children}
      </body>
    </html>
  );
}
