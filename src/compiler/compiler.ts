import type { AppNode } from '../store';
import type { Edge } from '@xyflow/react';
import type { ASTNode, Program } from './ast';

export class Compiler {
  private nodes: Map<string, AppNode> = new Map();
  private edges: Edge[] = [];
  // Exec pins currently being traversed; re-entering one means the exec wiring forms a cycle
  private visiting: Set<string> = new Set();
  private evaluating = new Set<string>();

  constructor(nodes: AppNode[], edges: Edge[]) {
    nodes.forEach(n => this.nodes.set(n.id, n));
    this.edges = edges;
  }

  compile(): Program {
    const startNode = Array.from(this.nodes.values()).find(n => n.type === 'start');
    if (!startNode) {
      return { type: 'Program', body: [] };
    }

    const body = this.traverseExecution(startNode.id, 'exec-out');
    return { type: 'Program', body };
  }

  private traverseExecution(nodeId: string, handleId: string): ASTNode[] {
    const key = `${nodeId}:${handleId}`;
    if (this.visiting.has(key)) {
      throw new Error(`Execution cycle detected at node "${nodeId}". Use a loop node instead of wiring execution back to an earlier node.`);
    }
    this.visiting.add(key);
    try {
      return this.traverseExecutionStep(nodeId, handleId);
    } finally {
      this.visiting.delete(key);
    }
  }

  private traverseExecutionStep(nodeId: string, handleId: string): ASTNode[] {
    const outEdges = this.edges.filter(e => e.source === nodeId && e.sourceHandle === handleId);
    if (outEdges.length === 0) return [];
    
    // We assume sequential execution, so take the first valid connected node
    const nextEdge = outEdges[0];
    const nextNodeId = nextEdge.target;
    const nextNode = this.nodes.get(nextNodeId);
    if (!nextNode) return [];

    const statements: ASTNode[] = [];
    
    switch (nextNode.type) {
      case 'declareVar': {
        const valExpr = this.resolveDataInput(nextNode.id, 'data-in-value', (nextNode.data.varType as any) || 'int');
        statements.push({
          type: 'VariableDeclaration' as const,
          name: (nextNode.data.varName as string) || 'unknownVar',
          valueType: (nextNode.data.varType as any) || 'int',
          value: valExpr
        });
        break;
      }
      case 'print': {
        const valExpr = this.resolveDataInput(nextNode.id, 'data-in-value', 'any');
        statements.push({
          type: 'FunctionCall' as const,
          functionName: 'fmt.Println',
          arguments: [valExpr]
        });
        break;
      }
      case 'if': {
        const condExpr = this.resolveDataInput(nextNode.id, 'data-in-condition', 'bool');

        const trueBranch = this.traverseExecution(nextNode.id, 'exec-out-true');
        const falseBranch = this.traverseExecution(nextNode.id, 'exec-out-false');

        statements.push({
          type: 'IfStatement' as const,
          condition: condExpr,
          consequent: trueBranch,
          alternate: falseBranch
        });
        
        // Code execution continues after the true/false branches
        const completedStatements = this.traverseExecution(nextNode.id, 'exec-out');
        statements.push(...completedStatements);
        
        return statements;
      }
      case 'for': {
        const startExpr = this.resolveDataInput(nextNode.id, 'data-in-start', 'int');
        const endExpr = this.resolveDataInput(nextNode.id, 'data-in-end', 'int');
        
        const loopBody = this.traverseExecution(nextNode.id, 'exec-out-loop');
        
        statements.push({
          type: 'ForStatement' as const,
          initName: (nextNode.data.indexName as string) || 'i',
          startValue: startExpr,
          endValue: endExpr,
          body: loopBody
        });
        
        // The rest of the program continues after the loop completes
        const completedStatements = this.traverseExecution(nextNode.id, 'exec-out-completed');
        statements.push(...completedStatements);
        
        return statements;
      }
      case 'arrayAppend': {
        const arrayExpr = this.resolveDataInput(nextNode.id, 'data-in-array', 'any');
        const elementExpr = this.resolveDataInput(nextNode.id, 'data-in-element', 'any');
        let arrayName = 'unknownArray';
        if (arrayExpr.type === 'Identifier') {
          arrayName = arrayExpr.name;
        }
        statements.push({
          type: 'ArrayAppend' as const,
          arrayName: arrayName,
          element: elementExpr
        });
        break;
      }
      case 'arraySet': {
        const arrayExpr = this.resolveDataInput(nextNode.id, 'data-in-array', '[]any');
        const indexExpr = this.resolveDataInput(nextNode.id, 'data-in-index', 'int');
        const valueExpr = this.resolveDataInput(nextNode.id, 'data-in-value', 'any');
        let arrayName = 'unknownArray';
        if (arrayExpr.type === 'Identifier') {
          arrayName = arrayExpr.name;
        }
        statements.push({
          type: 'ArrayElementAssignment' as const,
          arrayName: arrayName,
          index: indexExpr,
          value: valueExpr
        });
        break;
      }
      case 'forEach': {
        const arrayExpr = this.resolveDataInput(nextNode.id, 'data-in-array', '[]any');
        const loopBody = this.traverseExecution(nextNode.id, 'exec-out-loop');
        
        statements.push({
          type: 'ForEachStatement' as const,
          array: arrayExpr,
          itemName: (nextNode.data.itemName as string) || 'item',
          indexName: (nextNode.data.indexName as string) || 'index',
          body: loopBody
        });
        
        const completedStatements = this.traverseExecution(nextNode.id, 'exec-out-completed');
        statements.push(...completedStatements);
        
        return statements;
      }
    }

    // Traverse recursively if not 'if' branch ending early
    if (nextNode.type !== 'if' && nextNode.type !== 'for' && nextNode.type !== 'forEach') {
        const subsequentStatements = this.traverseExecution(nextNodeId, 'exec-out');
        statements.push(...subsequentStatements);
    }

    return statements;
  }

  private evaluateDataNode(nodeId: string, sourceHandle?: string | null): ASTNode {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return { type: 'Literal' as const, value: 0, valueType: 'int' as const };
    }

    switch (node.type) {
      case 'literal': {
        const type = node.data.type as string || 'int';
        let val: any = node.data.value;
        if (type === 'int') val = parseInt(val) || 0;
        if (type === 'float') val = parseFloat(val) || 0.0;
        if (type === 'bool') val = (val === 'true' || val === true);
        return { type: 'Literal' as const, value: val, valueType: type as any };
      }
      case 'getVar': {
        return { type: 'Identifier' as const, name: (node.data.varName as string) || 'unknownVar' };
      }
      case 'math': {
        const exprA = this.resolveDataInput(node.id, 'data-in-A', 'int');
        const exprB = this.resolveDataInput(node.id, 'data-in-B', 'int');
        
        return {
          type: 'BinaryExpression' as const,
          operator: (node.data.operator as any) || '+',
          left: exprA,
          right: exprB
        };
      }
      case 'compare': {
        const exprA = this.resolveDataInput(node.id, 'data-in-A', 'int');
        const exprB = this.resolveDataInput(node.id, 'data-in-B', 'int');
        
        return {
          type: 'BinaryExpression' as const,
          operator: (node.data.operator as any) || '==',
          left: exprA,
          right: exprB
        };
      }
      case 'for': {
        return { type: 'Identifier' as const, name: (node.data.indexName as string) || 'i' };
      }
      case 'declareVar': {
        return { type: 'Identifier' as const, name: (node.data.varName as string) || 'unknownVar' };
      }
      case 'arrayLiteral': {
        return { type: 'ArrayLiteral' as const, elements: [], valueType: (node.data.type as any) || '[]int' };
      }
      case 'arrayGet': {
        const arrayExpr = this.resolveDataInput(node.id, 'data-in-array', '[]any');
        const indexExpr = this.resolveDataInput(node.id, 'data-in-index', 'int');
        return { type: 'ArrayAccess' as const, array: arrayExpr, index: indexExpr };
      }
      case 'arrayAppend': {
        const arrayExpr = this.resolveDataInput(node.id, 'data-in-array', '[]any');
        let arrayName = 'unknownArray';
        if (arrayExpr.type === 'Identifier') {
          arrayName = arrayExpr.name;
        }
        return { type: 'Identifier' as const, name: arrayName };
      }
      case 'arrayLength': {
        const arrayExpr = this.resolveDataInput(node.id, 'data-in-array', '[]any');
        return { type: 'ArrayLength' as const, array: arrayExpr };
      }
      case 'forEach': {
        if (sourceHandle?.split(':')[0] === 'data-out-index') {
          return { type: 'Identifier' as const, name: (node.data.indexName as string) || 'index' };
        }
        return { type: 'Identifier' as const, name: (node.data.itemName as string) || 'item' };
      }
    }
    
    return { type: 'Literal' as const, value: 0, valueType: 'int' };
  }

  private resolveDataInput(targetNodeId: string, handlePrefix: string, expectedType: 'int' | 'float' | 'string' | 'bool' | 'any' | '[]any'): ASTNode {
    const edge = this.edges.find(e => e.target === targetNodeId && e.targetHandle?.split(':')[0] === handlePrefix);
    
    if (edge) {
      const key = `${edge.source}:${edge.sourceHandle}`;
      if (this.evaluating.has(key)) {
        throw new Error(`Data cycle detected at node "${edge.source}". Disconnect one of the pins in the cycle.`);
      }
      this.evaluating.add(key);
      try {
        return this.evaluateDataNode(edge.source, edge.sourceHandle);
      } finally {
        this.evaluating.delete(key);
      }
    }

    // Fallback logic
    const targetNode = this.nodes.get(targetNodeId);
    const fallbackValue = targetNode?.data?.[handlePrefix];

    if (fallbackValue !== undefined && fallbackValue !== '') {
      let parsedValue: any = fallbackValue;
      let resolvedType = expectedType === 'any' ? 'string' : expectedType;

      if (expectedType === 'int') {
        parsedValue = parseInt(fallbackValue) || 0;
      } else if (expectedType === 'float') {
        parsedValue = parseFloat(fallbackValue) || 0.0;
      } else if (expectedType === 'bool') {
        parsedValue = fallbackValue === 'true' || fallbackValue === true;
      } else if (expectedType === 'string') {
        parsedValue = String(fallbackValue);
      } else { // any - try to guess or fallback to string
        if (!isNaN(Number(fallbackValue))) {
          parsedValue = Number(fallbackValue);
          resolvedType = Number.isInteger(parsedValue) ? 'int' : 'float';
        } else if (fallbackValue === 'true' || fallbackValue === 'false') {
          parsedValue = fallbackValue === 'true';
          resolvedType = 'bool';
        }
      }

      return { type: 'Literal' as const, value: parsedValue, valueType: resolvedType as any };
    }

    // Default fallbacks if completely empty
    if (expectedType.startsWith('[]')) {
      return { type: 'ArrayLiteral' as const, elements: [], valueType: expectedType as any };
    }
    if (expectedType === 'int' || expectedType === 'float') return { type: 'Literal' as const, value: 0, valueType: expectedType as any };
    if (expectedType === 'bool') return { type: 'Literal' as const, value: false, valueType: 'bool' as const };
    if (expectedType === 'string') return { type: 'Literal' as const, value: '', valueType: 'string' as const };
    
    return { type: 'Literal' as const, value: 0, valueType: 'int' };
  }
}
