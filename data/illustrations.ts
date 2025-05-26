export interface IllustrationSection {
  id: string;
  path: string;
  color: string;
  group?: string; // For logical grouping of related sections
}

export interface Illustration {
  id: string;
  name: string;
  sections: IllustrationSection[];
}

export const ILLUSTRATIONS: Illustration[] = [
  {
    id: 'giraffe',
    name: 'Giraffe',
    sections: [
      // Body
      {
        id: 'body',
        path: 'M150,300 C150,300 200,300 200,350 C200,400 150,400 150,350 Z',
        color: '#FFFFFF',
        group: 'main'
      },
      // Spots (grouped)
      {
        id: 'spots1',
        path: 'M160,320 C160,320 170,320 170,330 C170,340 160,340 160,330 Z',
        color: '#FFFFFF',
        group: 'spots'
      },
      {
        id: 'spots2',
        path: 'M180,340 C180,340 190,340 190,350 C190,360 180,360 180,350 Z',
        color: '#FFFFFF',
        group: 'spots'
      },
      {
        id: 'spots3',
        path: 'M170,360 C170,360 180,360 180,370 C180,380 170,380 170,370 Z',
        color: '#FFFFFF',
        group: 'spots'
      },
      // Neck
      {
        id: 'neck',
        path: 'M175,200 C175,200 175,300 175,300 C175,300 200,300 200,300 C200,300 200,200 200,200 Z',
        color: '#FFFFFF',
        group: 'main'
      },
      // Head
      {
        id: 'head',
        path: 'M175,150 C175,150 200,150 200,200 C200,200 175,200 175,200 Z',
        color: '#FFFFFF',
        group: 'main'
      },
      // Face
      {
        id: 'face',
        path: 'M180,170 C180,170 190,170 190,180 C190,190 180,190 180,180 Z',
        color: '#FFFFFF',
        group: 'face'
      },
      // Ears
      {
        id: 'ears',
        path: 'M175,150 C175,150 170,140 170,150 C170,160 175,160 175,150 Z',
        color: '#FFFFFF',
        group: 'face'
      }
    ]
  },
  {
    id: 'car',
    name: 'Modern Car',
    sections: [
      // Body
      {
        id: 'body',
        path: 'M100,200 C100,200 300,200 300,250 C300,300 100,300 100,250 Z',
        color: '#FFFFFF',
        group: 'main'
      },
      // Windows
      {
        id: 'windows',
        path: 'M150,150 C150,150 250,150 250,200 C250,200 150,200 150,200 Z',
        color: '#FFFFFF',
        group: 'glass'
      },
      // Wheels
      {
        id: 'wheel1',
        path: 'M120,250 C120,250 140,250 140,270 C140,290 120,290 120,270 Z',
        color: '#FFFFFF',
        group: 'wheels'
      },
      {
        id: 'wheel2',
        path: 'M260,250 C260,250 280,250 280,270 C280,290 260,290 260,270 Z',
        color: '#FFFFFF',
        group: 'wheels'
      },
      // Headlights
      {
        id: 'headlight1',
        path: 'M120,220 C120,220 130,220 130,230 C130,240 120,240 120,230 Z',
        color: '#FFFFFF',
        group: 'lights'
      },
      {
        id: 'headlight2',
        path: 'M270,220 C270,220 280,220 280,230 C280,240 270,240 270,230 Z',
        color: '#FFFFFF',
        group: 'lights'
      },
      // Details
      {
        id: 'details',
        path: 'M200,180 C200,180 220,180 220,190 C220,200 200,200 200,190 Z',
        color: '#FFFFFF',
        group: 'details'
      }
    ]
  },
  {
    id: 'shoe',
    name: 'Athletic Shoe',
    sections: [
      // Sole
      {
        id: 'sole',
        path: 'M100,300 C100,300 300,300 300,350 C300,400 100,400 100,350 Z',
        color: '#FFFFFF',
        group: 'main'
      },
      // Upper
      {
        id: 'upper',
        path: 'M100,200 C100,200 300,200 300,300 C300,300 100,300 100,300 Z',
        color: '#FFFFFF',
        group: 'main'
      },
      // Laces
      {
        id: 'laces1',
        path: 'M150,220 C150,220 250,220 250,230 C250,240 150,240 150,230 Z',
        color: '#FFFFFF',
        group: 'laces'
      },
      {
        id: 'laces2',
        path: 'M150,240 C150,240 250,240 250,250 C250,260 150,260 150,250 Z',
        color: '#FFFFFF',
        group: 'laces'
      },
      {
        id: 'laces3',
        path: 'M150,260 C150,260 250,260 250,270 C250,280 150,280 150,270 Z',
        color: '#FFFFFF',
        group: 'laces'
      },
      // Accents
      {
        id: 'accent1',
        path: 'M120,210 C120,210 140,210 140,220 C140,230 120,230 120,220 Z',
        color: '#FFFFFF',
        group: 'details'
      },
      {
        id: 'accent2',
        path: 'M260,210 C260,210 280,210 280,220 C280,230 260,230 260,220 Z',
        color: '#FFFFFF',
        group: 'details'
      },
      // Tongue
      {
        id: 'tongue',
        path: 'M180,200 C180,200 220,200 220,220 C220,240 180,240 180,220 Z',
        color: '#FFFFFF',
        group: 'main'
      }
    ]
  }
]; 