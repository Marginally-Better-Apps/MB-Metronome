import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeTabs, Icon, Label, VectorIcon } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS, Platform } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Native system tab bar (UIKit / Material). On iOS 26+ this is the real Liquid Glass tab bar;
 * JS `<Tabs>` from React Navigation cannot swap in that system chrome—only a custom background.
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  const tintColor =
    Platform.OS === 'ios'
      ? DynamicColorIOS({ light: Colors.light.tint, dark: Colors.dark.tint })
      : Colors[theme].tint;

  const labelColor =
    Platform.OS === 'ios'
      ? DynamicColorIOS({
          light: Colors.light.text,
          dark: Colors.dark.text,
        })
      : Colors[theme].text;

  return (
    <NativeTabs tintColor={tintColor} labelStyle={{ color: labelColor }}>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          androidSrc={<VectorIcon family={MaterialIcons} name="home" />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <Label>Explore</Label>
        <Icon
          sf={{ default: 'paperplane', selected: 'paperplane.fill' }}
          androidSrc={<VectorIcon family={MaterialIcons} name="send" />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
