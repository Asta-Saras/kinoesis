import type { Program } from './ast';

export interface CodeGenerator {
  generate(ast: Program): string;
}
