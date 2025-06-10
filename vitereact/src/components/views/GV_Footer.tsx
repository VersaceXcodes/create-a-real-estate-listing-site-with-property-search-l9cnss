import React from "react";
import { Link } from "react-router-dom";

const GV_Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <nav className="flex flex-wrap justify-center">
              <Link to="/about" className="mx-2 hover:underline">
                About
              </Link>
              <Link to="/contact" className="mx-2 hover:underline">
                Contact
              </Link>
              <Link to="/terms" className="mx-2 hover:underline">
                Terms of Service
              </Link>
              <Link to="/privacy" className="mx-2 hover:underline">
                Privacy Policy
              </Link>
            </nav>
            <div className="flex justify-center mt-4 md:mt-0">
              <a href="#" className="mx-2" aria-label="Facebook">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className="fill-current hover:text-blue-500"
                >
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.12 8.44 9.88v-6.99H7.9v-2.89h2.54V9.41c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.89h-2.34v6.99C18.34 21.12 22 16.99 22 12z" />
                </svg>
              </a>
              <a href="#" className="mx-2" aria-label="Twitter">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className="fill-current hover:text-blue-400"
                >
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.26 4.26 0 001.88-2.35 8.48 8.48 0 01-2.7 1.03A4.22 4.22 0 0016.11 4c-2.33 0-4.22 1.87-4.22 4.18 0 .33.04.65.11.96-3.51-.18-6.62-1.85-8.7-4.39a4.18 4.18 0 00-.57 2.1c0 1.45.74 2.73 1.87 3.48a4.21 4.21 0 01-1.91-.52v.05c0 2.03 1.44 3.73 3.36 4.11a4.22 4.22 0 01-1.9.07c.53 1.66 2.05 2.87 3.86 2.91A8.45 8.45 0 012 19.54a11.94 11.94 0 006.29 1.84c7.55 0 11.68-6.22 11.68-11.61 0-.18 0-.35-.01-.53A8.18 8.18 0 0022.46 6z" />
                </svg>
              </a>
              <a href="#" className="mx-2" aria-label="Instagram">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className="fill-current hover:text-pink-500"
                >
                  <path d="M12 2.2c3.2 0 3.584.012 4.85.07 1.17.054 1.962.24 2.41.408.53.2.91.44 1.31.84.4.4.64.78.84 1.31.168.45.354 1.24.408 2.41.058 1.267.07 1.65.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.962-.408 2.41-.2.53-.44.91-.84 1.31-.4.4-.78.64-1.31.84-.45.168-1.24.354-2.41.408-1.267.058-1.65.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.962-.24-2.41-.408-.53-.2-.91-.44-1.31-.84-.4-.4-.64-.78-.84-1.31-.168-.45-.354-1.24-.408-2.41C2.212 15.584 2.2 15.2 2.2 12s.012-3.584.07-4.85c.054-1.17.24-1.962.408-2.41.2-.53.44-.91.84-1.31.4-.4.78-.64 1.31-.84.45-.168 1.24-.354 2.41-.408C8.416 2.212 8.8 2.2 12 2.2m0-2.2C8.74 0 8.332.015 7.052.072c-1.28.058-2.098.244-2.752.602a4.602 4.602 0 00-1.65 1.206A4.602 4.602 0 001.444 3.49c-.358.654-.544 1.472-.602 2.752C.015 8.332 0 8.74 0 12c0 3.26.015 3.668.072 4.948.058 1.28.244 2.098.602 2.752.311.64.746 1.19 1.206 1.65.46.46 1.01.895 1.65 1.206.654.358 1.472.544 2.752.602C8.332 23.985 8.74 24 12 24s3.668-.015 4.948-.072c1.28-.058 2.098-.244 2.752-.602.64-.311 1.19-.746 1.65-1.206.46-.46.895-1.01 1.206-1.65.358-.654.544-1.472.602-2.752.057-1.28.072-1.688.072-4.948 0-3.26-.015-3.668-.072-4.948-.058-1.28-.244-2.098-.602-2.752A4.602 4.602 0 0021.35 1.84c-.46-.46-1.01-.895-1.65-1.206-.654-.358-1.472-.544-2.752-.602C15.668.015 15.26 0 12 0z" />
                  <circle cx="12" cy="12" r="3.2" />
                </svg>
              </a>
            </div>
          </div>
          <div className="mt-4 text-center text-sm">
            <p>© {currentYear} EstateFinder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default GV_Footer;