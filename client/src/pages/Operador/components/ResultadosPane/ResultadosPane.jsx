import CloseExportCard from './CloseExportCard';
import SubstitutionsCard from './SubstitutionsCard';
import ReopenCard from './ReopenCard';
import FinalSquadsCard from './FinalSquadsCard';
import './ResultadosPane.css';

export default function ResultadosPane() {
  return (
    <section className="pane">
      <CloseExportCard />
      <SubstitutionsCard />
      <ReopenCard />
      <FinalSquadsCard />
    </section>
  );
}
