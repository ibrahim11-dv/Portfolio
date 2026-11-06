export default function SectionHeading({ eyebrow, title, description, action }) {
  return <header className="portfolio-app__section-heading">
    <div><span className="portfolio-app__eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>
    {action}
  </header>;
}
