export type ASTNode =
  | Program
  | VariableDeclaration
  | AssignmentExpression
  | BinaryExpression
  | IfStatement
  | ForStatement
  | FunctionCall
  | Identifier
  | Literal
  | ArrayLiteral
  | ArrayAccess
  | ArrayElementAssignment
  | ArrayAppend
  | ArrayLength
  | ForEachStatement;

export interface Program {
  type: 'Program';
  body: ASTNode[];
}

export interface VariableDeclaration {
  type: 'VariableDeclaration';
  name: string;
  valueType: 'int' | 'string' | 'bool' | 'float';
  value: ASTNode;
}

export interface AssignmentExpression {
  type: 'AssignmentExpression';
  name: string;
  value: ASTNode;
}

export interface BinaryExpression {
  type: 'BinaryExpression';
  operator: '+' | '-' | '*' | '/' | '%' | '==' | '!=' | '>' | '<' | '>=' | '<=' | '&&' | '||';
  left: ASTNode;
  right: ASTNode;
}

export interface IfStatement {
  type: 'IfStatement';
  condition: ASTNode;
  consequent: ASTNode[]; // block of code if true
  alternate?: ASTNode[]; // block of code if false
}

export interface FunctionCall {
  type: 'FunctionCall';
  functionName: string; // e.g. "fmt.Println"
  arguments: ASTNode[];
}

export interface Identifier {
  type: 'Identifier';
  name: string;
}

export interface Literal {
  type: 'Literal';
  value: string | number | boolean;
  valueType: 'int' | 'string' | 'bool' | 'float';
}

export interface ForStatement {
  type: 'ForStatement';
  initName: string;
  startValue: ASTNode;
  endValue: ASTNode;
  body: ASTNode[];
}

export interface ArrayLiteral {
  type: 'ArrayLiteral';
  elements: ASTNode[];
  valueType: '[]int' | '[]string' | '[]bool' | '[]float';
}

export interface ArrayAccess {
  type: 'ArrayAccess';
  array: ASTNode;
  index: ASTNode;
}

export interface ArrayElementAssignment {
  type: 'ArrayElementAssignment';
  arrayName: string;
  index: ASTNode;
  value: ASTNode;
}

export interface ArrayAppend {
  type: 'ArrayAppend';
  arrayName: string;
  element: ASTNode;
}

export interface ArrayLength {
  type: 'ArrayLength';
  array: ASTNode;
}

export interface ForEachStatement {
  type: 'ForEachStatement';
  array: ASTNode;
  itemName: string;
  indexName: string;
  body: ASTNode[];
}
