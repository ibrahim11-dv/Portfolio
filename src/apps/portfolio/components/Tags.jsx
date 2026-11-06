export default function Tags({ items = [], className = '' }) {
  return <div className={`portfolio-app__tags ${className}`}>{items.map((item) => <span key={item}>{item}</span>)}</div>;
}
