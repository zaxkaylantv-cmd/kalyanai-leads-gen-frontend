declare module "papaparse" {
  export interface ParseResult<T = any> {
    data: T[];
    errors: any[];
    meta: any;
  }

  export interface ParseConfig<T = any> {
    header?: boolean;
    skipEmptyLines?: boolean | "greedy";
    complete?: (results: ParseResult<T>) => void;
    error?: (error: any) => void;
  }

  export function parse<T = any>(file: File | string, config?: ParseConfig<T>): void;

  const Papa: {
    parse: typeof parse;
  };

  export default Papa;
}
