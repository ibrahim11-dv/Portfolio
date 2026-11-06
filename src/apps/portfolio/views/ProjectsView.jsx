import { Search } from 'lucide-react';
import { PROJECTS } from '../../../data/portfolioData';
import SectionHeading from '../components/SectionHeading';
import ProjectCard from '../projects/ProjectCard';

export default function ProjectsView({ onSelectProject, filters, setFilters }) {
  const { query, category, group } = filters;
  const update = (patch) => setFilters((current) => ({ ...current, ...patch }));
  const collection = PROJECTS.filter((project) => project.group === group);
  const categories = [...new Set(collection.map((project) => project.category))];
  const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
  const filtered = collection.filter((project) => (category === 'all' || category === project.category)
    && normalize(`${project.name} ${project.description} ${project.stack.join(' ')} ${project.technicalFocus}`).includes(normalize(query.trim())));
  return <>
    <SectionHeading eyebrow="PROJETS / 02" title="Ce que j’ai construit" description="Explorez les interfaces et les fonctionnalités. Les détails techniques restent à portée de clic." />
    <div className="portfolio-app__collections" aria-label="Collections de projets">
      {[['main', 'Projets principaux'], ['other', 'Autres projets']].map(([id, label]) => <button key={id} aria-pressed={group === id} onClick={() => update({ group: id, category: 'all', query: '' })}><span>{id === 'main' ? 'A' : 'B'}</span>{label}<b>{PROJECTS.filter((project) => project.group === id).length}</b></button>)}
    </div>
    <p className="portfolio-app__collection-intro">Recherche par nom, technologie ou domaine dans les {group === 'main' ? 'projets principaux' : 'autres projets'}.</p>
    {(query || category !== 'all') && <div className="portfolio-app__active-filters"><span>{query && `Recherche : « ${query} »`}{category !== 'all' && ` · Catégorie : ${category}`}</span><button onClick={() => update({ query: '', category: 'all' })}>Effacer les filtres</button></div>}
    <div className="portfolio-app__project-tools"><label className="portfolio-app__search"><Search size={16} /><input type="search" placeholder="Rechercher un projet ou une technologie" value={query} onChange={(event) => update({ query: event.target.value })} aria-label="Rechercher dans cette collection" /></label><span className="portfolio-app__result-count" role="status">{String(filtered.length).padStart(2, '0')} RÉSULTATS</span></div>
    <div className="portfolio-app__filters" aria-label="Catégories de projets"><button className={category === 'all' ? 'is-active' : ''} onClick={() => update({ category: 'all' })} aria-pressed={category === 'all'}>TOUS</button>{categories.map((item) => <button key={item} className={category === item ? 'is-active' : ''} onClick={() => update({ category: item })} aria-pressed={category === item}>{item}</button>)}</div>
    {filtered.length ? <div className="portfolio-app__case-list">{filtered.map((project) => <ProjectCard key={project.id} project={project} index={PROJECTS.indexOf(project)} onSelect={onSelectProject} featured={group === 'main' && ['citadel', 'learnxcompile', 'parcvision'].includes(project.id)} />)}</div> : <div className="portfolio-app__empty"><Search size={31} /><h2>Aucun projet trouvé</h2><p>Aucun résultat pour « {query || category} » dans les {group === 'main' ? 'projets principaux' : 'autres projets'}{category !== 'all' ? `, catégorie ${category}` : ''}. Essayez une autre technologie ou effacez les filtres.</p><button onClick={() => update({ query: '', category: 'all' })}>Réinitialiser</button></div>}
  </>;
}
