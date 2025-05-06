import { useState } from 'react';
import { Link } from 'wouter';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="text-primary text-2xl">
            <i className="fas fa-chart-line"></i>
          </div>
          <h1 className="text-lg font-bold text-primary-900">LendScore</h1>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-primary font-medium flex items-center">
            <i className="fas fa-home mr-2"></i> Dashboard
          </Link>
          <Link href="/" className="text-neutral-600 hover:text-primary transition flex items-center">
            <i className="fas fa-users mr-2"></i> Applicants
          </Link>
          <Link href="/" className="text-neutral-600 hover:text-primary transition flex items-center">
            <i className="fas fa-file-contract mr-2"></i> Loans
          </Link>
          <Link href="/" className="text-neutral-600 hover:text-primary transition flex items-center">
            <i className="fas fa-cog mr-2"></i> Settings
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col space-y-4 mt-8">
                <Link href="/" onClick={closeMenu} className="text-primary font-medium flex items-center py-2">
                  <i className="fas fa-home mr-2"></i> Dashboard
                </Link>
                <Link href="/" onClick={closeMenu} className="text-neutral-600 hover:text-primary transition flex items-center py-2">
                  <i className="fas fa-users mr-2"></i> Applicants
                </Link>
                <Link href="/" onClick={closeMenu} className="text-neutral-600 hover:text-primary transition flex items-center py-2">
                  <i className="fas fa-file-contract mr-2"></i> Loans
                </Link>
                <Link href="/" onClick={closeMenu} className="text-neutral-600 hover:text-primary transition flex items-center py-2">
                  <i className="fas fa-cog mr-2"></i> Settings
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          
          <div className="hidden md:flex items-center space-x-1">
            <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center">
              <i className="fas fa-user-tie"></i>
            </div>
            <span className="text-sm font-medium">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
