import { copy } from '../copy';
import type { ActionProps } from '../state/useActionRunner';
import {
  Card,
  colors,
  DashboardIcon,
  Divider,
  FeatureRow,
  ScanIcon,
  SectionTitle,
} from '@ia-example/shared';

/** The SDK's own entry points: redeeming by scan, and its start screen. */
export function MoreFromSdk({
  scan,
  dashboard,
}: {
  scan: ActionProps;
  dashboard: ActionProps;
}) {
  return (
    <>
      <SectionTitle>{copy.moreSection}</SectionTitle>
      <Card>
        <FeatureRow
          {...scan}
          icon={<ScanIcon color={colors.accent} />}
          title={copy.scanTitle}
          body={copy.scanBody}
          testID="showcase-scan"
        />
        <Divider inset={76} />
        <FeatureRow
          {...dashboard}
          icon={<DashboardIcon color={colors.accent} />}
          title={copy.dashboardTitle}
          body={copy.dashboardBody}
          testID="showcase-dashboard"
        />
      </Card>
    </>
  );
}
