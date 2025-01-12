import './ControlPanel.css';

type ControlPanelProperties = {
  frameNumber: number;
};

export default function ControlPanel(props: ControlPanelProperties) {
  return (
    <div className="controlPanel">
      <div className="control">
        <label htmlFor="frameCount">Frame no.: </label>
        <span>{props.frameNumber}</span>
      </div>
    </div>
  );
}
