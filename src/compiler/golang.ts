import type { ASTNode, Program } from './ast';
import type { CodeGenerator } from './generator';

export class GolangGenerator implements CodeGenerator {
  private imports: Set<string> = new Set();
  private indentLevel = 1;

  generate(ast: Program): string {
    this.imports.clear();
    const bodyCode = this.generateBlock(ast.body);
    
    let importsStr = '';
    if (this.imports.size > 0) {
      const importsList = Array.from(this.imports)
        .map(imp => `\t"${imp}"`)
        .join('\n');
      importsStr = `import (\n${importsList}\n)\n\n`;
    }

    return `package main\n\n${importsStr}func main() {\n${bodyCode}}\n`;
  }

  private indent(): string {
    return '\t'.repeat(this.indentLevel);
  }

  private generateBlock(nodes: ASTNode[]): string {
    return nodes.map(node => this.generateNode(node)).join('');
  }

  private generateNode(node: ASTNode): string {
    switch (node.type) {
      case 'VariableDeclaration':
        return `${this.indent()}var ${node.name} ${this.mapType(node.valueType)} = ${this.generateExpression(node.value)}\n`;
      case 'AssignmentExpression':
        return `${this.indent()}${node.name} = ${this.generateExpression(node.value)}\n`;
      case 'IfStatement': {
        const condition = this.generateExpression(node.condition);
        let code = `${this.indent()}if ${condition} {\n`;
        this.indentLevel++;
        code += this.generateBlock(node.consequent);
        this.indentLevel--;
        if (node.alternate && node.alternate.length > 0) {
          code += `${this.indent()}} else {\n`;
          this.indentLevel++;
          code += this.generateBlock(node.alternate);
          this.indentLevel--;
        }
        code += `${this.indent()}}\n`;
        return code;
      }
      case 'ForStatement': {
        const init = `${node.initName} := ${this.generateExpression(node.startValue)}`;
        const condition = `${node.initName} <= ${this.generateExpression(node.endValue)}`;
        const post = `${node.initName}++`;
        let code = `${this.indent()}for ${init}; ${condition}; ${post} {\n`;
        this.indentLevel++;
        code += this.generateBlock(node.body);
        this.indentLevel--;
        code += `${this.indent()}}\n`;
        return code;
      }
      case 'ArrayElementAssignment':
        return `${this.indent()}${node.arrayName}[${this.generateExpression(node.index)}] = ${this.generateExpression(node.value)}\n`;
      case 'ArrayAppend':
        return `${this.indent()}${node.arrayName} = append(${node.arrayName}, ${this.generateExpression(node.element)})\n`;
      case 'ForEachStatement': {
        let code = `${this.indent()}for ${node.indexName}, ${node.itemName} := range ${this.generateExpression(node.array)} {\n`;
        this.indentLevel++;
        code += this.generateBlock(node.body);
        this.indentLevel--;
        code += `${this.indent()}}\n`;
        return code;
      }
      case 'FunctionCall': {
        if (node.functionName.startsWith('fmt.')) {
          this.imports.add('fmt');
        } else if (node.functionName.startsWith('time.')) {
          this.imports.add('time');
        }
        const args = node.arguments.map(arg => this.generateExpression(arg)).join(', ');
        return `${this.indent()}${node.functionName}(${args})\n`;
      }
      // Any expression directly evaluated as statement (usually rare in go without assignment or call, but just in case)
      default:
        return `${this.indent()}${this.generateExpression(node)}\n`;
    }
  }

  private generateExpression(node: ASTNode): string {
    switch (node.type) {
      case 'BinaryExpression':
        return `(${this.generateExpression(node.left)} ${node.operator} ${this.generateExpression(node.right)})`;
      case 'Identifier':
        return node.name;
      case 'Literal':
        if (node.valueType === 'string') {
          return JSON.stringify(String(node.value)); // escapes quotes, backslashes, newlines (valid Go string syntax)
        }
        return String(node.value);
      case 'ArrayLiteral': {
        const elements = node.elements.map(e => this.generateExpression(e)).join(', ');
        return `${this.mapType(node.valueType)}{${elements}}`;
      }
      case 'ArrayAccess':
        return `${this.generateExpression(node.array)}[${this.generateExpression(node.index)}]`;
      case 'ArrayLength':
        return `len(${this.generateExpression(node.array)})`;
      default:
        throw new Error(`Unsupported expression node type: ${node.type}`);
    }
  }

  private mapType(type: string): string {
    switch (type) {
      case 'int': return 'int';
      case 'float': return 'float64';
      case 'string': return 'string';
      case 'bool': return 'bool';
      case '[]int': return '[]int';
      case '[]float': return '[]float64';
      case '[]string': return '[]string';
      case '[]bool': return '[]bool';
      case '[]any': return '[]any';
      default: return 'any';
    }
  }
}
