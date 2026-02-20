import type { ASTNode, Program } from './ast';
import type { CodeGenerator } from './generator';

export class JavascriptGenerator implements CodeGenerator {
  private indentLevel = 0;

  generate(ast: Program): string {
    return this.generateBlock(ast.body);
  }

  private indent(): string {
    return '  '.repeat(this.indentLevel);
  }

  private generateBlock(nodes: ASTNode[]): string {
    return nodes.map(node => this.generateNode(node)).join('');
  }

  private generateNode(node: ASTNode): string {
    switch (node.type) {
      case 'VariableDeclaration':
        return `${this.indent()}let ${node.name} = ${this.generateExpression(node.value)};\n`;
      case 'AssignmentExpression':
        return `${this.indent()}${node.name} = ${this.generateExpression(node.value)};\n`;
      case 'IfStatement': {
        const condition = this.generateExpression(node.condition);
        let code = `${this.indent()}if (${condition}) {\n`;
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
        const init = `let ${node.initName} = ${this.generateExpression(node.startValue)}`;
        const condition = `${node.initName} <= ${this.generateExpression(node.endValue)}`;
        const post = `${node.initName}++`;
        let code = `${this.indent()}for (${init}; ${condition}; ${post}) {\n`;
        this.indentLevel++;
        code += this.generateBlock(node.body);
        this.indentLevel--;
        code += `${this.indent()}}\n`;
        return code;
      }
      case 'ArrayElementAssignment':
        return `${this.indent()}${node.arrayName}[${this.generateExpression(node.index)}] = ${this.generateExpression(node.value)};\n`;
      case 'ArrayAppend':
        return `${this.indent()}${node.arrayName}.push(${this.generateExpression(node.element)});\n`;
      case 'ForEachStatement': {
        let code = `${this.indent()}for (let [${node.indexName}, ${node.itemName}] of ${this.generateExpression(node.array)}.entries()) {\n`;
        this.indentLevel++;
        code += this.generateBlock(node.body);
        this.indentLevel--;
        code += `${this.indent()}}\n`;
        return code;
      }
      case 'FunctionCall': {
        // Map fmt.Println to console.log
        let funcName = node.functionName;
        if (funcName === 'fmt.Println' || funcName === 'fmt.Print') {
          funcName = 'console.log';
        }
        const args = node.arguments.map(arg => this.generateExpression(arg)).join(', ');
        return `${this.indent()}${funcName}(${args});\n`;
      }
      default:
        return `${this.indent()}${this.generateExpression(node)};\n`;
    }
  }

  private generateExpression(node: ASTNode): string {
    switch (node.type) {
      case 'BinaryExpression':
        return `${this.generateExpression(node.left)} ${node.operator} ${this.generateExpression(node.right)}`;
      case 'Identifier':
        return node.name;
      case 'Literal':
        if (node.valueType === 'string') {
          return `"${node.value}"`;
        }
        return String(node.value);
      case 'ArrayLiteral': {
        const elements = node.elements.map(e => this.generateExpression(e)).join(', ');
        return `[${elements}]`;
      }
      case 'ArrayAccess':
        return `${this.generateExpression(node.array)}[${this.generateExpression(node.index)}]`;
      case 'ArrayLength':
        return `${this.generateExpression(node.array)}.length`;
      default:
        throw new Error(`Unsupported expression node type: ${node.type}`);
    }
  }
}
