import "./globals.css";
import LayoutShell from "./components/LayoutShell";

export const metadata = {
  title: "Didacticiel 8ème",
  description: "Espace de révision pour élèves et suivi pour enseignants.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
