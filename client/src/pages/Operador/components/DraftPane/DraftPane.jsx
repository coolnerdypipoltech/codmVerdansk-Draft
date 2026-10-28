import SettingsCard from './SettingsCard';
import LiveDayCard from './LiveDayCard';
import NextPlayerCard from './NextPlayerCard';
import SceneControls from './SceneControls';
import LiveSquadsCard from './LiveSquadsCard';
import LogCard from './LogCard';
import './DraftPane.css';

export default function DraftPane() {
  return (
    <section className="pane">
      <div className="cols">
        <SettingsCard />
        <LiveDayCard />
        <NextPlayerCard />
      </div>
      <SceneControls />
      <LiveSquadsCard />
      <LogCard />
    </section>
  );
}
