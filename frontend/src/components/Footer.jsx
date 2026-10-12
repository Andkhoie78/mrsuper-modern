import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { useSite } from "../context/SiteContext";

function FacebookIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.19 2.23.19v2.45h-1.25c-1.24 0-1.62.77-1.62 1.56V12h2.76l-.44 2.89h-2.32v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" />
    </svg>
  );
}

export default function Footer() {
  const { config, locale } = useSite();

  const settings = config.settings || {};
  const navigation = config.navigation?.footer || [];

  return (
    <footer
      className="mt-18"
      style={{
        background: "var(--footer-background)",
        color: "var(--footer-text)",
      }}
    >
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div>
          <div
            className="flex items-center gap-2 text-lg font-black"
            style={{ color: "var(--footer-heading)" }}
          >
            <BookOpen />

            {settings.site_name || "MrSuper"}
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {settings.site_description ||
              "Your destination for practical online learning."}
          </p>

          <div className="mt-4 flex gap-3">
            {settings.facebook_url && (
              <a
                href={settings.facebook_url}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
              >
                <FacebookIcon />
              </a>
            )}

            {settings.instagram_url && (
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
            )}

            {settings.youtube_url && (
              <a
                href={settings.youtube_url}
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
              >
                <YoutubeIcon />
              </a>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-bold text-white">
            Explore
          </h4>

          <div className="mt-3 grid gap-2 text-sm">
            {navigation.slice(0, 6).map((item, index) => (
              <Link
                key={index}
                to={item.url}
              >
                {locale === "fa" && item.label_fa
                  ? item.label_fa
                  : item.label_en}
              </Link>
            ))}

            <Link to="/categories">
              Categories
            </Link>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-white">
            Company
          </h4>

          <div className="mt-3 grid gap-2 text-sm">
            <Link to="/about">
              About Us
            </Link>

            <Link to="/contact">
              Contact Us
            </Link>

            <Link to="/dashboard/support">
              Support
            </Link>

            <span>{settings.contact_email}</span>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-white">
            Contact
          </h4>

          <div className="mt-3 grid gap-2 text-sm text-slate-400">
            <span>
              {settings.contact_phone || "Phone can be set by Admin"}
            </span>

            <span>
              {settings.contact_address || "Afghanistan"}
            </span>

            <span>
              {settings.contact_email || "support@example.com"}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
        {settings.copyright_text ||
          `© ${new Date().getFullYear()} ${
            settings.site_name || "MrSuper"
          }. All rights reserved.`}
      </div>
    </footer>
  );
}