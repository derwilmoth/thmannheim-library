import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { BookOpen, Search, Clock, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
              Willkommen in der Bibliothek
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Das digitale Büchereisystem der Technischen Hochschule Mannheim.
              Durchsuchen Sie unseren Katalog, leihen Sie Bücher aus und
              verwalten Sie Ihre Ausleihen.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/books">
                <Button
                  size="lg"
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  Zum Katalog
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 hover:text-background bg-transparent"
                >
                  Jetzt registrieren
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Unsere Services
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Großer Katalog</h3>
              <p className="text-muted-foreground">
                Tausende Bücher aus verschiedenen Fachbereichen stehen Ihnen zur
                Verfügung.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Einfache Suche</h3>
              <p className="text-muted-foreground">
                Finden Sie schnell das richtige Buch mit unserer intuitiven
                Suchfunktion.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flexible Ausleihe</h3>
              <p className="text-muted-foreground">
                Leihen Sie Bücher für bis zu 4 Wochen aus und verlängern Sie bei
                Bedarf.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Sicher & Zuverlässig
              </h3>
              <p className="text-muted-foreground">
                Ihre Daten sind bei uns sicher. Modernes System mit aktueller
                Technik.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Technische Hochschule Mannheim -
            Bibliothek
          </p>
        </div>
      </footer>
    </div>
  );
}
