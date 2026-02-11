import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/navbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();

  return (
    <div className="page">
      <Navbar />

      <main className="main">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero__grain" />
          <div className="hero__container">
            <div className="hero__content">
              <h1 className="hero__title">
                <span className="hero__title-main">{t("home.hero.title")}</span>
                <span className="hero__title-accent">{t("home.hero.subtitle")}</span>
              </h1>
              <p className="hero__description">{t("home.hero.description")}</p>
              <div className="hero__actions">
                <button className="btn btn--primary">
                  {t("home.hero.cta")}
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M4 10H16M16 10L11 5M16 10L11 15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button className="btn btn--secondary">
                  {t("home.hero.secondary")}
                </button>
              </div>
            </div>

            <div className="hero__visual">
              <div className="hero__card hero__card--1">
                <div className="card-stat">
                  <div className="card-stat__value">{t("home.stats.users")}</div>
                  <div className="card-stat__label">{t("home.stats.usersLabel")}</div>
                </div>
              </div>
              <div className="hero__card hero__card--2">
                <div className="card-stat">
                  <div className="card-stat__value">{t("home.stats.uptime")}</div>
                  <div className="card-stat__label">{t("home.stats.uptimeLabel")}</div>
                </div>
              </div>
              <div className="hero__card hero__card--3">
                <div className="card-stat">
                  <div className="card-stat__value">{t("home.stats.security")}</div>
                  <div className="card-stat__label">{t("home.stats.securityLabel")}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features" id="features">
          <div className="features__container">
            <div className="features__header">
              <h2 className="features__title">{t("features.title")}</h2>
              <p className="features__subtitle">{t("features.subtitle")}</p>
            </div>

            <div className="features__grid">
              <div className="feature-card">
                <div className="feature-card__icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path
                      d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 10V16L20 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="feature-card__title">
                  {t("features.localLanguage.title")}
                </h3>
                <p className="feature-card__description">
                  {t("features.localLanguage.description")}
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-card__icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path
                      d="M4 8H28M4 16H28M4 24H28"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="feature-card__title">
                  {t("features.multiCurrency.title")}
                </h3>
                <p className="feature-card__description">
                  {t("features.multiCurrency.description")}
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-card__icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path
                      d="M28 16L16 4L4 16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 14V26H24V14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="feature-card__title">
                  {t("features.offlineMode.title")}
                </h3>
                <p className="feature-card__description">
                  {t("features.offlineMode.description")}
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-card__icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path
                      d="M8 8H24V24H8V8Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 8V24M20 8V24M8 16H24"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="feature-card__title">
                  {t("features.cloudBackup.title")}
                </h3>
                <p className="feature-card__description">
                  {t("features.cloudBackup.description")}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
