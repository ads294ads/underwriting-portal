import { Link } from 'wouter';

export default function Footer() {
  return (
    <footer className="bg-neutral-800 text-neutral-400 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center space-x-2">
              <div className="text-primary-400 text-xl">
                <i className="fas fa-chart-line"></i>
              </div>
              <h2 className="text-white font-bold">LendScore</h2>
            </div>
            <p className="text-xs mt-2">Business loan evaluation platform</p>
          </div>
          <div className="flex space-x-6">
            <Link href="/">
              <a className="text-neutral-400 hover:text-white transition">
                Privacy Policy
              </a>
            </Link>
            <Link href="/">
              <a className="text-neutral-400 hover:text-white transition">
                Terms of Service
              </a>
            </Link>
            <Link href="/">
              <a className="text-neutral-400 hover:text-white transition">
                Contact
              </a>
            </Link>
          </div>
        </div>
        <div className="mt-6 text-center text-xs">
          &copy; {new Date().getFullYear()} LendScore. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
