import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TerraTrace AI | Wildlife Habitat Protection Network",
  description: "Global Wildlife Habitat Protection Network, powered by Trio AI Vision",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 全局兜底样式，强制黑底白字，永远不会出现白底 */}
      <body style={{
        margin: 0,
        padding: 0,
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: "#000000",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflowX: "hidden"
      }}>
        {children}
      </body>
    </html>
  );
}