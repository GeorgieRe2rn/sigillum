import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { Glyph, type GlyphName } from '../../../components/Glyph';
import { colors, fonts } from '../../../theme';

function TabIcon({ name, color }: { name: GlyphName; color: string }) {
  return <Glyph name={name} size={22} color={color} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.line,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.sansMedium,
          fontSize: 11,
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Archivo',
          tabBarIcon: ({ color }) => <TabIcon name="archivebox.fill" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="photos"
        options={{
          title: 'Fotos',
          tabBarIcon: ({ color }) => <TabIcon name="photo.fill" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: 'Vídeos',
          tabBarIcon: ({ color }) => <TabIcon name="video.fill" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Docs',
          tabBarIcon: ({ color }) => <TabIcon name="doc.fill" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => <TabIcon name="gearshape.fill" color={String(color)} />,
        }}
      />
    </Tabs>
  );
}
