import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { ProjectArtwork } from './ProjectReport';
import Tags from '../components/Tags';

export default function ProjectCard({ project, index, onSelect, featured = false }) {
  return <button data-project-id={project.id} className={`portfolio-app__case-file ${featured ? 'is-featured' : ''} ${project.pending ? 'is-pending' : ''}`} onClick={() => onSelect(project.id)}>
    <div className="portfolio-app__case-head"><span>DOSSIER {String(index + 1).padStart(2, '0')}</span><span>{project.status}</span></div>
    <ProjectArtwork project={project} compact />
    <div className="portfolio-app__case-body">
      <div className="portfolio-app__case-title"><h2>{project.name}</h2><ArrowUpRight size={18} /></div>
      <p>{project.tagline}</p>
      <span className="portfolio-app__case-focus">{project.context} · {project.period}</span>
      <Tags items={project.stack.slice(0, 4)} />
      <span className="portfolio-app__case-action">{project.pending ? 'Documentation en cours' : 'Voir le projet'} <ArrowRight size={15} /></span>
    </div>
  </button>;
}
