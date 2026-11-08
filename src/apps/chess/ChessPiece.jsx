const silhouettes = {
  p: <><circle cx="32" cy="16" r="8" /><path d="M25 26h14v6c-6 8-5 12 3 17H22c8-5 9-9 3-17z" /></>,
  r: <path d="M18 9h7v8h7V9h7v8h7V9h5v17l-9 6 2 17H20l2-17-9-6V9h5zm4 17h20" />,
  n: <><path d="M22 49c2-10 14-14 12-24l-13 9-8-7 16-16 3-6 7 5c14 7 17 23 12 39z" /><circle cx="31" cy="20" r="2" fill="var(--chess-piece-detail)" stroke="none" /></>,
  b: <><path d="M32 7C13 23 19 30 27 33l-6 16h22l-6-16C45 30 51 23 32 7z" /><path d="m31 15 7 9M25 35h14" fill="none" /></>,
  q: <><path d="m17 20 8 10 7-16 7 16 8-10-6 25H23z" /><circle cx="15" cy="16" r="4" /><circle cx="32" cy="10" r="4" /><circle cx="49" cy="16" r="4" /><path d="M22 45h20v5H22z" /></>,
  k: <><path d="M29 5h6v6h6v6h-6v7h-6v-7h-6v-6h6zM32 27c-19-14-23 4-10 12l-1 10h22l-1-10c13-8 9-26-10-12z" /><path d="M23 39h18" fill="none" /></>,
};

export default function ChessPiece({ type, color }) {
  return <svg className={`chess-piece is-${color}`} viewBox="0 0 64 64" aria-hidden="true"><g fill="currentColor" stroke="var(--chess-piece-detail)" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">{silhouettes[type]}<path d="M20 49h24l5 8H15z" /></g></svg>;
}
