import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Copy, FileText, GitBranch, Globe2, Mail, MapPin } from 'lucide-react';
import { PROFILE } from '../../../data/portfolioData';
import { gmailComposeUrl } from '../../../data/desktopLinks';
import { CVAction } from '../PortfolioActions';
import SectionHeading from '../components/SectionHeading';
import ProfileAvatar from '../components/ProfileAvatar';

export default function ContactView() {
  const [copyStatus, setCopyStatus] = useState('');
  const [copyFailed, setCopyFailed] = useState(false);
  async function copyEmail() {
    try { await navigator.clipboard.writeText(PROFILE.email); setCopyFailed(false); setCopyStatus('Adresse e-mail copiée.'); }
    catch { setCopyFailed(true); setCopyStatus('Sélectionnez l’adresse ci-dessous, puis copiez-la manuellement.'); }
  }
  return <div className="contact-page">
    <SectionHeading eyebrow="CONTACT" title="Contactez-moi." description="À la recherche d’un stage en développement informatique. Échangeons sur votre équipe et vos projets." />
    <section className="contact-email" aria-labelledby="contact-email-title">
      <h2 id="contact-email-title"><Mail size={21} aria-hidden="true" />Par e-mail</h2>
      <a className="contact-email__address" href={gmailComposeUrl(PROFILE.email)} target="_blank" rel="noopener noreferrer" title="Écrire dans Gmail · nouvel onglet">{PROFILE.email}</a>
      <div className="contact-email__actions">
        <a className="contact-email__write" href={gmailComposeUrl(PROFILE.email)} target="_blank" rel="noopener noreferrer" aria-label="Écrire un e-mail dans Gmail (nouvel onglet)"><Mail size={18} />Écrire un e-mail<ArrowUpRight size={16} aria-hidden="true" /></a>
        <button onClick={copyEmail}><Copy size={18} />Copier l’adresse</button>
      </div>
      <p className="contact-email__status" role="status">{copyStatus}</p>
      {copyFailed && <label className="contact-email__fallback">Adresse à copier<input readOnly value={PROFILE.email} onFocus={(event) => event.target.select()} /></label>}
    </section>
    <section className="contact-resources" aria-labelledby="contact-resources-title">
      <h2 id="contact-resources-title">Retrouvez-moi aussi ici</h2>
      {PROFILE.linkedin && <a href={PROFILE.linkedin} target="_blank" rel="noreferrer"><Globe2 size={24} aria-hidden="true" /><span><strong>LinkedIn</strong><small>Mon profil professionnel · nouvel onglet</small></span><ArrowUpRight size={20} aria-hidden="true" /></a>}
      {PROFILE.github && <a href={PROFILE.github} target="_blank" rel="noreferrer"><GitBranch size={24} aria-hidden="true" /><span><strong>GitHub</strong><small>Mes dépôts et mon code · nouvel onglet</small></span><ArrowUpRight size={20} aria-hidden="true" /></a>}
      <CVAction><FileText size={24} aria-hidden="true" /><span><strong>Lire mon CV</strong><small>Ouvrir le document dans IbrahimOS</small></span><ArrowRight size={20} aria-hidden="true" /></CVAction>
      <CVAction download className="contact-resources__download"><FileText size={18} />Télécharger le CV en PDF</CVAction>
    </section>
    <footer className="contact-identity"><ProfileAvatar /><div><strong>{PROFILE.name}</strong><span>{PROFILE.role}</span><span><MapPin size={15} aria-hidden="true" />{PROFILE.location}</span></div></footer>
  </div>;
}
