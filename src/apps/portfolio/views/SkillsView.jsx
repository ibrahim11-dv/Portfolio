import { ArrowUpRight, Globe2 } from 'lucide-react';
import { PROFILE, PROJECTS } from '../../../data/portfolioData';
import { SKILL_CAPABILITIES } from '../../../data/skillCapabilities';
import SectionHeading from '../components/SectionHeading';
import Tags from '../components/Tags';

export default function SkillsView({ onSelectProject }) {
  return <>
    <SectionHeading eyebrow="COMPÉTENCES / 03" title="Mes compétences techniques." description="Les outils que j’utilise et ce que je sais faire avec, du développement des interfaces à la gestion des données et des accès." />
    <div className="skill-capabilities">{SKILL_CAPABILITIES.map((capability, index) => <article className="skill-capability" key={capability.id}>
      <div className="skill-capability__body">
        <span className="portfolio-app__eyebrow">{String(index + 1).padStart(2, '0')} / {capability.domain}</span>
        <h2>{capability.title}</h2>
        <Tags items={capability.technologies} />
        <ul className="skill-capability__practice">{capability.practices.map((practice) => <li key={practice}>{practice}</li>)}</ul>
        <div className="skill-capability__links"><span>Exemples d’utilisation</span>{capability.projects.map((id) => { const project = PROJECTS.find((item) => item.id === id); return <button key={id} onClick={() => onSelectProject(id)} aria-label={`Voir un exemple : ${project.name}`}>{project.name}<ArrowUpRight size={15} aria-hidden="true" /></button>; })}</div>
      </div>
    </article>)}</div>
    <details className="skills-inventory"><summary>Toutes les technologies et méthodes</summary><div className="portfolio-app__skills-list">{PROFILE.skills.map((group, index) => <section className="portfolio-app__skill-group" key={group.category}><span>{String(index + 1).padStart(2, '0')}</span><div><h2>{group.category}</h2><Tags items={group.items} className="is-large" /></div></section>)}</div></details>
    <section className="portfolio-app__languages"><div><Globe2 size={19} /><span>LANGUES</span></div><Tags items={PROFILE.languages} className="is-large" /></section>
  </>;
}
