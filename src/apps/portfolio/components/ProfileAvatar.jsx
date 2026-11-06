import { PROFILE } from '../../../data/portfolioData';

export default function ProfileAvatar({ className = '' }) {
  const initials = PROFILE.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('');
  return <div className={`portfolio-app__avatar ${className}`} aria-hidden="true">{PROFILE.portrait ? <img src={PROFILE.portrait} alt="" /> : initials}</div>;
}
