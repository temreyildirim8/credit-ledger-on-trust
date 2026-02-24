import { Link } from "@/routing";
import { useLocale } from "next-intl";
import { getBrandName } from "@/lib/branding";

/**
 * Footer component for marketing pages
 */
export function Footer() {
  const locale = useLocale();
  const brandName = getBrandName(locale);

  return (
    <footer className="footer">
      <div className="footer__container">
        <p className="footer__text">© 2025 {brandName}. All rights reserved.</p>
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
