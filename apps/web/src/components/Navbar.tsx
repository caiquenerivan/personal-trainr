import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logoCircleGolden from '../assets/logo-circle-golden.png';

const sections = [
  { id: 'como-funciona', label: 'Como funciona' },
  { id: 'recursos', label: 'Recursos' },
  { id: 'comecar', label: 'Começar' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );

    for (const { id } of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    observers.push(observer);
    return () => { for (const o of observers) o.disconnect(); };
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-base border-b border-border/30 flex items-center px-6 md:px-12">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        <button onClick={scrollToTop} className="flex items-center gap-3 cursor-pointer">
          <img src={logoCircleGolden} alt="Personal Trainr" className="w-9 h-9" />
          <span className="font-title text-white uppercase tracking-wider text-lg">
            Personal Trainr
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {sections.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className={`transition text-sm ${
                activeSection === id
                  ? 'text-accent'
                  : 'text-text-primary hover:text-white'
              }`}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-lg border border-border bg-transparent text-white h-11 px-6 flex items-center text-sm transition hover:bg-white/5"
          >
            Entrar
          </Link>
          <Link
            to="/cadastro"
            className="rounded-lg bg-accent text-black font-bold h-11 px-6 flex items-center text-sm transition hover:opacity-90 hover:scale-105 hover:shadow-lg hover:shadow-accent/50"
          >
            Cadastrar
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="md:hidden flex items-center justify-center text-text-primary min-h-[44px] min-w-[44px]"
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute top-20 left-0 right-0 bg-card border-t border-white/10 md:hidden">
          <div className="flex flex-col p-6 gap-4">
            {sections.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => setMobileOpen(false)}
                className={`transition text-sm py-2 ${
                  activeSection === id
                    ? 'text-accent'
                    : 'text-text-primary hover:text-white'
                }`}
              >
                {label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg border border-border bg-transparent text-white h-11 px-6 flex items-center justify-center text-sm transition hover:bg-white/5"
              >
                Entrar
              </Link>
              <Link
                to="/cadastro"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg bg-accent text-black font-bold h-11 px-6 flex items-center justify-center text-sm transition hover:opacity-90 hover:scale-105 hover:shadow-lg hover:shadow-accent/50"
              >
                Cadastrar
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
