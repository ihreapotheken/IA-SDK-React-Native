import { Image, StyleSheet, Text, View } from 'react-native';
import { copy } from '../copy';
import type { PharmacyState } from '../sdk/showcaseSdk';
import type { ActionProps } from '../state/useActionRunner';
import {
  Button,
  Card,
  colors,
  IconTile,
  PharmacyIcon,
  radius,
  SectionTitle,
  shared,
  spacing,
} from '@ia-example/shared';

/**
 * The selected pharmacy, by name and address on iOS and by number on Android,
 * whose SDK doesn't report the details.
 */
export function PharmacySection({
  state: { id, details },
  showDetails,
  change,
}: {
  state: PharmacyState;
  showDetails: ActionProps;
  change: ActionProps;
}) {
  const logo = details?.additionalInformation.logo;
  return (
    <>
      <SectionTitle>{copy.pharmacySection}</SectionTitle>
      <Card style={styles.card}>
        <View style={styles.row}>
          {logo ? (
            <Image
              source={{ uri: logo }}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <IconTile tone={id ? 'accent' : 'neutral'}>
              <PharmacyIcon color={id ? colors.accent : colors.inkTertiary} />
            </IconTile>
          )}
          <View style={shared.textStack}>
            <Text style={shared.title} numberOfLines={2}>
              {details?.additionalInformation.name ??
                (id ? copy.pharmacySelected : copy.pharmacyNone)}
            </Text>
            {details ? (
              <>
                <Text style={shared.subtitle} numberOfLines={1}>
                  {details.location.street}, {details.location.postcode}{' '}
                  {details.location.city}
                </Text>
                <View style={styles.openRow}>
                  <View
                    style={[
                      styles.openDot,
                      details.businessHours.isOpenNow && styles.openDotOpen,
                    ]}
                  />
                  <Text style={shared.subtitle}>
                    {details.businessHours.isOpenNow
                      ? copy.pharmacyOpen
                      : copy.pharmacyClosed}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={shared.subtitle}>
                {id ? copy.pharmacyId(id) : copy.pharmacyNoneBody}
              </Text>
            )}
          </View>
        </View>
        <View style={shared.row}>
          {id ? (
            <>
              <Button
                {...showDetails}
                title={copy.pharmacyDetails}
                variant="secondary"
                style={styles.flexButton}
              />
              <Button
                {...change}
                title={copy.pharmacyChange}
                variant="secondary"
                style={styles.flexButton}
              />
            </>
          ) : (
            <Button
              {...change}
              title={copy.pharmacyChoose}
              style={styles.flexButton}
            />
          )}
        </View>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSunken,
  },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  openDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.inkTertiary,
  },
  openDotOpen: {
    backgroundColor: colors.success,
  },
  flexButton: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
});
