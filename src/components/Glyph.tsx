import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import { Text } from 'react-native';

export type GlyphName =
  | 'faceid'
  | 'touchid'
  | 'lock.fill'
  | 'lock.open.fill'
  | 'photo.fill'
  | 'video.fill'
  | 'doc.fill'
  | 'archivebox.fill'
  | 'gearshape.fill'
  | 'plus'
  | 'magnifyingglass'
  | 'camera.fill'
  | 'folder.fill'
  | 'square.and.arrow.up'
  | 'trash.fill'
  | 'checkmark.seal.fill'
  | 'hourglass'
  | 'eye.slash.fill'
  | 'chevron.left'
  | 'xmark'
  | 'person.fill'
  | 'key.fill'
  | 'shield.fill'
  | 'play.fill'
  | 'doc.text.fill'
  | 'hand.raised.fill'
  | 'square.and.pencil'
  | 'checkmark'
  | 'ellipsis';

const FALLBACK: Record<GlyphName, string> = {
  faceid: '◉',
  touchid: '⌘',
  'lock.fill': '⌂',
  'lock.open.fill': '⌂',
  'photo.fill': '▣',
  'video.fill': '▶',
  'doc.fill': '▤',
  'archivebox.fill': '▣',
  'gearshape.fill': '⚙',
  plus: '+',
  magnifyingglass: '⌕',
  'camera.fill': '📷',
  'folder.fill': '▢',
  'square.and.arrow.up': '↗',
  'trash.fill': '✕',
  'checkmark.seal.fill': '✓',
  hourglass: '⌛',
  'eye.slash.fill': '◌',
  'chevron.left': '‹',
  xmark: '✕',
  'person.fill': '☺',
  'key.fill': '⚿',
  'shield.fill': '◈',
  'play.fill': '▶',
  'doc.text.fill': '▤',
  'hand.raised.fill': '✋',
  'square.and.pencil': '✎',
  checkmark: '✓',
  ellipsis: '…',
};

export function Glyph({
  name,
  size = 22,
  color,
}: {
  name: GlyphName;
  size?: number;
  color: string;
}) {
  return (
    <SymbolView
      name={name as SFSymbol}
      size={size}
      tintColor={color}
      fallback={
        <Text style={{ color, fontSize: size * 0.85, lineHeight: size }}>{FALLBACK[name]}</Text>
      }
    />
  );
}
