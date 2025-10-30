/**
 * Minimal type definition for Base MiniKit configuration
 * Matches the structure expected by Base Mini Apps.
 */
export interface MiniAppConfig {
  accountAssociation: {
    header: string;
    payload: string;
    signature: string;
  };
  miniapp: Record<string, any>;
}
