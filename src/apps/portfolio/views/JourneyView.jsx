import { BriefcaseBusiness, FileText, GraduationCap } from 'lucide-react';
import { PROFILE } from '../../../data/portfolioData';
import { CVAction } from '../PortfolioActions';
import SectionHeading from '../components/SectionHeading';
import Certificates from '../components/Certificates';

export default function JourneyView() {
  return <>
    <SectionHeading eyebrow="PARCOURS / 04" title="Parcours" description="Une trajectoire orientée développement logiciel et applications web." action={<CVAction className="portfolio-app__utility-link"><FileText size={15} />Lire le CV</CVAction>} />
    <section className="portfolio-app__chronicle"><h2><BriefcaseBusiness size={18} />Expériences</h2>{PROFILE.experience.map((item, index) => <article key={`${item.title}-${index}`}><span>{item.period}</span><div><h3>{item.title}</h3><strong>{item.organization}</strong><p>{item.description}</p></div></article>)}</section>
    <section className="portfolio-app__chronicle"><h2><GraduationCap size={18} />Formation</h2>{PROFILE.education.map((item, index) => <article key={`${item.title}-${index}`}><span>{item.period}</span><div><h3>{item.title}</h3><strong>{item.school}</strong></div></article>)}</section>
    <Certificates />
  </>;
}
