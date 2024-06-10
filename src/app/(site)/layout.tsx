import Footer from "~/components/footer/Footer";
import Header from "~/components/header/Header";
import Hero from "~/components/hero/Hero";
import RelaySheet from "~/components/relays/RelaySheet";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full">
      <div className="relative flex w-full flex-col">
        <main className="flex-auto">
          <div className="relative px-4">
            <div className="mx-auto w-full max-w-7xl">
              <div className="mx-auto max-w-4xl">
                <Header />
                <Hero />
                {children}
                <RelaySheet />
                <Footer />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
