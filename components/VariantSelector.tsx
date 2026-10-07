import Colors from '@/constants/Colors';
import { ProductOption } from '@/src/types/shopify';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from './useColorScheme';

interface VariantSelectorProps {
  options: ProductOption[];
  selectedOptions: Record<string, string>;
  onSelectOption: (name: string, value: string) => void;
  isOptionValueAvailable?: (name: string, value: string) => boolean;
}

export function VariantSelector({
  options,
  selectedOptions,
  onSelectOption,
  isOptionValueAvailable,
}: VariantSelectorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // If the only option is the Shopify "Default Title", no selection is necessary
  const visibleOptions = options.filter(
    (opt) => !(opt.name.toLowerCase() === 'title' && opt.values.length === 1 && opt.values[0] === 'Default Title')
  );

  if (visibleOptions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {visibleOptions.map((option) => {
        const selectedVal = selectedOptions[option.name];

        return (
          <View key={option.id || option.name} style={styles.optionGroup}>
            <View style={styles.optionHeader}>
              <Text style={[styles.optionLabel, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
                {option.name.toUpperCase()}
              </Text>
              {selectedVal && (
                <Text style={[styles.selectedValueLabel, { color: Colors[colorScheme].text }]}>
                  {selectedVal}
                </Text>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.valuesList}
            >
              {option.values.map((value) => {
                const isSelected = selectedVal === value;
                const isAvailable = isOptionValueAvailable
                  ? isOptionValueAvailable(option.name, value)
                  : true;

                return (
                  <Pressable
                    key={value}
                    onPress={() => onSelectOption(option.name, value)}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={`${option.name}: ${value}${!isAvailable ? ', out of stock' : ''}`}
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? '#FFF'
                            : '#000'
                          : isDark
                            ? '#1C1C1E'
                            : '#F2F2F7',
                        borderColor: isSelected
                          ? isDark
                            ? '#FFF'
                            : '#000'
                          : isDark
                            ? '#2C2C2E'
                            : '#E5E5EA',
                        opacity: !isAvailable ? 0.45 : pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: isSelected
                            ? isDark
                              ? '#000'
                              : '#FFF'
                            : Colors[colorScheme].text,
                          fontWeight: isSelected ? '700' : '500',
                          textDecorationLine: !isAvailable ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {value}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  optionGroup: {
    marginBottom: 20,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  selectedValueLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  valuesList: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
});

