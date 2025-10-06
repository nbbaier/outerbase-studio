import type { DatabaseResultSet } from "./drivers/base-driver";
import type { SavedDocNamespace } from "./drivers/saved-doc/saved-doc-driver";

interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string | string[]>;
}

interface OpenFilePickerOptions {
  multiple?: boolean;
  excludeAcceptAllOption?: boolean;
  types?: FilePickerAcceptType[];
}

interface OuterbaseIPC {
  docs?: {
    load(): Promise<{
      namespace: SavedDocNamespace[];
      docs: Record<string, SavedDocData[]>;
    } | null>;

    save(data: {
      namespace: SavedDocNamespace[];
      docs: Record<string, SavedDocData[]>;
    }): Promise<void>;
  };
  query(statement: string): Promise<DatabaseResultSet>;
  transaction(statements: string[]): Promise<DatabaseResultSet[]>;
  close(): void;
}

declare global {
  interface Window {
    outerbaseIpc?: OuterbaseIPC;
    showOpenFilePicker?: (
      options?: OpenFilePickerOptions,
    ) => Promise<FileSystemFileHandle[]>;
    showOuterbaseDialog: Record<
      string,
      (props: {
        component: FunctionComponent;
        options: unknown;
        resolve: (props: unknown) => void;
        defaultCloseValue: unknown;
      }) => void
    >;
  }

  interface FileSystemFileHandle {
    queryPermission?(descriptor?: {
      mode?: "read" | "readwrite";
    }): Promise<PermissionState>;
    requestPermission?(descriptor?: {
      mode?: "read" | "readwrite";
    }): Promise<PermissionState>;
  }
}
