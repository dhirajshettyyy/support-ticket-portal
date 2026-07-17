// app/HelpCenterSection.tsx
import { HELP_CENTER_URL, TOP_HELP_ARTICLES } from "./communityLinks";

export function HelpCenterSection() {
  return (
    <section className="help-center-section" aria-labelledby="help-center-heading">
      <h2 id="help-center-heading">Help Center &amp; Common Questions</h2>

      <form className="help-center-search" action={HELP_CENTER_URL} method="GET" target="_blank">
        <label htmlFor="help-center-search-input" className="visually-hidden">
          Search the help center
        </label>
        <input
          id="help-center-search-input"
          type="search"
          name="q"
          placeholder="Search articles…"
        />
        <button type="submit">Search</button>
      </form>

      <ul className="help-center-articles">
        {TOP_HELP_ARTICLES.map((article) => (
          <li key={article.href}>
            <a href={article.href} target="_blank" rel="noopener noreferrer">
              {article.title}
            </a>
          </li>
        ))}
      </ul>

      <a className="help-center-browse-all" href={HELP_CENTER_URL} target="_blank" rel="noopener noreferrer">
        Browse all articles →
      </a>
    </section>
  );
}
