declare module 'react-native-confetti' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  interface ConfettiProps extends ViewProps {
    duration?: number;
    colors?: string[];
    ref?: any;
  }

  export default class Confetti extends Component<ConfettiProps> {}
} 