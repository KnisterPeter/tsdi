export interface CompilerHost {
  getCurrentDirectory(): string;
  fileExists(path: string): boolean;
  realpath?(path: string): string;
  readFile(path: string, encoding?: string): string | undefined;
  readDirectory(
    path: string,
    extensions?: ReadonlyArray<string>,
    exclude?: ReadonlyArray<string>,
    include?: ReadonlyArray<string>,
    depth?: number
  ): string[];
  writeFile(path: string, data: string, writeByteOrderMark?: boolean): void;
}
