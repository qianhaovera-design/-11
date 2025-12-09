
export interface TreeConfig {
  treeColor: string;
  ornamentColor: string;
  lightsColor: string;
  rotationSpeed: number;
}

export enum HolidayMood {
  CLASSIC = 'Classic Elegance',
  MODERN = 'Modern Gold',
  FROSTED = 'Frosted Emerald'
}

export interface GeneratedMessage {
  title: string;
  body: string;
  translation: string;
}
