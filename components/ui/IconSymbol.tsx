import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';
import { SymbolWeight } from 'expo-symbols';
import { House, PaperPlaneTilt, Code, CaretRight } from 'phosphor-react-native';

type IconMapping = Record<string, (size: number, color: string) => React.ReactNode>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING: IconMapping = {
  'house.fill': (size: number, color: string) => <House size={size} color={color} weight="fill" />,
  'paperplane.fill': (size: number, color: string) => <PaperPlaneTilt size={size} color={color} weight="fill" />,
  'chevron.left.forwardslash.chevron.right': (size: number, color: string) => <Code size={size} color={color} weight="regular" />,
  'chevron.right': (size: number, color: string) => <CaretRight size={size} color={color} weight="regular" />,
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
