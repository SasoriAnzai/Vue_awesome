/* @flow */

import { isPrimitive } from 'core/util/index'
import VNode from 'core/vdom/vnode'

export function normalizeChildren (children: any, ns: ?string): Array<VNode> | void {
  return isPrimitive(children)
    ? [createTextVNode(children)]
    : Array.isArray(children)
      ? normalizeArrayChildren(children, ns)
      : undefined
}

function normalizeArrayChildren (children: any, ns: ?string, nestedIndex?: string): Array<VNode> {
  const res = []
  let i, c, last
  for (i = 0; i < children.length; i++) {
    c = children[i]
    if (c == null) continue
    last = res[res.length - 1]
    //  nested
    if (Array.isArray(c)) {
      res.push.apply(res, normalizeArrayChildren(c, ns, `${nestedIndex || ''}_${i}`))
    } else if (isPrimitive(c)) {
      if (last && last.text) {
        last.text += String(c)
      } else if (c !== '') {
        // convert primitive to vnode
        res.push(createTextVNode(c))
      }
    } else {
      if (c.text && last && last.text) {
        if (!last.isCloned) {
          last.text += c.text
        }
      } else {
        // inherit parent namespace
        if (ns) {
          applyNS(c, ns)
        }
        // default key for nested array children (likely generated by v-for)
        if (c.tag && c.key == null && nestedIndex != null) {
          c.key = `__vlist${nestedIndex}_${i}__`
        }
        res.push(c)
      }
    }
  }
  return res
}

function createTextVNode (val) {
  return new VNode(undefined, undefined, undefined, String(val))
}

function applyNS (vnode, ns) {
  if (vnode.tag && !vnode.ns) {
    vnode.ns = ns
    if (vnode.children) {
      for (let i = 0, l = vnode.children.length; i < l; i++) {
        applyNS(vnode.children[i], ns)
      }
    }
  }
}
