import { ViewTransitionScreen } from './ViewTransitionScreen';
import type { TransitionLabelProps } from './table-transition-label';

interface ViewFallbackProps extends TransitionLabelProps {}

export function ViewFallback(props: ViewFallbackProps) {
  return (
    <ViewTransitionScreen
      variant="table"
      label={props.label ?? 'Loading'}
      labelPrefix={props.labelPrefix}
      labelHighlight={props.labelHighlight}
      labelSuffix={props.labelSuffix}
    />
  );
}
