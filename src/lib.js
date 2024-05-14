import { EvidenceType } from "@evidence-dev/db-commons";

/**
 * Optional mapping of source types to evidence types
 * Makes it easier to construct column options
 */
export const databaseTypeToEvidenceType = {
  INT: EvidenceType.NUMBER,
};
