import './LedMatrix.css';
import { Frame } from '@renderer/domain';
import * as Config from 'src/config';

interface LedMatrixProperties {
  frame: Frame;
}

export default function LedMatrix(props: LedMatrixProperties) {
  const conf = Config.defaultConfig;
  return (
    <div
      className="matrix"
      style={{
        gridTemplateColumns: `repeat(${conf.width}, 1fr)`,
        gridTemplateRows: `repeat(${conf.height}, 1fr)`,
      }}
    >
      {props.frame.data.map((color, idx) => (
        <div
          className="led"
          id={`led_${idx}`}
          key={idx}
          style={{ backgroundColor: `${color}` }}
        />
      ))}
    </div>
  );
}
