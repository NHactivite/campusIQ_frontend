
import Header from "../layout/Header";
import Footer from "../layout/Footer";
// import IntroGate from "../layout/IntroGate";

interface CommonLayoutProps {
  children: React.ReactNode;
}

export async function Commonlayout({
  children,
}: CommonLayoutProps) {
  return (
    // <IntroGate
    //   buttonLabel="Deeploy"
    //   once={true}
    // >
    //   <div className="mx-auto max-w-full">
    //     <Header />

    //     <main className="min-h-screen">
    //       {children}
    //     </main>

    //     <Footer />
    //   </div>
    // </IntroGate>
    <div className="mx-auto max-w-full">
        <Header />

        <main className="min-h-screen">
          {children}
        </main>

        <Footer />
      </div>
  );
}