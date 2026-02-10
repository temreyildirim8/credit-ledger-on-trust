import { Link } from "@/routing";

/**
 * Footer component for marketing pages
 */
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <p className="footer__text">© 2025 Global Ledger. All rights reserved.</p>
        <div className="footer__links">
          <Link href="/about" className="footer__link">
            About
          </Link>
          <a
            href="https://nextjs.org"
            target="_blank"
            rel="noopener noreferrer"
            className="footer__link"
          >
            Next.js
          </a>
          <a
            href="https://next-intl-docs.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="footer__link"
          >
            next-intl
          </a>
        </div>
      </div>
    </footer>
  );
}
