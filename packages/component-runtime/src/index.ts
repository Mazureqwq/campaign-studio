import type { Component } from 'vue'
import type { NodeType } from '@campaign/schema'

export interface ComponentDefinition { type: NodeType; label: string; component: Component }
export function createRegistry(definitions: ComponentDefinition[]) {
  return new Map(definitions.map((definition) => [definition.type, definition]))
}
