import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Home, Menu } from "lucide-react";
import Sidebar from "./components/Sidebar";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 10;
      setIsScrolled(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`sticky top-0 w-full z-20 transition-all duration-300 ${
          isScrolled
            ? "bg-primary/95 backdrop-blur-xl shadow-lg py-2"
            : "bg-primary shadow-md py-4"
        } text-primary-foreground`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleNavigation("/")}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <Home size={20} />
                <div>
                  <h1 className="text-xl md:text-2xl font-bold">RENTCHECK</h1>
                  <p className="text-xs md:text-sm opacity-90 hidden sm:block">
                    Sistema de Alquileres
                  </p>
                </div>
              </button>
            </div>

            {/* Desktop Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
                aria-label="Toggle menu"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
    </>
  );
}
