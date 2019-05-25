import { writable, get } from 'svelte/store'

export const selectedCtx = writable(null)
export const selectedNode = writable(null)
export const hoveredNode = writable(null)
export const rootNodes = writable([])
const nodeMap = new Map()

const port = browser.runtime.connect()
port.postMessage({
  type: 'init',
  id: browser.devtools.inspectedWindow.tabId
})
port.onMessage.addListener(msg => {
  switch (msg.type) {
    case 'init': {
      selectedCtx.set(null)
      selectedNode.set(null)
      hoveredNode.set(null)
      rootNodes.set([])

      break
    }

    case 'addNode': {
      msg.node.children = []

      const targetNode = nodeMap.get(msg.target)
      nodeMap.set(msg.node.id, msg.node)
      if (!targetNode) {
        rootNodes.update(o => (o.push(msg.node), o))
        return
      }

      msg.node.parent = targetNode
      if (msg.anchor) {
        const index = targetNode.children.findIndex(o => o.id == msg.anchor)
        targetNode.children.splice(index, 0, msg.node)
      } else {
        targetNode.children.push(msg.node)
      }

      break
    }

    case 'removeNode': {
      const node = nodeMap.get(msg.node.id)
      const index = node.parent.children.findIndex(o => o.id == node.id)
      node.parent.children.splice(index, 1)
      nodeMap.delete(node.id)

      break
    }

    case 'updateNode': {
      const node = nodeMap.get(msg.node.id)
      Object.assign(node, msg.node)

      const selected = get(selectedCtx)
      if (selected && selected.id == msg.node.id) selectedCtx.update(o => o)

      break
    }
  }
  rootNodes.update(o => o)
})
