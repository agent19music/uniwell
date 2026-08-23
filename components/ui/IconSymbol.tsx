import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { House, PaperPlaneTilt, Code, CaretRight } from 'phosphor-react-native';

type IconMapping = Record<SymbolViewProps['name'], (size: number, color: string) => React.ReactNode>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING: IconMapping = {
  'house.fill': (size, color) => <House size={size} color={color} weight="fill" />,
  'paperplane.fill': (size, color) => <PaperPlaneTilt size={size} color={color} weight="fill" />,
  'chevron.left.forwardslash.chevron.right': (size, color) => <Code size={size} color={color} weight="regular" />,
  'chevron.right': (size, color) => <CaretRight size={size} color={color} weight="regular" />,
};

export function IconSymbol({
  name,
  size = 24,
  color,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <>{MAPPING[name]?.(size, color as string)}</>;
}
