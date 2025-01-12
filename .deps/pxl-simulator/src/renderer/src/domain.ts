export type Dimensions = {
  w: number;
  h: number;
};

export type Preset = {
  name: string;
  dimensions: Dimensions;
  pitch: number;
};

export type Frame = {
  number: number;
  data: readonly string[];
};
