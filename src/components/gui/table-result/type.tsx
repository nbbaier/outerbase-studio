import type { ColumnType } from "@outerbase/sdk-transform";
import type { DatabaseTableColumn } from "@/drivers/base-driver";

export interface TableHeaderMetadata {
  from?: {
    schema: string;
    table: string;
    column: string;
  };

  // Primary key
  isPrimaryKey: boolean;

  // Foreign key reference
  referenceTo?: {
    schema: string;
    table: string;
    column: string;
  };

  type?: ColumnType;
  originalType?: string;

  columnSchema?: DatabaseTableColumn;
}
